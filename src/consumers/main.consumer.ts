import { Consumer } from 'kafkajs';
import { KafkaService } from '../components/kafka.component';
import PayrollCompanyConsumer from './payroll-company.consumer';
import EmployeeConsumer from './employee.consumer';
import CompanyLevelConsumer from './company-level.consumer';
import GradeLevelConsumer from './grade-level.consumer';
import HolidayConsumer from './holiday.consumer';
import JobTitleConsumer from './job-title.consumer';
import CompanyCurrencyConsumer from './company-currency.consumer';
import CurrencyConsumer from './currency.consumer';
import PayPeriodConsumer from './pay-period.consumer';

type ConsumerHandler = (data: any) => void | Promise<void>;
const topicHandlers: Record<string, ConsumerHandler> = {
  'event.PayrollCompany.created': PayrollCompanyConsumer.handleCreated,
  'event.PayrollCompany.modified': PayrollCompanyConsumer.handleModified,
  'event.Employee.created': EmployeeConsumer.handleCreated,
  'event.Employee.modified': EmployeeConsumer.handleModified,
  'event.CompanyLevel.created': CompanyLevelConsumer.handleCreated,
  'event.CompanyLevel.modified': CompanyLevelConsumer.handleModified,
  'event.GradeLevel.created': GradeLevelConsumer.handleCreated,
  'event.GradeLevel.modified': GradeLevelConsumer.handleModified,
  'event.Holiday.created': HolidayConsumer.handleCreated,
  'event.Holiday.modified': HolidayConsumer.handleModified,
  'event.JobTitle.created': JobTitleConsumer.handleCreated,
  'event.JobTitle.modified': JobTitleConsumer.handleModified,
  'event.CompanyCurrencyConfig.created': CompanyCurrencyConsumer.handleCreated,
  'event.CompanyCurrencyConfig.modified': CompanyCurrencyConsumer.handleModified,
  'event.Currency.created': CurrencyConsumer.handleCreated,
  'event.Currency.modified': CurrencyConsumer.handleModified,
  'event.PayPeriod.created': PayPeriodConsumer.handleCreated,
  'event.PayPeriod.modified': PayPeriodConsumer.handleModified,
} as const;

export default class MainConsumer {
  private static instance: MainConsumer;

  private kafkaConsumer: Consumer;

  private constructor() {
    this.kafkaConsumer = KafkaService.getInstance().getConsumer();
  }

  public static getInstance(): MainConsumer {
    if (!MainConsumer.instance) {
      MainConsumer.instance = new MainConsumer();
    }

    return MainConsumer.instance;
  }

  public async startConsuming() {
    const topics: string[] = [];
    for (const topic in topicHandlers) {
      topics.push(topic);
    }

    await this.kafkaConsumer.subscribe({ topics, fromBeginning: true });

    await this.kafkaConsumer.run({
      eachMessage: async ({ topic, message }) => {
        if (!message || !message.value) {
          return;
        }

        const data = JSON.parse(message.value.toString());
        const handler = topicHandlers[topic];

        if (handler) {
          handler(data);
        }
      },
    });
  }
}
