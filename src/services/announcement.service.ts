import { Announcement, AnnouncementReadEvent, Prisma } from '@prisma/client';
import { KafkaService } from '../components/kafka.component';
import {
  AnnouncementDto,
  AnnouncementResourceDto,
  CreateAnnouncementDto,
  QueryAnnouncementDto,
  SearchAnnouncementDto,
  UpdateAnnouncementDto,
  UpdateAnnouncementResourceDto,
} from '../domain/dto/announcement.dto';
import { AuthorizedUser, UserCategory } from '../domain/user.domain';
import { ForbiddenError, NotFoundError, ServerError } from '../errors/http-errors';
import * as resourceRepository from '../repositories/announcement-resource.repository';
import * as repository from '../repositories/announcement.repository';
import { ListWithPagination } from '../repositories/types';
import * as employeeService from '../services/employee.service';
import * as payrollCompanyService from '../services/payroll-company.service';
import { errors } from '../utils/constants';
import * as dateutil from '../utils/date.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { validateGradeLevels } from './grade-level.service';
import { EmployeeDto } from '../domain/events/employee.event';
import * as employeeRepository from '../repositories/employee.repository';
import { sendAnnouncementEmail } from '../utils/notification.util';
import { CronJob } from 'cron';
import config from '../config';
import * as readEventRepository from '../repositories/announcement-read-event.repository';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'AnnouncementService' });
const events = {
  created: 'event.Announcement.created',
  modified: 'event.Announcement.modified',
  resourceModified: 'event.AnnouncementResource.modified',
  deleted: 'event.Announcement.deleted'
} as const;

