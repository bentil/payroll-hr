import { Holiday, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { RecordInUse } from '../errors/http-errors';
import { getListWithPagination, ListWithPagination } from './types';

 
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

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.HolidayWhereInput,
  orderBy?: Prisma.HolidayOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<Holiday>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.holiday.findMany(params),
    paginate ? prisma.holiday.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}