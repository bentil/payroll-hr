/*
  Warnings:

  - Added the required column `cancelled_by_employee_id` to the `leave_request` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `leave_request` ADD COLUMN `cancelled_by_employee_id` INTEGER UNSIGNED NOT NULL;

-- AddForeignKey
ALTER TABLE `leave_request` ADD CONSTRAINT `leave_request_cancelled_by_employee_id_fkey` FOREIGN KEY (`cancelled_by_employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
