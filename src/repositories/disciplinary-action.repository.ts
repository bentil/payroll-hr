import { DisciplinaryAction, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { CreateDisciplinaryActionDto } from '../domain/dto/disciplinary-action.dto';

export async function create(
  { 
    companyId, employeeId, actionTypeId, grievanceReportId, ...dtoData 
  }: CreateDisciplinaryActionDto,
  include?: Prisma.DisciplinaryActionInclude,
): Promise<DisciplinaryAction> {
  const data: Prisma.DisciplinaryActionCreateInput = {
    ...dtoData,
    actionType: { connect: { id: actionTypeId } },
    grievanceReport: grievanceReportId ? { connect: { id: grievanceReportId } } : undefined,
    company: { connect: { id: companyId } },
    employee: { connect: { id: employeeId } },
  };

  try {
    return await prisma.disciplinaryAction.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Disciplinary action already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.DisciplinaryActionWhereUniqueInput,
  includeRelations?: boolean,
): Promise<DisciplinaryAction | null> {
  return await prisma.disciplinaryAction.findUnique({
    where: whereUniqueInput,
    include: includeRelations
      ? { 
        actionType: true,
        grievanceReport: { include: { grievanceType: true } }, 
        company: true, 
        employee: true 
      } : undefined
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.DisciplinaryActionWhereInput,
  orderBy?: Prisma.DisciplinaryActionOrderByWithRelationAndSearchRelevanceInput
  includeRelations?: boolean,
}): Promise<ListWithPagination<DisciplinaryAction>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.disciplinaryAction.findMany({
      skip: params.skip,
      take: params.take,
      where: params.where,
      orderBy: params.orderBy,
      include: params.includeRelations 
        ? { 
          actionType: true, employee: true, grievanceReport: { include: { grievanceType: true } } 
        }
        : undefined
    }),
    paginate 
      ? prisma.disciplinaryAction.count({ where: params.where }) : Promise.resolve(undefined),
  ]);
  
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.DisciplinaryActionWhereUniqueInput,
  data: Prisma.DisciplinaryActionUpdateInput,
  includeRelations?: boolean
}) {
  const { where, data, includeRelations } = params;
  try {
    return await prisma.disciplinaryAction.update({ 
      where, 
      data,
      include: includeRelations
        ? { 
          actionType: true,
          grievanceReport: { include: { grievanceType: true } }, 
          company: true, 
          employee: true 
        } : undefined 
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Disciplinary action already exists',
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
  where?: Prisma.DisciplinaryActionWhereInput,
  orderBy?: Prisma.DisciplinaryActionOrderByWithRelationAndSearchRelevanceInput,
  include?: Prisma.DisciplinaryActionInclude
}): Promise<ListWithPagination<DisciplinaryAction>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.disciplinaryAction.findMany(params),
    paginate 
      ? prisma.disciplinaryAction.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteDisciplinaryAction(
  where: Prisma.DisciplinaryActionWhereUniqueInput
) {
  try {
    return await prisma.disciplinaryAction.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Disciplinary action is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}