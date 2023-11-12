-- DropForeignKey
ALTER TABLE `leave_request` DROP FOREIGN KEY `leave_request_cancelled_by_employee_id_fkey`;

-- AlterTable
ALTER TABLE `leave_request` MODIFY `cancelled_by_employee_id` INTEGER UNSIGNED NULL;

-- AddForeignKey
ALTER TABLE `leave_request` ADD CONSTRAINT `leave_request_cancelled_by_employee_id_fkey` FOREIGN KEY (`cancelled_by_employee_id`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
