import { Holiday, HOLIDAY_TYPE, Prisma } from '@prisma/client';
import { HolidayEvent } from '../domain/events/holiday.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/holiday.repository';
import { CountNonWorkingDaysQueryObject, CountQueryObject } from '../domain/dto/holiday.dto';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { calculateDaysBetweenDates } from '../utils/helpers';
import { errors } from '../utils/constants';

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

export async function countWorkingDays(params: CountQueryObject): Promise<number> {
  const {
    startDate,
    endDate,
    considerPublicHolidayAsWorkday,
    considerWeekendAsWorkday
  } = params;

  
  const nonWorkingDays = await countNonWorkingDays({
    startDate,
    endDate,
    excludeHolidays: considerPublicHolidayAsWorkday,
    excludeWeekends: considerWeekendAsWorkday
  });

  const differenceInDays = await calculateDaysBetweenDates(startDate, endDate);

  const numberOfDays = differenceInDays - nonWorkingDays;

  return numberOfDays;
}

export async function countNonWorkingDays(params: CountNonWorkingDaysQueryObject): Promise<number> {
  const {
    startDate,
    endDate,
    excludeHolidays,
    excludeWeekends
  } = params;
  let exclude: Prisma.EnumHOLIDAY_TYPEFilter | undefined;
  if (excludeHolidays && excludeWeekends) {
    exclude = { notIn: [HOLIDAY_TYPE.PUBLIC_HOLIDAY, HOLIDAY_TYPE.WEEKEND] };
  } else if (excludeHolidays) {
    exclude = { not:  HOLIDAY_TYPE.PUBLIC_HOLIDAY };
  } else if (excludeWeekends) {
    exclude = { not: HOLIDAY_TYPE.WEEKEND };
  }

  let nonWorkingDays: number;
  try {
    nonWorkingDays = await repository.count({
      date: {
        lte: endDate,
        gte: startDate,
      },
      type: exclude
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

export async function deleteHoliday(id: number): Promise<void> {
  const holiday = await repository.findOne({ id });
  if (!holiday) {
    logger.warn('Holiday[%s] to delete does not exist', id);
    throw new NotFoundError({
      name: errors.HOLIDAY_NOT_FOUND,
      message: 'Holiday to delete does not exisit'
    });
  }

  logger.debug('Deleting Holiday[%s] from database...', id);
  try {
    await repository.deleteOne({ id });
    logger.info('Holiday[%s] successfully deleted', id);
  } catch (err) {
    logger.error('Deleting Holiday[%] failed', id);
    throw new ServerError({ message: (err as Error).message, cause: err });
  }
}