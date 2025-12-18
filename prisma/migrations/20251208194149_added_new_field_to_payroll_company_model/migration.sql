-- AlterTable
ALTER TABLE `payroll_company` ADD COLUMN `notify_hr_on_leave_request` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notify_hr_on_reimbursement_request` BOOLEAN NOT NULL DEFAULT false;
