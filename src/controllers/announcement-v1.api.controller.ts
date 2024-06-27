import { NextFunction, Request, Response } from 'express';

import { AnnouncementV1Controller } from './openapi/announcement-v1.oas.controller';
import { 
  QueryAnnouncementDto,
  SearchAnnouncementDto
} from '../domain/dto/announcement.dto';

const controller = new AnnouncementV1Controller();

export async function addNewAnnouncement(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.addAnnouncement(req.body);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.getAnnouncements(
      req.query as unknown as QueryAnnouncementDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getMyAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.getMyAnnouncements(
      req.query as unknown as QueryAnnouncementDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncement(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.getAnnouncement(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(req: Request, res: Response, next: NextFunction) {
  const { id } = req.params;
  try {
    const response = await controller.updateAnnouncement(+id, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncementResource(req: Request, res: Response, next: NextFunction) {
  const { id, resourceId } = req.params;
  try {
    const response = await controller.updateAnnouncementResource(+id, +resourceId, req.body);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.searchAnnouncement(
      req.query as unknown as SearchAnnouncementDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchMyAnnouncements(req: Request, res: Response, next: NextFunction) {
  try {
    const response = await controller.searchMyAnnouncement(
      req.query as unknown as SearchAnnouncementDto, req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement( req: Request, res: Response, next: NextFunction ) {
  const { id } = req.params;
  try {
    await controller.deleteAnnouncement(+id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
