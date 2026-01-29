import { Holiday, HOLIDAY_TYPE, Prisma } from '@prisma/client';
import { HolidayEvent } from '../domain/events/holiday.event';
import { rootLogger } from '../utils/logger';
import * as repository from '../repositories/holiday.repository';
import { CountNonWorkingDaysQueryObject, CountQueryObject } from '../domain/dto/holiday.dto';
import { NotFoundError, ServerError } from '../errors/http-errors';
import { calculateDaysBetweenDates, calculateDaysFromDates } from '../utils/helpers';
import { errors } from '../utils/constants';
import { ListWithPagination } from '../repositories/types';

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
    considerWeekendAsWorkday,
    organizationId
  } = params;
  
  const nonWorkingDays = await countNonWorkingDays({
    startDate,
    endDate,
    excludeHolidays: considerPublicHolidayAsWorkday,
    excludeWeekends: considerWeekendAsWorkday,
    organizationId
  });

  const differenceInDays = await calculateDaysFromDates(startDate, endDate);

  const numberOfDays = differenceInDays - nonWorkingDays;


  return numberOfDays;
}

export async function countWorkingDaysForAdjustment(params: CountQueryObject): Promise<number> {
  const {
    startDate,
    endDate,
    considerPublicHolidayAsWorkday,
    considerWeekendAsWorkday,
    organizationId
  } = params;
  

  // Calculate non-working days between startDate and endDate
  const nonWorkingDays = await countNonWorkingDays({
    startDate,
    endDate,
    excludeHolidays: considerPublicHolidayAsWorkday,
    excludeWeekends: considerWeekendAsWorkday,
    organizationId
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
    excludeWeekends,
    organizationId
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
      organizationId,
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

export async function countWorkingDaysWithoutEndDate(
  params: Omit <CountQueryObject, 'endDate'> & { count: number }
): Promise<Date> {
  const {
    startDate,
    considerPublicHolidayAsWorkday: excludeHolidays,
    considerWeekendAsWorkday: excludeWeekends,
    organizationId, 
    count
  } = params;
  let exclude: Prisma.EnumHOLIDAY_TYPEFilter | undefined;
  if (excludeHolidays && excludeWeekends) {
    exclude = { notIn: [HOLIDAY_TYPE.PUBLIC_HOLIDAY, HOLIDAY_TYPE.WEEKEND] };
  } else if (excludeHolidays) {
    exclude = { not:  HOLIDAY_TYPE.PUBLIC_HOLIDAY };
  } else if (excludeWeekends) {
    exclude = { not: HOLIDAY_TYPE.WEEKEND };
  }

  // Get holidays from the start date till end of year
  const year = new Date(startDate).getFullYear();
  const lastDay = new Date(year, 11, 31);
  let holidays: ListWithPagination<Holiday>;
  try {
    holidays = await repository.find({
      where: {
        organizationId,
        date: {
          lte: lastDay,
          gte: startDate,
        },
        type: exclude
      }
    });
  } catch (err) {
    logger.warn('Getting non working days failed', { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }


  // set counter and loop through holidays to find the date after count working days
  let counter = 0;
  const newDay = new Date(startDate);
  newDay.setDate(newDay.getDate() + 1);


  if (holidays.data.length === 0) {
    newDay.setDate(newDay.getDate() + (count - 1));
    return newDay;
  } else {
    for (const holiday of holidays.data) {
      const holidayDate = new Date(holiday.date).setHours(0, 0, 0, 0);
      const newStartDay = newDay.setHours(0, 0, 0, 0);
      // Loop through days until we reach the holiday date
      while (newStartDay <= holidayDate) {
        // If holiday date matches new start day, skip counting
        if (holidayDate === newStartDay) {
          continue;
        } else {
          // Increment counter for each working day
          counter++;
        }
        // Move to the next day
        newDay.setDate(newDay.getDate() + 1);
        if (counter === count) {
          break;
        }
      }
      if (counter === count) {
        break;
      }
    }
  }

  return newDay;
}

export async function countWorkingDaysWithReduction(
  params: CountQueryObject & { count: number }
): Promise<Date> {
  const {
    startDate,
    endDate,
    considerPublicHolidayAsWorkday: excludeHolidays,
    considerWeekendAsWorkday: excludeWeekends,
    organizationId, 
    count
  } = params;
  let exclude: Prisma.EnumHOLIDAY_TYPEFilter | undefined;
  if (excludeHolidays && excludeWeekends) {
    exclude = { notIn: [HOLIDAY_TYPE.PUBLIC_HOLIDAY, HOLIDAY_TYPE.WEEKEND] };
  } else if (excludeHolidays) {
    exclude = { not:  HOLIDAY_TYPE.PUBLIC_HOLIDAY };
  } else if (excludeWeekends) {
    exclude = { not: HOLIDAY_TYPE.WEEKEND };
  }

  let holidays: ListWithPagination<Holiday>;
  try {
    holidays = await repository.find({
      where: {
        organizationId,
        date: {
          lte: endDate,
          gte: startDate,
        },
        type: exclude
      }
    });
  } catch (err) {
    logger.warn('Getting non working days failed', { error: err as Error });
    throw new ServerError({
      message: (err as Error).message,
      cause: err
    });
  }

  let counter = 0;
  const newDay = new Date(startDate);


  if (holidays.data.length === 0) {
    newDay.setDate(newDay.getDate() + count);
    return newDay;
  } else {
    for (const holiday of holidays.data) {
      const holidayDate = new Date(holiday.date).setHours(0, 0, 0, 0);
      const newStartDay = newDay.setHours(0, 0, 0, 0);
      while (newStartDay <= holidayDate) {
        if (holidayDate === newStartDay) {
          continue;
        } else {
          counter++;
        }
        newDay.setDate(newDay.getDate() + 1);
        if (counter === count) {
          break;
        }
      }
      if (counter === count) {
        break;
      }
    }
  }

  return newDay;
}