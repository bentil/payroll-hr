-- CreateTable
CREATE TABLE `leave_request` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `leave_package_id` INTEGER UNSIGNED NOT NULL,
    `start_date` DATETIME(3) NOT NULL,
    `return_date` DATETIME(3) NOT NULL,
    `comment` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DECLINED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,
    `response_completed_at` DATETIME(3) NULL,
    `cancelled_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leave_request` ADD CONSTRAINT `leave_request_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_request` ADD CONSTRAINT `leave_request_leave_package_id_fkey` FOREIGN KEY (`leave_package_id`) REFERENCES `leave_package`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
