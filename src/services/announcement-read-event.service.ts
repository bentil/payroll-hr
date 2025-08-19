import { KafkaService } from '../components/kafka.component';
import {
  AnnouncementReadEventDto,
  AnnouncementReadEventResponseDto,
  CreateAnnouncementReadEventDto,
  ReadEventSummmaryDto,
} from '../domain/dto/announcement-read-event.dto';
import { AuthorizedUser } from '../domain/user.domain';
import { ServerError } from '../errors/http-errors';
import * as repository from '../repositories/announcement-read-event.repository';
import { ListWithPagination } from '../repositories/types';
import * as employeeService from '../services/employee.service';
import * as announcementService from '../services/announcement.service';
import { rootLogger } from '../utils/logger';
import { Decimal } from '@prisma/client/runtime/library';
import { QueryAnnouncementDto } from '../domain/dto/announcement.dto';
import { Prisma } from '@prisma/client';
import { EmployeeDto } from '../domain/events/employee.event';

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

  logger.debug(
    'Validating Announcement[%s], Employee[%s] & checking if ReadEvent already exist', 
    announcementId, employeeId
  );
  const [_, __, announcementReadEvent] = await Promise.all([
    employeeService.validateEmployee(employeeId, authUser),
    announcementService.getAnnouncement(announcementId, authUser),
    repository.findOne(
      { employeeId_announcementId: { announcementId, employeeId } }, 
      { employee: true, announcement: true } 
    ),
  ]);
  logger.info('Announcement[%s] & Employee[%s] validated', announcementId, employeeId);
 
  if (announcementReadEvent) {
    return announcementReadEvent;
  }
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

  const recipientCount = await announcementService.getAnnouncementRecipientCount(announcementId);
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
  query: QueryAnnouncementDto,
  authUser: AuthorizedUser,
): Promise<AnnouncementReadEventResponseDto[]> {
  const announcements = await announcementService.getAnnouncements(
    query,
    authUser
  );
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
        employee: { 
          include: { 
            jobTitle: true,
            department: true
          },
        },
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
  const summary: ReadEventSummmaryDto[] = result.data.map((readEvent) => {
    const { employee: readEventEmployee } = readEvent;
    const employee = readEventEmployee as EmployeeDto;
    return  {
      employee: {
        fullName: `${employee.firstName} ${employee.lastName}`,
        jobTitle: {
          id: employee.jobTitle?.id,
          code : employee.jobTitle?.code,
          name : employee.jobTitle?.name
        },
        department: {
          id : employee.department?.id,
          code : employee.department?.code,
          name : employee.department?.name
        },
      },
      timestamp: readEvent.timestamp
    };
  });
  return summary;
}