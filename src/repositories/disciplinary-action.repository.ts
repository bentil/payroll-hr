import { DisciplinaryAction, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { 
  CreateDisciplinaryActionDto, 
  DisciplinaryActionDto 
} from '../domain/dto/disciplinary-action.dto';

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
  include?: Prisma.DisciplinaryActionInclude,
): Promise<DisciplinaryAction | null> {
  return await prisma.disciplinaryAction.findUnique({
    where: whereUniqueInput,
    include,
  });
}

export async function findFirst(
  where: Prisma.DisciplinaryActionWhereInput,
  include?: Prisma.DisciplinaryActionInclude
): Promise<DisciplinaryActionDto | null> {
  return prisma.disciplinaryAction.findFirst({ where, include });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.DisciplinaryActionWhereInput,
  orderBy?: Prisma.DisciplinaryActionOrderByWithRelationInput
  include?: Prisma.DisciplinaryActionInclude,
}): Promise<ListWithPagination<DisciplinaryAction>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.disciplinaryAction.findMany(params),
    paginate 
      ? prisma.disciplinaryAction.count({ where: params.where }) : Promise.resolve(undefined),
  ]);
  
  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.DisciplinaryActionWhereUniqueInput,
  data: Prisma.DisciplinaryActionUpdateInput,
  include?: Prisma.DisciplinaryActionInclude,
}) {
  try {
    return await prisma.disciplinaryAction.update(params);
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
  orderBy?: Prisma.DisciplinaryActionOrderByWithRelationInput,
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

export async function deleteOne(
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