export async function addAnnouncement(
  creatData: CreateAnnouncementDto,
  authUser: AuthorizedUser,
): Promise<AnnouncementDto> {
  const { organizationId } = authUser;
  const { companyId, public: _public, targetGradeLevelIds = [] } = creatData;

  logger.debug('Validating Company[%s] & GradeLevels[%s]', companyId, targetGradeLevelIds);
  await Promise.all([
    payrollCompanyService.validatePayrollCompany(
      companyId,
      { organizationId, throwOnNotActive: true }
    ),
    (!_public && targetGradeLevelIds.length > 0)
      ? validateGradeLevels(targetGradeLevelIds, { companyId }) 
      : Promise.resolve(undefined)
  ]);
  logger.info('Company[%s] and GradeLevels[%s] validated', companyId, targetGradeLevelIds);

  // Clear targetGradeLevelIds if creating public announcement
  if (_public) {
    creatData.targetGradeLevelIds = [];
  }
 
  logger.debug('Adding new Announcement to the database...');
  let newAnnouncement: AnnouncementDto;
  try {
    newAnnouncement = await repository.create(
      creatData, { 
        company: true,
        resources: true,
        targetGradeLevels: { 
          include: {
            companyLevel: true
          }
        }
      }
    );
    logger.info('Announcement[%s] added successfully!', newAnnouncement.id);
  } catch (err) {
    logger.error('Adding Announcement failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Send email to recipients if daily announcement job has run already
  const now = new Date();
  const timeString = now.toTimeString().split(' ')[0];
  if(timeString > config.dailyCronJobTime) {
    logger.debug('Sending announcement email to recipients...');
    const recipients = await getAnnouncementRecipients(newAnnouncement.id);
    for (const recipient of recipients) {
      if (recipient.email) {
        await sendAnnouncementEmail({
          recipientEmail: recipient.email,
          recipientFirstName: recipient.firstName,
          announcementId: newAnnouncement.id
        });
      }
    }
    logger.debug('Announcement email sent to recipients');
    logger.debug('Setting announcement.recipientsNotified to true');
    try {
      await repository.update({
        where: { id: newAnnouncement.id },
        data: { recipientsNotified: true }
      });
      logger.info('Announcement[%s] recipientsNotified set to true', newAnnouncement.id);
    } catch (err) {
      logger.error(
        'Setting Announcement[%s] recipientsNotified to true failed',
        newAnnouncement.id, { error: err }
      );
    }
  }

  // Emit event.Announcement.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newAnnouncement);
  logger.info(`${events.created} event created successfully!`);

  return newAnnouncement;
}

export async function getAnnouncements(
  query: QueryAnnouncementDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<AnnouncementDto>> {
  const {
    page,
    limit: take,
    orderBy,
    companyId,
    active: queryActive,
    public: _public,
    targetGradeLevelId, 
    'publishDate.gte': publishDateGte,
    'publishDate.lte': publishDateLte,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, { companyId });

  const { employeeId, category } = authUser;
  const adminUser = category === UserCategory.HR || category === UserCategory.OPERATIONS;
  let gradeLevelId: number | undefined, active: boolean | undefined,
    defaultPublishDateLte: Date | undefined;
  if (adminUser) {
    gradeLevelId = targetGradeLevelId;
    active = queryActive;
    defaultPublishDateLte = publishDateLte 
      ? dateutil.getDate(new Date(publishDateLte), { days: 1 })
      : undefined;
  } else {
    const employee = await employeeService.getEmployee(employeeId!);
    gradeLevelId = employee.majorGradeLevelId ?? undefined;
    active = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (publishDateGte) {
      const publishDate = new Date(publishDateGte);
      publishDate.setHours(0, 0, 0, 0);
      if (publishDate > today) {
        throw new ForbiddenError({
          message: 'You are not allowed to access this resource'
        });
      }
    }

    if (publishDateLte) {
      const publishDate = new Date(publishDateLte);
      publishDate.setHours(0, 0, 0, 0);
      if (publishDate > today) {
        throw new ForbiddenError({
          message: 'You are not allowed to access this resource'
        });
      } else {
        defaultPublishDateLte = publishDateLte 
          ? dateutil.getDate(new Date(publishDateLte), { days: 1 })
          : undefined;
      }
    } else {
      defaultPublishDateLte = dateutil.getDate(new Date(), { days: 1 });
    }
  }

  logger.debug('Finding Announcement(s) that match query', { query });
  let result: ListWithPagination<AnnouncementDto>;
  try {
    result = await repository.find({
      skip,
      take,
      where: { 
        ...scopedQuery,
        OR: (_public === undefined && gradeLevelId) ? [
          { targetGradeLevels: { some: { id: gradeLevelId } } },
          { public: true },
        ] : (gradeLevelId !== undefined) ? [
          { targetGradeLevels: { some: { id: gradeLevelId } } }
        ] : undefined,
        public: _public,
        active,
        publishDate: {
          gte: publishDateGte && new Date(publishDateGte),
          lt: defaultPublishDateLte
        } 
      },
      orderBy: orderByInput,
      include: { 
        company: true,
        resources: true,
        targetGradeLevels: { 
          include: {
            companyLevel: true
          }
        }
      }
    });
    logger.info(
      'Found %d Announcement(s) that matched query',
      result.data.length, { query }
    );
  } catch (err) {
    logger.warn(
      'Querying Announcement with query failed',
      { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
} 

export async function getAnnouncement(
  id: number,
  authUser: AuthorizedUser
): Promise<AnnouncementDto> {
  logger.debug('Getting details for Announcement[%s]', id);
  let announcement: AnnouncementDto | null;

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, {});

  const { employeeId, category } = authUser;
  const adminUser = category === UserCategory.HR || category === UserCategory.OPERATIONS;
  let gradeLevelId: number | undefined, active: boolean | undefined;
  if (!adminUser) {
    const employee = await employeeService.getEmployee(employeeId!);
    gradeLevelId = employee.majorGradeLevelId ? employee.majorGradeLevelId : undefined;
    active = true;
  }

  try {
    announcement = await repository.findFirst({
      id,
      ...scopedQuery,
      OR: (!adminUser) ? [
        { targetGradeLevels: { some: { id: gradeLevelId } } },
        { public: true },
      ] : undefined,
      active,
    }, 
    { 
      company: true,
      resources: true,
      targetGradeLevels: { 
        include: {
          companyLevel: true
        }
      }
    });
  } catch (err) {
    logger.warn('Getting Announcement[%s] failed', id, { error: (err as Error).stack });
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  if (!announcement) {
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_NOT_FOUND,
      message: 'Announcement does not exist'
    });
  }

  logger.info('Announcement[%s] details retrieved!', id);
  return announcement;
}

export async function searchAnnouncements(
  query: SearchAnnouncementDto,
  authUser: AuthorizedUser
): Promise<ListWithPagination<AnnouncementDto>> {
  const {
    q: searchParam,
    page,
    limit: take,
    orderBy,
  } = query;
  const skip = helpers.getSkip(page, take);
  const orderByInput = helpers.getOrderByInput(orderBy);

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, {});

  const { employeeId, category } = authUser;
  const adminUser = category === UserCategory.HR || category === UserCategory.OPERATIONS;
  let gradeLevelId: number | undefined, active: boolean | undefined,
    defaultPublishDateLte: Date | undefined;
  if (!adminUser) {
    const employee = await employeeService.getEmployee(employeeId!);
    gradeLevelId = employee.majorGradeLevelId ?? undefined;
    active = true;
    defaultPublishDateLte = dateutil.getDate(new Date(), { days: 1 });
  }

  logger.debug('Finding Announcement(s) that match search query', { query });
  let result: ListWithPagination<AnnouncementDto>;
  try {
    result = await repository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
        ...scopedQuery,
        publishDate: {
          lt: defaultPublishDateLte
        },
        OR: (!adminUser) ? [
          { targetGradeLevels: { some: { id: gradeLevelId } } },
          { public: true },
        ] : undefined,
        active,
        title: {
          search: searchParam,
        },
        body: {
          search: searchParam,
        },
      },
      include: { 
        company: true,
        resources: true,
        targetGradeLevels: { 
          include: {
            companyLevel: true
          }
        }
      }
    });
    logger.info('Found %d Announcement(s) that matched query', { query });
  } catch (err) {
    logger.warn(
      'Searching Announcement with query failed',
      { query }, { error: err as Error }
    );
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return result;
}

export async function updateAnnouncement(
  id: number, 
  updateData: UpdateAnnouncementDto,
  authUser: AuthorizedUser
): Promise<AnnouncementDto> {
  const {
    unassignedTargetGradeLevelIds = [],
    public: _public
  } = updateData;
  let announcementReadEvent: AnnouncementReadEvent | null;
  try {
    announcementReadEvent = await readEventRepository.findFirst({ id });
  } catch (err) {
    logger.warn(
      'Getting AnnouncementReadEvent for Announcement[%s] failed', 
      id, { error: (err as Error).stack }
    );
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  logger.debug('Finding Announcement[%s] to update', id);
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, {});
  const announcement = await repository.findFirst({ id, ...scopedQuery });
  if (!announcement) {
    logger.warn('Announcement[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_NOT_FOUND,
      message: 'Announcement to update does not exist'
    });
  }
  logger.info('Announcement[%s] to update exists', id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Prevent update if announcement publish date is in the future
  // and announcement has been read by any employee
  if (announcement.publishDate < today && announcementReadEvent) {
    throw new ForbiddenError({
      message: 'You are not allowed to update this resource'
    });
  }

  // If updating announcement to public,
  // clear target grade level ids to assign
  // and set all existing target grade level ids to be unassigned
  if (_public) {
    updateData.assignedTargetGradeLevelIds = [];
    announcement.targetGradeLevels?.forEach(
      x => { unassignedTargetGradeLevelIds.push(x.id); }
    );
  }

  const { assignedTargetGradeLevelIds = [] } = updateData;

  // Check if all target grade level ids to assign,
  // belong to same company as announcement
  if (assignedTargetGradeLevelIds.length > 0) {
    logger.debug('Validating GradeLevel(s)[%s] to assign', assignedTargetGradeLevelIds);
    await validateGradeLevels(
      assignedTargetGradeLevelIds,
      { companyId: announcement.companyId }
    );
    logger.info('GradeLevel(s)[%s] validated', assignedTargetGradeLevelIds);
  }

  logger.debug('Persisting update(s) to Announcement[%s]', id);
  const updatedAnnouncement = await repository.update({
    where: { id },
    data: updateData,
    include: {
      company: true,
      resources: true,
      targetGradeLevels: {
        include: {
          companyLevel: true
        }
      }
    }
  });
  logger.info('Update(s) to Announcement[%s] persisted successfully!', id);

  // Emit event.Announcement.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedAnnouncement);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedAnnouncement;
}

export async function deleteAnnouncement(
  id: number,
  authUser: AuthorizedUser
): Promise<void> {
  logger.debug('Finding Announcement[%s] to remove', id);
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, {});
  const announcement = await repository.findFirst({ id, ...scopedQuery });
  if (!announcement) {
    logger.warn('Announcement[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_NOT_FOUND,
      message: 'Announcement to delete does not exisit'
    });
  }
  logger.info('Announcement[%s] to remove exists', id);

  logger.debug('Deleting Announcement[%s] from database...', id);
  let deletedAnnouncement: Announcement;
  try {
    deletedAnnouncement = await repository.deleteOne({ id });
    logger.info('Announcement[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting Announcement[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }

  // Emit event.Announcement.deleted event
  logger.debug(`Emitting ${events.deleted}`);
  kafkaService.send(events.modified, deletedAnnouncement);
  logger.info(`${events.modified} event emitted successfully!`);
}

export async function updateAnnouncementResource(
  announcementId: number, 
  id: number,
  updateData: UpdateAnnouncementResourceDto,
  authUser: AuthorizedUser,
): Promise<AnnouncementResourceDto> {
  logger.debug(
    'Finding Announcement[%s] Resource[%s] to update',
    announcementId, id
  );
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, {});
  const announcementResource = await resourceRepository.findFirst({
    announcementId,
    id,
    announcement: scopedQuery,
  });
  if (!announcementResource) {
    logger.warn(
      'Announcement[%s] Resource[%s] to update does not exist',
      announcementId, id
    );
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_RESOURCE_NOT_FOUND,
      message: 'Announcement resource to update does not exisit'
    });
  }

  logger.debug('Persisting update(s) to AnnouncementResource[%s]', id);
  const updatedAnnouncementResource = await resourceRepository.update({
    where: { id, announcementId },
    data: updateData,
    include: { announcement: true },
  });
  logger.info(
    'Update(s) to AnnouncementResource[%s] persisted successfully!',
    id
  );

  // Emit event.AnnouncementResource.modified event
  logger.debug(`Emitting ${events.resourceModified}`);
  kafkaService.send(events.resourceModified, updatedAnnouncementResource);
  logger.info(`${events.resourceModified} event emitted successfully!`);

  return updatedAnnouncementResource;
}

