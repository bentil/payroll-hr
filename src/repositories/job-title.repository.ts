import { JobTitle, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { JobTitleEvent } from '../domain/events/job-title.event';
 
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