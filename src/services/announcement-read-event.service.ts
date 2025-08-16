import { KafkaService } from '../components/kafka.component';
import {
  AnnouncementReadEventDto,
  AnnouncementReadEventResponseDto,
  CreateAnnouncementReadEventDto,
  ReadEventSummmaryDto,
} from '../domain/dto/announcement-read-event.dto';
import { AuthorizedUser, UserCategory } from '../domain/user.domain';
import { ServerError } from '../errors/http-errors';
import * as repository from '../repositories/announcement-read-event.repository';
import * as announcementRepository from '../repositories/announcement.repository';
import { ListWithPagination } from '../repositories/types';
import * as employeeService from '../services/employee.service';
import * as announcementService from '../services/announcement.service';
import * as dateutil from '../utils/date.util';
import * as helpers from '../utils/helpers';
import { rootLogger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { QueryAnnouncementDto } from '../domain/dto/announcement.dto';
import { QueryEmployeesNoPaginationDto } from '../domain/events/employee.event';


const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'AnnouncementReadEventService' });
const events = {
  created: 'event.AnnouncementReadEvent.created',
} as const;

export async function addAnnouncementReadEvent(
  announcementId: number,
  creatData: CreateAnnouncementReadEventDto,
  authUser: AuthorizedUser,
): Promise<AnnouncementReadEventDto> {
  const { employeeId } = creatData;

  logger.debug('Validating Announcement[%s] & Employee[%s]', announcementId, employeeId);
  await Promise.all([
    employeeService.validateEmployee(employeeId, authUser),
    announcementService.getAnnouncement(announcementId, authUser)
  ]);
  logger.info('Announcement[%s] & Employee[%s] validated', announcementId, employeeId);
 
  logger.debug('Adding new AnnouncementReadEvent to the database...');
  let newAnnouncementReadEvent: AnnouncementReadEventDto;
  try {
    newAnnouncementReadEvent = await repository.create(
      { ...creatData, announcementId }, 
      { 
        employee: true,
        announcement: true,
      }
    );
    logger.info('AnnouncementReadEvent[%s] added successfully!', newAnnouncementReadEvent.id);
  } catch (err) {
    logger.error('Adding AnnouncementReadEvent failed', { error: err });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  // Emit event.AnnouncementReadEvent.created event
  logger.debug(`Emitting ${events.created} event`);
  kafkaService.send(events.created, newAnnouncementReadEvent);
  logger.info(`${events.created} event created successfully!`);

  return newAnnouncementReadEvent;
}

export async function getAnnouncementReadEventSummary(
  announcementId: number,
  authUser: AuthorizedUser,
): Promise<AnnouncementReadEventResponseDto> {  
  const announcement = await announcementService.getAnnouncement(announcementId, authUser);
  const targetGradeLevels = announcement.targetGradeLevels;
  const targetGradeLevelIds: number[] | undefined = [];
  targetGradeLevels?.forEach((gradeLevel) => {
    targetGradeLevelIds.push(gradeLevel.id);
  });
  let countEmployeesObject: QueryEmployeesNoPaginationDto;
  if (announcement.public === true) {
    countEmployeesObject = {
      gradeLevels: targetGradeLevelIds,
      companyId: announcement.companyId
    };
  } else {
    countEmployeesObject = { companyId: announcement.companyId };
  }

  const recipientCount = await employeeService.countEmployees(countEmployeesObject);
  const readCount = await repository.count({ 
    announcementId,
    employee: { ...countEmployeesObject }
  });
  const readRatio: Decimal = new Decimal((readCount/recipientCount)*100);
  return {
    recipientCount,
    readCount,
    readRatio,
    announcement
  }; 
}

export async function getAnnouncementReadEventSummaryList(
  query: Omit <QueryAnnouncementDto, 'orderBy'>,
  authUser: AuthorizedUser,
): Promise<AnnouncementReadEventResponseDto[]> {
  const { companyId } = query;
  const publishDateGte = query ? query?.['publishDate.gte'] : undefined;
  const publishDateLte = query ? query?.['publishDate.lte'] : undefined;
  const { employeeId, category } = authUser;
  const adminUser = category === UserCategory.HR || category === UserCategory.OPERATIONS;
  let gradeLevelId: number | undefined, active: boolean | undefined;
  if (adminUser) {
    gradeLevelId = query?.targetGradeLevelId;
    active = query?.active;
  } else {
    const employee = await employeeService.getEmployee(employeeId!);
    gradeLevelId = employee.majorGradeLevelId ?? undefined;
    active = true;
  }
  const { scopedQuery } = await helpers.applyCompanyScopeToQuery(authUser, { companyId });
  const announcements = await announcementRepository.find({
    where: {
      ...scopedQuery,
      companyId: query?.companyId,
      OR: (query?.public === undefined && gradeLevelId) ? [
        { targetGradeLevels: { some: { id: gradeLevelId } } },
        { public: true },
      ] : (gradeLevelId !== undefined) ? [
        { targetGradeLevels: { some: { id: gradeLevelId } } }
      ] : undefined,
      public: query?.public,
      active,
      publishDate: {
        gte: publishDateGte && new Date(publishDateGte),
        lt: publishDateLte && dateutil.getDate(new Date(publishDateLte), { days: 1 })
      } 
    }
  });
  const announcementSummaryList: AnnouncementReadEventResponseDto[] = [];
  for (const announcement of announcements.data) {
    const summary = await getAnnouncementReadEventSummary(
      announcement.id, authUser
    );
    announcementSummaryList.push(summary);
  }
  return announcementSummaryList;
}

export async function getReadEventDetails(
  announcementId: number,
): Promise<ReadEventSummmaryDto[]> {
  logger.debug('Getting AnnouncementReadEvent for Announcement[%s]', announcementId);
  let result: ListWithPagination<AnnouncementReadEventDto>;
  try {
    result = await repository.find({
      where: { announcementId },
      include: { 
        employee: { include: { jobTitle: true } },
        announcement: { include: { targetGradeLevels: true } }
      }
    });
    logger.info('Found %d AnnouncementReadEvent(s)for Announcement[%s]', announcementId);
  } catch (err) {
    logger.warn('Getting AnnouncementReadEvent for Announcement[%s]', announcementId);
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }
  const summary: ReadEventSummmaryDto[] = [];
  result.data.forEach((readEvent) => {
    if ( readEvent.employee) {
      summary.push({
        employee: {
          fullName: `${readEvent.employee?.firstName} ${readEvent.employee?.lastName}`,
          jobTitle: {
            id: readEvent.employee.jobTitle?.id,
            code : readEvent.employee.jobTitle?.code,
            name : readEvent.employee.jobTitle?.name
          },
          department: {
            id : readEvent.employee.department?.id,
            code : readEvent.employee.department?.code,
            name : readEvent.employee.department?.name
          },
        },
        timestamp: readEvent.timestamp
      });
    }
  });

  return summary;
}
