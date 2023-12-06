import { Holiday, HOLIDAY_TYPE } from '@prisma/client';
import { HolidayEvent } from '../domain/events/holiday.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/holiday.repository';
import { countQueryObject } from '../domain/dto/holiday.dto';
import { ServerError } from '../errors/http-errors';
import { calculateDaysBetweenDates } from '../utils/helpers';

const logger = rootLogger.child({ context: 'HolidayService' });

export async function createOrUpdateHoliday(
  data: Omit<HolidayEvent, 'createdAt' | 'modifiedAt'>
): Promise<Holiday> {
  logger.debug(
    'Saving Holiday[%s]',
    data.id,
  );
  const gradeLevel = await repository.createOrUpdate({
    id: data.id,
    organizationId: data.organizationId,
    name: data.name,
    code: data.code,
    description: data.description,
    type: data.type,
    date: data.date,
  });
  logger.info(
    'GradeLevel[%s] saved',
    data.id
  );

  return gradeLevel;
}

export async function getWorkingDays(params: countQueryObject): Promise<number> {
  const {
    startDate,
    endDate,
    excludeHolidays,
    excludeWeekends
  } = params;
  let exclude;
  if (excludeHolidays) {
    exclude = HOLIDAY_TYPE.PUBLIC_HOLIDAY;
  } else if (excludeWeekends) {
    exclude = HOLIDAY_TYPE.WEEKEND;
  } else {
    exclude = undefined;
  }

  let nonWorkingDays: number;
  try {
    nonWorkingDays = await repository.count({
      date: {
        lte: endDate,
        gte: startDate,
      },
      type: { not: exclude }
    });
  } catch (err) {
    logger.warn('Getting non working days failed', { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }
  const differenceInDays = await calculateDaysBetweenDates(startDate, endDate);
  
  const numberOfDays = differenceInDays - nonWorkingDays;

  return numberOfDays;
}

export async function getNonWorkingDays(params: countQueryObject): Promise<number> {
  const {
    startDate,
    endDate,
    excludeHolidays,
    excludeWeekends
  } = params;
  let exclude;
  if (excludeHolidays) {
    exclude = HOLIDAY_TYPE.PUBLIC_HOLIDAY;
  } else if (excludeWeekends) {
    exclude = HOLIDAY_TYPE.WEEKEND;
  } else {
    exclude = undefined;
  }

  let nonWorkingDays: number;
  try {
    nonWorkingDays = await repository.count({
      date: {
        lte: endDate,
        gte: startDate,
      },
      type: { not: exclude }
    });
  } catch (err) {
    logger.warn('Getting non working days failed', { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  return nonWorkingDays;
}