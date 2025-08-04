import { Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { 
  CompanyApproverDto, 
  CreateCompanyApproverDto, 
  UpdateCompanyApproverDto 
} from '../domain/dto/company-approver.dto';

export interface CreateCompanyApproverObject extends CreateCompanyApproverDto{
  companyId: number
}

export interface UpdateCompanyApproverObject extends UpdateCompanyApproverDto{
  removeCompanyLevelId?: number
}

export async function create(
  { companyId, companyLevelId, ...remainingData }: CreateCompanyApproverObject,
  include?: Prisma.CompanyApproverInclude,
): Promise<CompanyApproverDto> {
  const data: Prisma.CompanyApproverCreateInput = {
    ...remainingData,
    company: { connect: { id: companyId } },
    companyLevel: companyLevelId ? { connect: { id: companyLevelId } } : undefined
  };
  try {
    return await prisma.companyApprover.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company approver already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.CompanyApproverWhereUniqueInput,
  include?: Prisma.CompanyApproverInclude
): Promise<CompanyApproverDto | null> {
  return prisma.companyApprover.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function findFirst(
  where: Prisma.CompanyApproverWhereInput,
  include?: Prisma.CompanyApproverInclude
): Promise<CompanyApproverDto | null> {
  return prisma.companyApprover.findFirst({ where, include });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.CompanyApproverWhereInput,
  orderBy?: Prisma.CompanyApproverOrderByWithRelationInput,
  include?: Prisma.CompanyApproverInclude
}): Promise<ListWithPagination<CompanyApproverDto>> {
  const { skip, take, } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.companyApprover.findMany(params),
    paginate
      ? prisma.companyApprover.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function update(params: {
  where: Prisma.CompanyApproverWhereUniqueInput,
  data: UpdateCompanyApproverObject,
  include?: Prisma.CompanyApproverInclude
}): Promise<CompanyApproverDto> {
  const { where, data, include } = params;
  const { companyLevelId, removeCompanyLevelId, ...remainingData } = data;
  const _data: Prisma.CompanyApproverUpdateInput = {
    ...remainingData,
    companyLevel: {
      connect: companyLevelId ? { id: companyLevelId } : undefined,
      disconnect: removeCompanyLevelId ? { id: data.removeCompanyLevelId } : undefined
    }
  };
  try {
    return await prisma.companyApprover.update({ where, data: _data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company approver already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteOne(
  whereUniqueInput: Prisma.CompanyApproverWhereUniqueInput
): Promise<CompanyApproverDto> {
  try {
    return await prisma.companyApprover.delete({
      where: whereUniqueInput
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Company approver is currently in use',
          cause: err
        });
      }
    }
    throw err;
  }
}