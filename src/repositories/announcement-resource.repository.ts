import { AnnouncementResource, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError } from '../errors/http-errors';

export async function findOne(
  whereUniqueInput: Prisma.AnnouncementResourceWhereUniqueInput,
  include?: Prisma.AnnouncementResourceInclude
): Promise<AnnouncementResource | null> {
  return await prisma.announcementResource.findUnique({
    where: whereUniqueInput,
    include
  });
}

export const findFirst = async (
  where: Prisma.AnnouncementResourceWhereInput,
  include?: Prisma.AnnouncementResourceInclude
): Promise<AnnouncementResource | null> => {
  return prisma.announcementResource.findFirst({ where, include });
};

export const update = async (params: {
  where: Prisma.AnnouncementResourceWhereUniqueInput,
  data: Prisma.AnnouncementResourceUpdateInput,
  include?: Prisma.AnnouncementResourceInclude
}) => {
  try {
    return await prisma.announcementResource.update(params);
  }
  catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Announcement resource already exists',
          cause: err
        });
      }
    }
    throw err;
  }
};