import dayjs from 'dayjs';
import dayjsAdvanced from 'dayjs/plugin/advancedFormat';
import dayjsTZ from 'dayjs/plugin/timezone';
import fs from 'fs';
import { KafkaService } from '../components/kafka.component';
import config from '../config';
import { rootLogger } from './logger';
import StringUtil from './string.util';
import { Decimal } from '@prisma/client/runtime/library';
import { WorkTimeUnit } from '@prisma/client';

dayjs.extend(dayjsAdvanced);
dayjs.extend(dayjsTZ);

const leaveRequestTemplate = fs.readFileSync(
  config.templates.leaveRequestPath, 'utf8'
);
const reimbursementRequestTemplate = fs.readFileSync(
  config.templates.reimbursementRequestPath, 'utf8'
);
const leaveResponseTemplate = fs.readFileSync(
  config.templates.leaveResponsePath, 'utf8'
);
const reimbursementResponseTemplate = fs.readFileSync(
  config.templates.reimbursementResponsePath, 'utf8'
);
const announcementTemplate = fs.readFileSync(
  config.templates.announcementPath, 'utf8'
);
const employeeOvertimeEntryRequest = fs.readFileSync(
  config.templates.employeeOvertimeEntryRequestPath, 'utf8'
);
const employeeOvertimeEntryResponse = fs.readFileSync(
  config.templates.employeeOvertimeEntryResponsePath, 'utf8'
);
const employeeWorkTimeRequest = fs.readFileSync(
  config.templates.employeeWorkTimeRequestPath, 'utf8'
);
const employeeWorkTimeResponse = fs.readFileSync(
  config.templates.employeeWorkTimeResponsePath, 'utf8'
);
const NOTIFICATION_TOPIC = config.topics.notifications;

interface NotificationMessage {
  kafkaMessagingOperation: 'sendSms' | 'sendEmail';
  payload: NotificationPayload;
}

interface NotificationPayload {
  from: string;
  body: string;
  mobileNumber?: string;
  emailRecipients?: string[];
  subject?: string;
}

interface LeaveRequestDetail {
  requestId: number;
  approverEmail: string;
  approverFirstName: string;
  employeeFullName: string;
  requestDate: Date;
  startDate: Date;
  endDate: Date;
  leaveTypeName: string;
  employeePhotoUrl?: string | null;
}

interface ReimbursementRequestDetail {
  requestId: number;
  approverFirstName: string;
  approverEmail: string;
  employeeFullName: string;
  requestDate: Date;
  employeePhotoUrl?: string | null;
  currencyCode: string;
  amount: Decimal;
}

interface LeaveResponseDetail {
  requestId: number;
  recipientEmail: string;
  recipientFirstName: string;
  employeeFullName: string;
  requestDate: Date;
  startDate: Date;
  endDate: Date;
  leaveTypeName: string;
  responseMessage: string;
}

interface ReimbursementResponseDetail {
  requestId: number;
  recipientEmail: string;
  recipientFirstName: string;
  employeeFullName: string;
  requestDate: Date;
  currencyCode: string;
  amount: Decimal;
  responseMessage: string;
}

interface AnnouncementDetail {
  announcementId: number;
  recipientEmail: string;
  recipientFirstName: string;
}

interface EmployeeOvertmeEntryRequestDetail {
  requestId: number;
  approverEmail: string;
  approverFirstName: string;
  employeeFullName: string;
  requestDate: Date;
  overtimeName: string;
  employeePhotoUrl?: string | null;
}

interface EmployeeOvertmeEntryResponseDetail {
  requestId: number;
  recipientEmail: string;
  recipientFirstName: string;
  employeeFullName: string;
  requestDate: Date;
  overtimeName: string;
  responseMessage: string;
}

interface EmployeeWorkTimeRequestDetail {
  requestId: number;
  approverEmail: string;
  approverFirstName: string;
  employeeFullName: string;
  requestDate: Date;
  timeUnit: WorkTimeUnit;
  timeValue: number;
  employeePhotoUrl?: string | null;
}

interface EmployeeWorkTimeResponseDetail {
  requestId: number;
  recipientEmail: string;
  recipientFirstName: string;
  employeeFullName: string;
  requestDate: Date;
  timeUnit: WorkTimeUnit;
  timeValue: number;
  responseMessage: string;
}

const _logger = rootLogger.child({ context: 'NotificationUtil' });
const kafkaService = KafkaService.getInstance();

