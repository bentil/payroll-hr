-- CreateTable
CREATE TABLE `LeaveResponse` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `leave_request_id` INTEGER UNSIGNED NOT NULL,
    `approving_employee_id` INTEGER UNSIGNED NOT NULL,
    `comment` TEXT NOT NULL,
    `response_type` ENUM('APPROVED', 'DECLINED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LeaveResponse` ADD CONSTRAINT `LeaveResponse_approving_employee_id_fkey` FOREIGN KEY (`approving_employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveResponse` ADD CONSTRAINT `LeaveResponse_leave_request_id_fkey` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
