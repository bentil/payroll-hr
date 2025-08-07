import { DisciplinaryActionType, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { CreateDisciplinaryActionTypeDto } from '../domain/dto/disciplinary-action-type.dto';

export async function create(
  { companyId, ...dtoData }: CreateDisciplinaryActionTypeDto
): Promise<DisciplinaryActionType> {
  const data: Prisma.DisciplinaryActionTypeCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } }
  };

  try {
    return await prisma.disciplinaryActionType.create({ data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Disciplinary action type  already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.DisciplinaryActionTypeWhereUniqueInput
): Promise<DisciplinaryActionType | null> {
  return await prisma.disciplinaryActionType.findUnique({
    where: whereUniqueInput
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.DisciplinaryActionTypeWhereInput,
  orderBy?: Prisma.DisciplinaryActionTypeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<DisciplinaryActionType>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.disciplinaryActionType.findMany(params),
    paginate 
      ? prisma.disciplinaryActionType.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);
  
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.DisciplinaryActionTypeWhereUniqueInput,
  data: Prisma.DisciplinaryActionTypeUpdateInput
}) {
  const { where, data } = params;
  try {
    return await prisma.disciplinaryActionType.update({ where, data });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Disciplinary action type already exists',
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
  where?: Prisma.DisciplinaryActionTypeWhereInput,
  orderBy?: Prisma.DisciplinaryActionTypeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<DisciplinaryActionType>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.disciplinaryActionType.findMany(params),
    paginate 
      ? prisma.disciplinaryActionType.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteOne(
  where: Prisma.DisciplinaryActionTypeWhereUniqueInput
) {
  try {
    return await prisma.disciplinaryActionType.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Disciplinary action type is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}