export async function sendLeaveRequestEmail(
  data: LeaveRequestDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendLeaveRequestEmail' });
  const link = new URL(config.actionUrls.leaveRequest);
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(leaveRequestTemplate, {
    approverFirstName: data.approverFirstName,
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    startDate: dayjs(data.startDate).format('MMM DD YYYY'),
    endDate: dayjs(data.endDate).format('MMM DD YYYY'),
    leaveTypeName: data.leaveTypeName,
    employeePhotoUrl: data.employeePhotoUrl || config.templates.defaultPhotoUrl,
    actionUrl: link,
    date: dayjs(new Date()).format('MMM DD YYYY')
  });
  
  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.leaveRequestSubject,
      body: emailBody,
      emailRecipients: [data.approverEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendReimbursementRequestEmail(
  data: ReimbursementRequestDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendReimbursementRequestEmail' });
  const link = new URL(config.actionUrls.reimbursementRequest);
  // eslint-disable-next-line quotes
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(reimbursementRequestTemplate, {
    approverFirstName: data.approverFirstName ?? 'User',
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    employeePhotoUrl: data.employeePhotoUrl || config.templates.defaultPhotoUrl,
    currencyCode: data.currencyCode,
    amount: data.amount,
    actionUrl: link,
    date: dayjs(new Date()).format('Do MMMM YYYY')
  });

  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.reimbursementRequestSubject,
      body: emailBody,
      emailRecipients: [data.approverEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendLeaveResponseEmail(
  data: LeaveResponseDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendLeaveResponseEmail' });
  const link = new URL(config.actionUrls.leaveRequest);
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(leaveResponseTemplate, {
    recipientFirstName: data.recipientFirstName,
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    startDate: dayjs(data.startDate).format('MMM DD YYYY'),
    endDate: dayjs(data.endDate).format('MMM DD YYYY'),
    leaveTypeName: data.leaveTypeName,
    actionUrl: link,
    responseMessage: data.responseMessage,
    date: dayjs(new Date()).format('MMM DD YYYY')
  });
  
  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.leaveRequestSubject,
      body: emailBody,
      emailRecipients: [data.recipientEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendReimbursementResponseEmail(
  data: ReimbursementResponseDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendReimbursementResponseEmail' });
  const link = new URL(config.actionUrls.reimbursementRequest);
  // eslint-disable-next-line quotes
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(reimbursementResponseTemplate, {
    recipientFirstName: data.recipientFirstName ?? 'User',
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    responseMessage: data.responseMessage,
    currencyCode: data.currencyCode,
    amount: data.amount,
    actionUrl: link,
    date: dayjs(new Date()).format('Do MMMM YYYY')
  });

  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }


  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.reimbursementRequestSubject,
      body: emailBody,
      emailRecipients: [data.recipientEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendAnnouncementEmail(
  data: AnnouncementDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendAnnouncementEmail' });
  const link = new URL(config.actionUrls.announcement);
  link.searchParams.append('id', `${data.announcementId}`);
  const emailBody = StringUtil.render(announcementTemplate, {
    recipient: data.recipientFirstName,
    actionUrl: link,
    date: dayjs(new Date()).format('MMM DD YYYY')
  });
  
  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.announcementSubject,
      body: emailBody,
      emailRecipients: [data.recipientEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendEmployeeOvertimeEntryRequestEmail(
  data: EmployeeOvertmeEntryRequestDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendEmployeeOvertimeEntryRequestEmail' });
  const link = new URL(config.actionUrls.leaveRequest);
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(employeeOvertimeEntryRequest, {
    approverFirstName: data.approverFirstName,
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    overtimeName: data.overtimeName,
    employeePhotoUrl: data.employeePhotoUrl || config.templates.defaultPhotoUrl,
    actionUrl: link,
    date: dayjs(new Date()).format('MMM DD YYYY')
  });
  
  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.leaveRequestSubject,
      body: emailBody,
      emailRecipients: [data.approverEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendEmployeeOvertimeEntryResponseEmail(
  data: EmployeeOvertmeEntryResponseDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendEmployeeOvertimeEntryResponseEmail' });
  const link = new URL(config.actionUrls.leaveRequest);
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(employeeOvertimeEntryResponse, {
    recipientFirstName: data.recipientFirstName,
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    overtimeName: data.overtimeName,
    actionUrl: link,
    responseMessage: data.responseMessage,
    date: dayjs(new Date()).format('MMM DD YYYY')
  });
  
  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.leaveRequestSubject,
      body: emailBody,
      emailRecipients: [data.recipientEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendEmployeeWorkTimeRequestEmail(
  data: EmployeeWorkTimeRequestDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendEmployeeWorkTimeRequestEmail' });
  const link = new URL(config.actionUrls.leaveRequest);
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(employeeWorkTimeRequest, {
    approverFirstName: data.approverFirstName,
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    timeValue: data.timeValue,
    timeUnit: data.timeUnit,
    employeePhotoUrl: data.employeePhotoUrl || config.templates.defaultPhotoUrl,
    actionUrl: link,
    date: dayjs(new Date()).format('MMM DD YYYY')
  });
  
  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.leaveRequestSubject,
      body: emailBody,
      emailRecipients: [data.approverEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}

export async function sendEmployeeWorkTimeResponseEmail(
  data: EmployeeWorkTimeResponseDetail
): Promise<void> {
  const logger = _logger.child({ method: 'sendEmployeeWorkTimeResponseEmail' });
  const link = new URL(config.actionUrls.leaveRequest);
  link.searchParams.append('id', `${data.requestId}`);
  const emailBody = StringUtil.render(employeeWorkTimeResponse, {
    recipientFirstName: data.recipientFirstName,
    employeeFullName: data.employeeFullName,
    requestDate: dayjs(data.requestDate).format('MMM DD YYYY'),
    timeValue: data.timeValue,
    timeUnit: data.timeUnit,
    actionUrl: link,
    responseMessage: data.responseMessage,
    date: dayjs(new Date()).format('MMM DD YYYY')
  });
  
  if (!NOTIFICATION_TOPIC) {
    logger.error('Notifications topic not properly configured. Discarding message...');
    return;
  }

  // Dispatch message to Kafka
  const message: NotificationMessage = {
    kafkaMessagingOperation: 'sendEmail',
    payload: {
      from: config.notifications.emailSender,
      subject: config.notifications.leaveRequestSubject,
      body: emailBody,
      emailRecipients: [data.recipientEmail],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}