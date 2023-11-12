import { GrievanceType, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { CreateGrievanceTypeDto } from '../domain/dto/grievance-type.dto';

export async function create(
  { companyId, ...dtoData }: CreateGrievanceTypeDto
): Promise<GrievanceType> {
  const data: Prisma.GrievanceTypeCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } }
  };

  try {
    return await prisma.grievanceType.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Grievance type already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.GrievanceTypeWhereUniqueInput
): Promise<GrievanceType | null> {
  return await prisma.grievanceType.findUnique({
    where: whereUniqueInput
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.GrievanceTypeWhereInput,
  orderBy?: Prisma.GrievanceTypeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<GrievanceType>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.grievanceType.findMany(params),
    paginate ? prisma.grievanceType.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.GrievanceTypeWhereUniqueInput,
  data: Prisma.GrievanceTypeUpdateInput
}) {
  const { where, data } = params;
  try {
    return await prisma.grievanceType.update({ where, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Grievance type already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function search(params: {
  skip?: number,
  take?: number,
  where?: Prisma.GrievanceTypeWhereInput,
  orderBy?: Prisma.GrievanceTypeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<GrievanceType>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.grievanceType.findMany(params),
    paginate ? prisma.grievanceType.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteGrievanceType(where: Prisma.GrievanceTypeWhereUniqueInput) {
  try {
    return await prisma.grievanceType.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Grievance type is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}