export async function getAnnouncementRecipientCount(
  announcementId: number,
): Promise<number> {
  logger.debug('Getting Announcement[%s]', announcementId);
  const announcement = await repository.findOne(
    { id: announcementId },
    { targetGradeLevels: true }
  );
  if (!announcement) {
    logger.warn('Announcement[%s] does not exist', announcementId);
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_NOT_FOUND,
      message: 'Announcement does not exist'
    });
  }
  const { public: _public, targetGradeLevels } = announcement;
  const targetGradeLevelIds = targetGradeLevels?.map((gradeLevel) => gradeLevel.id);
  
  let countEmployeesObject: Prisma.EmployeeWhereInput;
  if (!_public) {
    countEmployeesObject = {
      majorGradeLevelId: targetGradeLevelIds ?
        { in: targetGradeLevelIds }
        : undefined,
      companyId: announcement.companyId
    };
  } else {
    countEmployeesObject = { companyId: announcement.companyId };
  }
  logger.debug('Getting Announcement[%s] recipient count', announcementId);
  const count = await employeeService.countEmployees(countEmployeesObject);
  logger.info('Announcement[%s] recipient count retrieved successfully!', announcementId);
  return count;
}

export async function getAnnouncementRecipients(
  announcementId: number,
): Promise<EmployeeDto[]> {
  logger.debug('Getting Announcement[%s]', announcementId);
  const announcement = await repository.findOne(
    { id: announcementId },
    { targetGradeLevels: true }
  );
  if (!announcement) {
    logger.warn('Announcement[%s] does not exist', announcementId);
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_NOT_FOUND,
      message: 'Announcement does not exist'
    });
  }
  const { public: _public, targetGradeLevels } = announcement;
  const targetGradeLevelIds = targetGradeLevels?.map((gradeLevel) => gradeLevel.id);
  
  let queryEmployeesObject: Prisma.EmployeeWhereInput;
  if (!_public) {
    queryEmployeesObject = {
      majorGradeLevelId: targetGradeLevelIds ?
        { in: targetGradeLevelIds }
        : undefined,
      companyId: announcement.companyId
    };
  } else {
    queryEmployeesObject = { companyId: announcement.companyId };
  }
  logger.debug('Getting Announcement[%s] recipients', announcementId);
  const employees = await employeeRepository.find({
    where: queryEmployeesObject
  });
  logger.info('Announcement[%s] recipients retrieved successfully!', announcementId);
  return employees.data;
}

