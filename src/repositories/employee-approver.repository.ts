import { Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { 
  EmployeeApproverDto 
} from '../domain/dto/employee-approver.dto';

export class CreateEmployeeApproverObject {
  employeeId!: number;
  approverId!: number;
  level!: number;
}

export async function create(
  { employeeId, approverId, level }: CreateEmployeeApproverObject,
  include?: Prisma.EmployeeApproverInclude,
): Promise<EmployeeApproverDto> {
  const data: Prisma.EmployeeApproverCreateInput = {
    level,
    employee: { connect: { id: employeeId } },
    approver: { connect: { id: approverId } }
  };
  try {
    return await prisma.employeeApprover.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee approver already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.EmployeeApproverWhereUniqueInput,
  include?: Prisma.EmployeeApproverInclude
): Promise<EmployeeApproverDto | null> {
  return prisma.employeeApprover.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function findFirst(
  where: Prisma.EmployeeApproverWhereInput,
  include?: Prisma.EmployeeApproverInclude
): Promise<EmployeeApproverDto | null> {
  return prisma.employeeApprover.findFirst({ where, include });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeApproverWhereInput,
  orderBy?: Prisma.EmployeeApproverOrderByWithRelationInput,
  include?: Prisma.EmployeeApproverInclude
}): Promise<ListWithPagination<EmployeeApproverDto>> {
  const { skip, take, } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employeeApprover.findMany(params),
    paginate
      ? prisma.employeeApprover.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.EmployeeApproverWhereUniqueInput,
  data: Prisma.EmployeeApproverUpdateInput,
  include?: Prisma.EmployeeApproverInclude
}): Promise<EmployeeApproverDto> {
  try {
    return await prisma.employeeApprover.update(params);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee approver already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteOne(
  whereUniqueInput: Prisma.EmployeeApproverWhereUniqueInput
): Promise<EmployeeApproverDto> {
  try {
    return await prisma.employeeApprover.delete({
      where: whereUniqueInput
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Employee approver is currently in use',
          cause: err
        });
      }
    }
    throw err;
  }
}