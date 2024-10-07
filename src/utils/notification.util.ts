import dayjs from 'dayjs';
import dayjsAdvanced from 'dayjs/plugin/advancedFormat';
import dayjsTZ from 'dayjs/plugin/timezone';
import fs from 'fs';
import { KafkaService } from '../components/kafka.component';
import config from '../config';
import { rootLogger } from './logger';
import StringUtil from './string.util';
import { Decimal } from '@prisma/client/runtime/library';

dayjs.extend(dayjsAdvanced);
dayjs.extend(dayjsTZ);

const leaveRequestTemplate = fs.readFileSync(
  config.templates.leaveRequestPath, 'utf8'
);
const reimbursementRequestTemplate = fs.readFileSync(
  config.templates.reimbursementRequestPath, 'utf8'
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
      emailRecipients: [ data.approverEmail ],
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
      emailRecipients: [ data.approverEmail ],
    }
  };
  logger.debug(`Emitting ${NOTIFICATION_TOPIC} event`);
  kafkaService.send(NOTIFICATION_TOPIC, message);
  logger.info(`${NOTIFICATION_TOPIC} event emitted successfully!`);
}
