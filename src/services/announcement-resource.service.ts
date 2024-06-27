import { AnnouncementResource } from '@prisma/client';
import { UpdateAnnouncementResourceDto } from '../domain/dto/announcement-resource.dto';
import * as repository from '../repositories/announcement-resource.repository';
import { KafkaService } from '../components/kafka.component';
import { rootLogger } from '../utils/logger';
import { NotFoundError } from '../errors/http-errors';
import { errors } from '../utils/constants';
const kafkaService = KafkaService.getInstance();
const logger = rootLogger.child({ context: 'AnnouncementResourceService' });

const events = {
  modified: 'event.AnnouncementResource.modified',
};

export async function updateAnnouncementResource(
  id: number, 
  resourceId: number,
  updateData: UpdateAnnouncementResourceDto
): Promise<AnnouncementResource> {

  const announcementResource = await repository.findOne({ announcementId: id, id: resourceId });
  if (!announcementResource) {
    logger.warn('AnnouncementResource[%s] to update does not exist', id);
    throw new NotFoundError({
      name: errors.ANNOUNCE_RESOURCE_NOT_FOUND,
      message: 'Announcement resource to update does not exisit'
    });
  }

  logger.debug('Persisting update(s) to AnnouncementResource[%s]', resourceId);
  const updatedAnnouncementResource = await repository.update({
    where: { id: resourceId, announcementId: id }, data: updateData, include: { announcement: true }
  });
  logger.info('Update(s) to AnnouncementResource[%s] persisted successfully!', id);

  // Emit event.AnnouncementResource.modified event
  logger.debug(`Emitting ${events.modified}`);
  kafkaService.send(events.modified, updatedAnnouncementResource);
  logger.info(`${events.modified} event emitted successfully!`);

  return updatedAnnouncementResource;
}