export const announcementDailyJob = new CronJob(
  config.dailyCronJobTime, // cronTime
  async function () {
    logger.debug('Starting announcement daily job');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const announcements = await repository.find({ 
      where: {
        active: true,
        publishDate: today,
      }
    });
    for (const announcement of announcements.data) {
      const recipients = await getAnnouncementRecipients(announcement.id);
      for (const recipient of recipients) {
        if (recipient.email) {
          await sendAnnouncementEmail({
            recipientEmail: recipient.email,
            recipientFirstName: recipient.firstName,
            announcementId: announcement.id
          });
        }
      }
      logger.debug('Announcement email sent to recipients');
      logger.debug('Setting announcement.recipientsNotified to true');
      try {
        await repository.update({
          where: { id: announcement.id },
          data: { recipientsNotified: true }
        });
        logger.info('Announcement[%s] recipientsNotified set to true', announcement.id);
      } catch (err) {
        logger.error(
          'Setting Announcement[%s] recipientsNotified to true failed',
          announcement.id, { error: err }
        );
      }
    }
  },
);

export async function mannuallySendAnnouncementEmail(): Promise<void> {
  logger.debug('Starting process to send announcement notification email to recipients');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const announcements = await repository.find({ 
    where: {
      active: true,
      publishDate: today,
      recipientsNotified: false,
    }
  });
  for (const announcement of announcements.data) {
    const recipients = await getAnnouncementRecipients(announcement.id);
    for (const recipient of recipients) {
      if (recipient.email) {
        await sendAnnouncementEmail({
          recipientEmail: recipient.email,
          recipientFirstName: recipient.firstName,
          announcementId: announcement.id
        });
      }
    }
    logger.debug('Announcement email sent to recipients');
    logger.debug('Setting announcement.recipientsNotified to true');
    try {
      await repository.update({
        where: { id: announcement.id },
        data: { recipientsNotified: true }
      });
      logger.info('Announcement[%s] recipientsNotified set to true', announcement.id);
    } catch (err) {
      logger.error(
        'Setting Announcement[%s] recipientsNotified to true failed',
        announcement.id, { error: err }
      );
    }
  }
}