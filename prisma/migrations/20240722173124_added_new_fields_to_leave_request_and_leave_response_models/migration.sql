-- AlterTable
ALTER TABLE `leave_request` ADD COLUMN `approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `leave_response` ADD COLUMN `approver_level` TINYINT UNSIGNED NOT NULL DEFAULT 1;
