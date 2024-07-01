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
import * as repository from '../repositories/announcement.repository';
import * as payrollCompanyService from '../services/payroll-company.service';
import * as employeeService from '../services/employee.service';
import * as resourceRepository from '../repositories/announcement-resource.repository';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import {
  NotFoundError, 
  ServerError 
} from '../errors/http-errors';
import { ListWithPagination } from '../repositories/types';
import { errors } from '../utils/constants';
import { AuthorizedUser, UserCategory } from '../domain/user.domain';
import * as dateutil from '../utils/date.util';
import { Announcement } from '@prisma/client';
import { validateGradeLevels } from './grade-level.service';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'AnnouncementService' });

const events = {
  created: 'event.Announcement.created',
  modified: 'event.Announcement.modified',
  resourceModified: 'event.AnnouncementResource.modified',
  deleted: 'event.Announcement.deleted'
};

export async function addAnnouncement(
  creatData: CreateAnnouncementDto,
): Promise<AnnouncementDto> {
  const { companyId, public: _public } = creatData;

  // VALIDATION
  await Promise.all([
    payrollCompanyService.validatePayrollCompany(companyId, { throwOnNotActive: true }),
    creatData.targetGradeLevelIds 
      ? validateGradeLevels(creatData.targetGradeLevelIds, { companyId }) 
      : Promise.resolve(undefined)
  ]);

  if (_public) {
    creatData.targetGradeLevelIds = [];
  }
  
  logger.info('All the TargetGradeLevels[%s] passed exists', creatData.targetGradeLevelIds);
 
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
  const { employeeId, category } = authUser;
  let gradeLevelId: number | undefined, active: boolean | undefined;
  if (category === UserCategory.HR) {
    gradeLevelId = targetGradeLevelId;
    active = queryActive;
  } else {
    const employee = await employeeService.getEmployee(employeeId!);
    gradeLevelId = employee.majorGradeLevelId ? employee.majorGradeLevelId : undefined;
    active = true;
  }
  
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, { companyId });

  let result: ListWithPagination<AnnouncementDto>;
  try {
    logger.debug('Finding Announcement(s) that matched query', { query });
    result = await repository.find({
      skip,
      take,
      where: { 
        ...scopedQuery,
        targetGradeLevels: { some: { id: gradeLevelId } },
        public: _public,
        active,
        publishDate: {
          gte: publishDateGte && new Date(publishDateGte),
          lt: publishDateLte && dateutil.getDate(new Date(publishDateLte), { days: 1 })
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
    logger.info('Found %d Announcement(s) that matched query', result.data.length, { query });
  } catch (err) {
    logger.warn('Querying Announcement with query failed', { query }, { error: err as Error });
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

  const { employeeId, category } = authUser;
  let gradeLevelId: number | undefined, active: boolean | undefined;
  if (category !== UserCategory.HR) {
    const employee = await employeeService.getEmployee(employeeId!);
    gradeLevelId = employee.majorGradeLevelId ? employee.majorGradeLevelId : undefined;
    active = true;
  }
  
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, { });

  try {
    announcement = await repository.findFirst({
      id,
      ...scopedQuery,
      targetGradeLevels: { some: { id: gradeLevelId } },
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

  const { employeeId, category } = authUser;
  let gradeLevelId: number | undefined, active: boolean | undefined;
  if (category !== UserCategory.HR) {
    const employee = await employeeService.getEmployee(employeeId!);
    gradeLevelId = employee.majorGradeLevelId ? employee.majorGradeLevelId : undefined;
    active = true;
  }

  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, { });


  let result: ListWithPagination<AnnouncementDto>;
  try {
    logger.debug('Finding Announcement(s) that matched search query', { query });
    result = await repository.search({
      skip,
      take,
      orderBy: orderByInput,
      where: {
        ...scopedQuery,
        targetGradeLevels: { some: { id: gradeLevelId } },
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
    logger.warn('Searching Announcement with query failed', { query }, { error: err as Error });
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
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, { });
  const announcement = await repository.findFirst({ id, ...scopedQuery });
  if (!announcement) {
    logger.warn('Announcement[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_NOT_FOUND,
      message: 'Announcement to update does not exist'
    });
  }
  const { 
    unassignedTargetGradeLevelIds = [],
    public: _public
  } = updateData;

  if (updateData.assignedTargetGradeLevelIds?.length !== 0) {
    await validateGradeLevels(
      updateData.assignedTargetGradeLevelIds!, { companyId: announcement.companyId }
    );
  }

  if (_public) {
    updateData.assignedTargetGradeLevelIds = [];
    announcement.targetGradeLevels?.forEach((x) => { unassignedTargetGradeLevelIds.push(x.id); });
  }

  logger.debug('Persisting update(s) to Announcement[%s]', id);
  const updatedAnnouncement = await repository.update({
    where: { id }, data: updateData, include: { 
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
  let deletedAnnouncement: Announcement;
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, { });
  const announcement = await repository.findFirst({ id, ...scopedQuery });
  if (!announcement) {
    logger.warn('Announcement[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_NOT_FOUND,
      message: 'Announcement to delete does not exisit'
    });
  }

  logger.debug('Deleting Announcement[%s] from database...', id);
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
  id: number, 
  resourceId: number,
  updateData: UpdateAnnouncementResourceDto
): Promise<AnnouncementResourceDto> {

  const announcementResource = 
    await resourceRepository.findOne({ announcementId: id, id: resourceId });
  if (!announcementResource) {
    logger.warn('AnnouncementResource[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.ANNOUNCEMENT_RESOURCE_NOT_FOUND,
      message: 'Announcement resource to update does not exisit'
    });
  }

  logger.debug('Persisting update(s) to AnnouncementResource[%s]', resourceId);
  const updatedAnnouncementResource = await resourceRepository.update({
    where: { id: resourceId, announcementId: id }, data: updateData, include: { announcement: true }
  });
  logger.info('Update(s) to AnnouncementResource[%s] persisted successfully!', id);

  // Emit event.AnnouncementResource.modified event
  logger.debug(`Emitting ${events.resourceModified}`);
  kafkaService.send(events.resourceModified, updatedAnnouncementResource);
  logger.info(`${events.resourceModified} event emitted successfully!`);

  return updatedAnnouncementResource;
}