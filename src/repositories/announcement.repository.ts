import { Prisma } from '@prisma/client';
import { prisma } from '../components/db.component';
import { AlreadyExistsError, RecordInUse } from '../errors/http-errors';
import { ListWithPagination, getListWithPagination } from './types';
import { 
  AnnouncementDto, 
  CreateAnnouncementDto, 
  UpdateAnnouncementDto 
} from '../domain/dto/announcement.dto';

export async function create(
  { companyId, resources, targetGradeLevelIds, ...dtoData }: CreateAnnouncementDto,
  include?: Prisma.AnnouncementInclude
): Promise<AnnouncementDto> {
  const data: Prisma.AnnouncementCreateInput = {
    ...dtoData,
    company: { connect: { id: companyId } },
    resources: resources && {
      createMany: {
        data: resources
      }
    },
    targetGradeLevels: targetGradeLevelIds && {
      connect:  targetGradeLevelIds.map(id => ({ id }))
    }
  };

  try {
    return await prisma.announcement.create({ data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Announcement already exists',
          cause: err
        });
      }
    }
    throw err;
  }
}

export async function findOne(
  whereUniqueInput: Prisma.AnnouncementWhereUniqueInput,
  include?: Prisma.AnnouncementInclude
): Promise<AnnouncementDto | null> {
  return await prisma.announcement.findUnique({
    where: whereUniqueInput,
    include
  });
}

export async function find(params: {
  skip?: number,
  take?: number,
  where?: Prisma.AnnouncementWhereInput,
  include?: Prisma.AnnouncementInclude,
  orderBy?: Prisma.AnnouncementOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<AnnouncementDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.announcement.findMany(params),
    paginate ? prisma.announcement.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function findFirst (
  where: Prisma.AnnouncementWhereInput,
  include?: Prisma.AnnouncementInclude
): Promise<AnnouncementDto | null> {
  return prisma.announcement.findFirst({ where, include });
}

export async function update(params: {
  where: Prisma.AnnouncementWhereUniqueInput,
  data: UpdateAnnouncementDto,
  include?: Prisma.AnnouncementInclude
}) {
  const { where, data, include } = params;
  const {
    addResources,
    removeResourcesIds,
    unassignedTargetGradeLevelIds,
    assignedTargetGradeLevelIds,
    ...updateData
  } = data;
  const _data: Prisma.AnnouncementUpdateInput = {
    ...updateData,
    resources: {
      createMany: addResources && { 
        data: addResources
      },
      deleteMany: removeResourcesIds && {
        announcementId: where.id,
        id : { in: removeResourcesIds },
      },
    },
    targetGradeLevels: {
      connect: assignedTargetGradeLevelIds && assignedTargetGradeLevelIds.map(id => ({ id })),
      disconnect: unassignedTargetGradeLevelIds && unassignedTargetGradeLevelIds.map(id => ({ id }))
    },
  };
  
  try {
    return await prisma.announcement.update({ where, data: _data, include });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        throw new AlreadyExistsError({
          message: 'Announcement already exists',
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
  where?: Prisma.AnnouncementWhereInput,
  include?: Prisma.AnnouncementInclude,
  orderBy?: Prisma.AnnouncementOrderByWithRelationAndSearchRelevanceInput
}): Promise<ListWithPagination<AnnouncementDto>> {
  const { skip, take } = params;
  const paginate = skip !== undefined && take !== undefined;
  const [data, totalCount] = await Promise.all([
    prisma.announcement.findMany(params),
    paginate ? prisma.announcement.count({ where: params.where }) : Promise.resolve(undefined),
  ]);

  return getListWithPagination(data, { skip, take, totalCount });
}

export async function deleteOne(where: Prisma.AnnouncementWhereUniqueInput) {
  try {
    return await prisma.announcement.delete({ where });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2003') {
        throw new RecordInUse({
          message: 'Announcement is in use',
          cause: err
        });
      }
    }
    throw err;
  }
}