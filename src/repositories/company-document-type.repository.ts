import { CompanyDocumentType, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { CreateCompanyDocumentTypeDto } from '../domain/dto/company-document-type.dto';

export const create = async (
  { companyId, ...dtoData }: CreateCompanyDocumentTypeDto
): Promise<CompanyDocumentType> => {
  const data: Prisma.CompanyDocumentTypeCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } },
  };
  try {
    return await prisma.companyDocumentType.create({ data });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company document type already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};

export const findOne = async (
  whereUniqueInput: Prisma.CompanyDocumentTypeWhereUniqueInput
): Promise<CompanyDocumentType | null> => {
  return prisma.companyDocumentType.findUnique({
    where: whereUniqueInput
  });
};

export const findFirst = async (
  where: Prisma.CompanyDocumentTypeWhereInput,
): Promise<CompanyDocumentType | null> => {
  return prisma.companyDocumentType.findFirst({ where });
};

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.CompanyDocumentTypeWhereInput,
  orderBy?: Prisma.CompanyDocumentTypeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<CompanyDocumentType>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.companyDocumentType.findMany(params),
    paginate 
      ? prisma.companyDocumentType.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function search(params: {
  skip?: number,
  take?: number,
  where?: Prisma.CompanyDocumentTypeWhereInput,
  orderBy?: Prisma.CompanyDocumentTypeOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<CompanyDocumentType>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.companyDocumentType.findMany(params),
    paginate 
      ? prisma.companyDocumentType.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}


export const update = async (params: {
  where: Prisma.CompanyDocumentTypeWhereUniqueInput,
  data: Prisma.CompanyDocumentTypeUpdateInput
}) => {
  const { where, data } = params;
  try {
    return await prisma.companyDocumentType.update({
      where,
      data
    });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Company document type already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};


export const deleteOne = async (
  whereUniqueInput: Prisma.CompanyDocumentTypeWhereUniqueInput
): Promise<CompanyDocumentType> => {
  try {
    return await prisma.companyDocumentType.delete({
      where: whereUniqueInput
    });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Company document type is currently in use by another model',
          cause: err
        });
      }
    }
    throw err;
  }
};