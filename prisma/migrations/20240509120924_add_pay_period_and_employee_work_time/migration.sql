-- CreateTable
CREATE TABLE `pay_period` (
    `id` INTEGER UNSIGNED NOT NULL,
    `organization_id` VARCHAR(100) NOT NULL,
    `company_Id` INTEGER UNSIGNED NULL,
    `code` VARCHAR(191) NOT NULL,
    `year` YEAR NOT NULL,
    `tax_code_id` INTEGER UNSIGNED NOT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `sequence_number` INTEGER UNSIGNED NOT NULL,
    `time_period` ENUM('DAILY', 'WEEKLY', 'FORTNIGHTLY', 'MONTHLY', 'QUARTERLY', 'BIANNUALLY', 'ANNUALLY') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_work_time` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `pay_period_id` INTEGER UNSIGNED NOT NULL,
    `time_unit` ENUM('HOUR', 'DAY') NOT NULL,
    `time_value` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee_work_time` ADD CONSTRAINT `employee_work_time_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_work_time` ADD CONSTRAINT `employee_work_time_pay_period_id_fkey` FOREIGN KEY (`pay_period_id`) REFERENCES `pay_period`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RedefineIndex
CREATE FULLTEXT INDEX `reimbursement_request_title_description_idx` ON `reimbursement_request`(`title`, `description`);
DROP INDEX `reimbursement_request_title_description_status_idx` ON `reimbursement_request`;
