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
import OvertimeConsumer from './overtime.consumer';
import OvertimePaymentTierConsumer from './overtime-payment-tier.consumer';
import DepartmentConsumer from './department.consumer';
import DepartmentLeadershipConsumer from './department-leadership.consumer';

type ConsumerHandler = (data: any) => void | Promise<void>;
const topicHandlers: Record<string, ConsumerHandler> = {
  'event.PayrollCompany.created': PayrollCompanyConsumer.handleCreated,
  'event.PayrollCompany.modified': PayrollCompanyConsumer.handleModified,
  'event.PayrollCompany.deleted': PayrollCompanyConsumer.handleDeleted,
  'event.Employee.created': EmployeeConsumer.handleCreated,
  'event.Employee.modified': EmployeeConsumer.handleModified,
  'event.Employee.deleted': EmployeeConsumer.handleDeleted,
  'event.CompanyLevel.created': CompanyLevelConsumer.handleCreated,
  'event.CompanyLevel.modified': CompanyLevelConsumer.handleModified,
  'event.CompanyLevel.deleted': CompanyLevelConsumer.handleDeleted,
  'event.GradeLevel.created': GradeLevelConsumer.handleCreated,
  'event.GradeLevel.modified': GradeLevelConsumer.handleModified,
  'event.GradeLevel.deleted': GradeLevelConsumer.handleDeleted,
  'event.Holiday.created': HolidayConsumer.handleCreated,
  'event.Holiday.modified': HolidayConsumer.handleModified,
  'event.Holiday.deleted': HolidayConsumer.handleDeleted,
  'event.JobTitle.created': JobTitleConsumer.handleCreated,
  'event.JobTitle.modified': JobTitleConsumer.handleModified,
  'event.JobTitle.deleted': JobTitleConsumer.handleDeleted,
  'event.CompanyCurrencyConfig.created': CompanyCurrencyConsumer.handleCreated,
  'event.CompanyCurrencyConfig.modified': CompanyCurrencyConsumer.handleModified,
  'event.CompanyCurrencyConfig.deleted': CompanyCurrencyConsumer.handleDeleted,
  'event.Currency.created': CurrencyConsumer.handleCreated,
  'event.Currency.modified': CurrencyConsumer.handleModified,
  'event.Currency.deleted': CurrencyConsumer.handleDeleted,
  'event.PayPeriod.created': PayPeriodConsumer.handleCreated,
  'event.PayPeriod.modified': PayPeriodConsumer.handleModified,
  'event.PayPeriod.deleted': PayPeriodConsumer.handleDeleted,
  'event.Overtime.created': OvertimeConsumer.handleCreated,
  'event.Overtime.modified': OvertimeConsumer.handleModified,
  'event.Overtime.deleted': OvertimeConsumer.handleDeleted,
  'event.OvertimePaymentTier.created': OvertimePaymentTierConsumer.handleCreated,
  'event.OvertimePaymentTier.modified': OvertimePaymentTierConsumer.handleModified,
  'event.OvertimePaymentTier.deleted': OvertimePaymentTierConsumer.handleDeleted,
  'event.Department.created': DepartmentConsumer.handleCreated,
  'event.Department.modified': DepartmentConsumer.handleModified,
  'event.Department.deleted': DepartmentConsumer.handleDeleted,
  'event.DepartmentLeadership.created': DepartmentLeadershipConsumer.handleCreated,
  'event.DepartmentLeadership.modified': DepartmentLeadershipConsumer.handleModified,
  'event.DepartmentLeadership.deleted': DepartmentLeadershipConsumer.handleDeleted,
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
