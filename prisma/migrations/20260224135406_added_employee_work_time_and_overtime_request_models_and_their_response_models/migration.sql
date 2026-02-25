-- AlterTable
ALTER TABLE `payroll_company` ADD COLUMN `employee_overtime_entry_request_approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN `employee_work_time_request_approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    ADD COLUMN `notify_hr_on_employee_overtime_entry_request` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notify_hr_on_employee_work_time_request` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `employee_work_time_request` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `pay_period_id` INTEGER UNSIGNED NOT NULL,
    `time_unit` ENUM('HOUR', 'DAY') NOT NULL,
    `time_value` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `approver_id` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,
    `status_last_modified_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,
    `cancelled_by_employee_id` INTEGER UNSIGNED NULL,
    `approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `response_completed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_overtime_entry_request` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `pay_period_id` INTEGER UNSIGNED NOT NULL,
    `overtime_id` INTEGER UNSIGNED NOT NULL,
    `number_of_hours` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `approver_id` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,
    `status_last_modified_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,
    `cancelled_by_employee_id` INTEGER UNSIGNED NULL,
    `approvals_required` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `response_completed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_work_time_response` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `leave_request_id` INTEGER UNSIGNED NOT NULL,
    `approving_employee_id` INTEGER UNSIGNED NOT NULL,
    `comment` TEXT NOT NULL,
    `response_type` ENUM('APPROVED', 'DECLINED', 'ADJUSTED') NOT NULL,
    `approver_level` TINYINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_overtime_entry_response` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `leave_request_id` INTEGER UNSIGNED NOT NULL,
    `approving_employee_id` INTEGER UNSIGNED NOT NULL,
    `comment` TEXT NOT NULL,
    `response_type` ENUM('APPROVED', 'DECLINED', 'ADJUSTED') NOT NULL,
    `approver_level` TINYINT UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee_work_time_request` ADD CONSTRAINT `employee_work_time_request_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_work_time_request` ADD CONSTRAINT `employee_work_time_request_pay_period_id_fkey` FOREIGN KEY (`pay_period_id`) REFERENCES `pay_period`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_work_time_request` ADD CONSTRAINT `employee_work_time_request_cancelled_by_employee_id_fkey` FOREIGN KEY (`cancelled_by_employee_id`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry_request` ADD CONSTRAINT `employee_overtime_entry_request_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry_request` ADD CONSTRAINT `employee_overtime_entry_request_pay_period_id_fkey` FOREIGN KEY (`pay_period_id`) REFERENCES `pay_period`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry_request` ADD CONSTRAINT `employee_overtime_entry_request_overtime_id_fkey` FOREIGN KEY (`overtime_id`) REFERENCES `overtime`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry_request` ADD CONSTRAINT `employee_overtime_entry_request_cancelled_by_employee_id_fkey` FOREIGN KEY (`cancelled_by_employee_id`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_work_time_response` ADD CONSTRAINT `employee_work_time_response_approving_employee_id_fkey` FOREIGN KEY (`approving_employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_work_time_response` ADD CONSTRAINT `employee_work_time_response_leave_request_id_fkey` FOREIGN KEY (`leave_request_id`) REFERENCES `employee_work_time_request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry_response` ADD CONSTRAINT `employee_overtime_entry_response_approving_employee_id_fkey` FOREIGN KEY (`approving_employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry_response` ADD CONSTRAINT `employee_overtime_entry_response_leave_request_id_fkey` FOREIGN KEY (`leave_request_id`) REFERENCES `employee_overtime_entry_request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
