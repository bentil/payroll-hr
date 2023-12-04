import { Holiday, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
 
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
  return await prisma.holiday.count({ where });
}
