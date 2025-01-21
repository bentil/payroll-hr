-- AlterTable
ALTER TABLE `disciplinary_action` ADD COLUMN `action_end_date` DATETIME(3) NULL,
    ADD COLUMN `private` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `grievance_report` ADD COLUMN `private` BOOLEAN NOT NULL DEFAULT false;
