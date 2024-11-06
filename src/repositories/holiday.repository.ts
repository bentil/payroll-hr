import { Holiday, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { RecordInUse } from '../errors/http-errors';

 
export async function createOrUpdate(
  data: Prisma.HolidayCreateInput
): Promise<Holiday> {
  const { id, ...dataWithoutId } = data;
  return prisma.holiday.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

//pass object with the above startDate, endDate, excludeHolidays, excludeWeekends bool
//if optional is true, where type is not eq to that, false do not exclude

export async function count(where: Prisma.HolidayWhereInput): Promise<number> {
  return prisma.holiday.count({ where });
}

export async function findOne(
  whereUniqueInput: Prisma.HolidayWhereUniqueInput
): Promise<Holiday | null> {
  return prisma.holiday.findUnique({
    where: whereUniqueInput
  });
}

export async function deleteOne(
  where: Prisma.HolidayWhereUniqueInput
): Promise<Holiday> {
  try {
    return await prisma.holiday.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Holiday is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}