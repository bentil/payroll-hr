import { AnnouncementReadEvent, Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { 
  AnnouncementReadEventDto,
  CreateAnnouncementReadEventDto
} from '../domain/dto/announcement-read-event.dto';

export interface CreateAnnouncementReadEventObject extends CreateAnnouncementReadEventDto {
  announcementId: number;
}

export async function create(
  {
    employeeId,
    announcementId
  }: CreateAnnouncementReadEventObject,
  include?: Prisma.AnnouncementReadEventInclude
): Promise<AnnouncementReadEventDto> {
  const data: Prisma.AnnouncementReadEventCreateInput = {
    employee: { connect: { id: employeeId } },
    announcement: { connect: { id: announcementId } },
  };

  try {
    return await prisma.announcementReadEvent.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Announcement read event already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.AnnouncementReadEventWhereUniqueInput,
  include?: Prisma.AnnouncementReadEventInclude
): Promise<AnnouncementReadEventDto | null> {
  return await prisma.announcementReadEvent.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.AnnouncementReadEventWhereInput,
  include?: Prisma.AnnouncementReadEventInclude,
  orderBy?: Prisma.AnnouncementReadEventOrderByWithRelationInput
}): Promise<ListWithPagination<AnnouncementReadEventDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.announcementReadEvent.findMany(params),
    paginate
      ? prisma.announcementReadEvent.count({ where: params.where })
      : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function findFirst (
  where: Prisma.AnnouncementReadEventWhereInput,
  include?: Prisma.AnnouncementReadEventInclude
): Promise<AnnouncementReadEventDto | null> {
  return prisma.announcementReadEvent.findFirst({ where, include });
}

export async function update(params: {
  where: Prisma.AnnouncementReadEventWhereUniqueInput,
  data: Prisma.AnnouncementReadEventUpdateInput,
  include?: Prisma.AnnouncementReadEventInclude
}) {  
  try {
    return await prisma.announcementReadEvent.update(params);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Announcement read event already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function deleteOne(
  where: Prisma.AnnouncementReadEventWhereUniqueInput
): Promise<AnnouncementReadEvent> {
  try {
    return await prisma.announcementReadEvent.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Announcement read event is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function count(
  where: Prisma.AnnouncementReadEventWhereInput
): Promise<number> {
  return prisma.announcementReadEvent.count({ where });
}