-- AlterTable
ALTER TABLE `reimbursement_request` ADD COLUMN `approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `reimbursement_request_comment` ADD COLUMN `approver_level` TINYINT UNSIGNED NOT NULL DEFAULT 1;
