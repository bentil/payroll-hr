-- CreateTable
CREATE TABLE `employee_leave_type_summary` (
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `leave_type_id` INTEGER UNSIGNED NOT NULL,
    `number_of_days_used` INTEGER NOT NULL,
    `number_of_days_pending` INTEGER NOT NULL,
    `carry_over_days` INTEGER NOT NULL,
    `year` YEAR NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `employee_leave_type_summary_employee_id_leave_type_id_year_key`(`employee_id`, `leave_type_id`, `year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee_leave_type_summary` ADD CONSTRAINT `employee_leave_type_summary_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_leave_type_summary` ADD CONSTRAINT `employee_leave_type_summary_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
