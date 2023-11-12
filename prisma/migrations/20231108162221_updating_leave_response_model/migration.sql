/*
  Warnings:

  - You are about to drop the `leaveresponse` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `leaveresponse` DROP FOREIGN KEY `LeaveResponse_approving_employee_id_fkey`;

-- DropForeignKey
ALTER TABLE `leaveresponse` DROP FOREIGN KEY `LeaveResponse_leave_request_id_fkey`;

-- DropTable
DROP TABLE `leaveresponse`;

-- CreateTable
CREATE TABLE `leave_response` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `leave_request_id` INTEGER UNSIGNED NOT NULL,
    `approving_employee_id` INTEGER UNSIGNED NOT NULL,
    `comment` TEXT NOT NULL,
    `response_type` ENUM('APPROVED', 'DECLINED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leave_response` ADD CONSTRAINT `leave_response_approving_employee_id_fkey` FOREIGN KEY (`approving_employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leave_response` ADD CONSTRAINT `leave_response_leave_request_id_fkey` FOREIGN KEY (`leave_request_id`) REFERENCES `leave_request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
