import { JobTitle, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { JobTitleEvent } from '../domain/events/job-title.event';
import { RecordInUse } from '../errors/http-errors';
 
export async function createOrUpdate(
  data:  Omit<JobTitleEvent, 'createdAt' | 'modifiedAt'>
): Promise<JobTitle> {
  const { id, ...dataWithoutId } = data;
  return prisma.jobTitle.upsert({
    where: { id },
    create: data,
    update: dataWithoutId,
  });
}

export async function findOne(
  whereUniqueInput: Prisma.JobTitleWhereUniqueInput
): Promise<JobTitle | null> {
  return prisma.jobTitle.findUnique({
    where: whereUniqueInput
  });
}

export async function deleteOne(
  where: Prisma.JobTitleWhereUniqueInput
): Promise<JobTitle> {
  try {
    return await prisma.jobTitle.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Job title is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}