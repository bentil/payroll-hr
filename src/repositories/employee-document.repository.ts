import { EmployeeDocument, Prisma, } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { 
  CreateEmployeeDocumentDto,
  UpdateEmployeeDocumentDto
} from '../domain/dto/employee-document.dto';

export const create = async (
  { employeeId, typeId, ...dtoData }: CreateEmployeeDocumentDto,
  include?: Prisma.EmployeeDocumentInclude,
): Promise<EmployeeDocument> => {
  const data: Prisma.EmployeeDocumentCreateInput = {
    ...dtoData,
    employee: { connect: { id: employeeId } },
    documentType: { connect: { id: typeId } }
  };
  try {
    return await prisma.employeeDocument.create({ data, include });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee document already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};

export const findOne = async (
  whereUniqueInput: Prisma.EmployeeDocumentWhereUniqueInput,
  include?: Prisma.EmployeeDocumentInclude,
): Promise<EmployeeDocument | null> => {
  return prisma.employeeDocument.findUnique({
    where: whereUniqueInput,
    include
  });
};

export const findFirst = async (
  where: Prisma.EmployeeDocumentWhereInput,
  include?: Prisma.EmployeeDocumentInclude,
): Promise<EmployeeDocument | null> => {
  return prisma.employeeDocument.findFirst({ where, include });
};

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.EmployeeDocumentWhereInput,
  include?: Prisma.EmployeeDocumentInclude,
  orderBy?: Prisma.EmployeeDocumentOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<EmployeeDocument>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.employeeDocument.findMany(params),
    paginate 
      ? prisma.employeeDocument.count({ where: params.where }) 
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export const update = async (params: {
  where: Prisma.EmployeeDocumentWhereUniqueInput,
  data: UpdateEmployeeDocumentDto,
  include?: Prisma.EmployeeDocumentInclude,
}) => {
  const { where, data, include } = params;
  const { employeeId, typeId } = data;
  const data_: Prisma.EmployeeDocumentUpdateInput = {
    employee: employeeId ? { connect: { id: employeeId } } : undefined,
    documentType: typeId ? { connect: { id: typeId } } : undefined
  };

  try {
    return await prisma.employeeDocument.update({
      where,
      data: data_,
      include
    });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Employee document already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};


export const deleteOne = async (
  whereUniqueInput: Prisma.EmployeeDocumentWhereUniqueInput
): Promise<EmployeeDocument> => {
  try {
    return await prisma.employeeDocument.delete({
      where: whereUniqueInput
    });
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Employee document is currently in use by another model',
          cause: err
        });
      }
    }
    throw err;
  }
};