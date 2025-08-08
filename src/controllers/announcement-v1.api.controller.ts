import { NextFunction, Request, Response } from 'express';
import { 
  QueryAnnouncementDto,
  SearchAnnouncementDto
} from '../domain/dto/announcement.dto';
import {
  AnnouncementV1Controller
} from './openapi/announcement-v1.oas.controller';
import { QueryAnnouncementReadEventSummaryDto } from '../domain/dto/announcement-read-event.dto';


const controller = new AnnouncementV1Controller();

export async function addNewAnnouncement(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.addAnnouncement(req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncements(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getAnnouncements(
      req.query as unknown as QueryAnnouncementDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getMyAnnouncements(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getMyAnnouncements(
      req.query as unknown as QueryAnnouncementDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncement(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getAnnouncement(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncement(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.updateAnnouncement(+id, req.body, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function updateAnnouncementResource(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { announcementId, id } = req.params;
  try {
    const response = await controller.updateAnnouncementResource(
      +announcementId,
      +id,
      req.body,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchAnnouncements(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.searchAnnouncements(
      req.query as unknown as SearchAnnouncementDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function searchMyAnnouncements(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.searchMyAnnouncements(
      req.query as unknown as SearchAnnouncementDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function deleteAnnouncement(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    await controller.deleteAnnouncement(+id, req);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function addNewAnnouncementReadEvent(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const response = await controller.addAnnouncementReadEvent(+id, req.body, req);
    res.status(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncementReadEventSummaryList(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  try {
    const response = await controller.getAnnouncementReadEventSummaryList(
      req.query as unknown as QueryAnnouncementReadEventSummaryDto,
      req
    );
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getAnnouncementReadEventSummary(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getAnnouncementReadEventSummary(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getReadEventDetails(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getReadEventDetails(+id);
    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getReadEventDetailsPdf(
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<void> {
  const { id } = req.params;
  try {
    const response = await controller.getReadEventDetailsPdf(+id, req);
    res.json(response);
  } catch (err) {
    next(err);
  }
}