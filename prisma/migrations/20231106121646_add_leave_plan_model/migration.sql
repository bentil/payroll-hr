-- CreateTable
CREATE TABLE `leave_plan` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `leave_package_id` INTEGER UNSIGNED NOT NULL,
    `intended_start_date` DATETIME(3) NOT NULL,
    `intended_return_date` DATETIME(3) NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leave_plan` ADD CONSTRAINT `leave_plan_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_plan` ADD CONSTRAINT `leave_plan_leave_package_id_fkey` FOREIGN KEY (`leave_package_id`) REFERENCES `leave_package`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
