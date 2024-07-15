-- AlterTable
ALTER TABLE `payroll_company` ADD COLUMN `enable_employee_login` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `leave_request_approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN `reimbursement_request_approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN `work_hours_in_a_day` INTEGER NOT NULL DEFAULT 8;
