import { GradeLevel, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { GradeLevelEvent } from '../domain/events/grade-level.event';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';


export async function createOrUpdate(
  {
    companyLevelId,
    ...dtoData
  }:  Omit<GradeLevelEvent, 'createdAt' | 'modifiedAt'>
): Promise<GradeLevel> {
  const data: Prisma.GradeLevelCreateInput = {
    ...dtoData,
    companyLevel: { connect: { id: companyLevelId } }
  };
  const { id, ...dataWithoutId } = data;
  return prisma.gradeLevel.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function create(
  data: Prisma.GradeLevelCreateInput
): Promise<GradeLevel> {
  try {
    return await prisma.gradeLevel.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Grade level already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.GradeLevelWhereUniqueInput
): Promise<GradeLevel | null> {
  return prisma.gradeLevel.findUnique({
    where: whereUniqueInput
  });
}

export async function findFirst(
  where: Prisma.GradeLevelWhereInput,
): Promise<GradeLevel | null> {
  return prisma.gradeLevel.findFirst({ where });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.GradeLevelWhereInput,
  orderBy?: Prisma.GradeLevelOrderByWithRelationInput
}): Promise<ListWithPagination<GradeLevel>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.gradeLevel.findMany(params),
    paginate
      ? prisma.gradeLevel.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.GradeLevelWhereUniqueInput,
  data: Prisma.GradeLevelUpdateInput
}): Promise<GradeLevel> {
  const { where, data } = params;
  try {
    return await prisma.gradeLevel.update({
      where,
      data
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Grade level already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteOne(
  whereUniqueInput: Prisma.GradeLevelWhereUniqueInput
): Promise<GradeLevel> {
  try {
    return await prisma.gradeLevel.delete({
      where: whereUniqueInput
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Grade level is currently in use',
          cause: err
        });
      }
    }
    throw err;
  }
}