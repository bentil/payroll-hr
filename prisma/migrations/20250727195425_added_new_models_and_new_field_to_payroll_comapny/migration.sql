-- AlterTable
ALTER TABLE `payroll_company` ADD COLUMN `notify_approvers_on_request_response` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `company_approver` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `approver_type` ENUM('SUPERVISOR', 'DEPARMENT_HEAD', 'HR', 'MANAGER') NOT NULL,
    `company_level_id` INTEGER UNSIGNED NULL,
    `level` TINYINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `company_approver_company_id_company_level_id_level_key`(`company_id`, `company_level_id`, `level`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_read_event` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `announcement_id` INTEGER UNSIGNED NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `announcement_read_event_employee_id_announcement_id_key`(`employee_id`, `announcement_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_job_title_id_fkey` FOREIGN KEY (`job_title_id`) REFERENCES `job_title`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_approver` ADD CONSTRAINT `company_approver_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_approver` ADD CONSTRAINT `company_approver_company_level_id_fkey` FOREIGN KEY (`company_level_id`) REFERENCES `company_level`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_read_event` ADD CONSTRAINT `announcement_read_event_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_read_event` ADD CONSTRAINT `announcement_read_event_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `announcement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
