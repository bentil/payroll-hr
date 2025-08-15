/*
  Warnings:

  - A unique constraint covering the columns `[company_id,company_level_id,level,approver_type]` on the table `company_approver` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `company_approver_company_id_company_level_id_level_key` ON `company_approver`;

-- CreateIndex
CREATE UNIQUE INDEX `company_approver_company_id_company_level_id_level_approver__key` ON `company_approver`(`company_id`, `company_level_id`, `level`, `approver_type`);

-- AddForeignKey
ALTER TABLE `company_approver` ADD CONSTRAINT `company_approver_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_approver` ADD CONSTRAINT `company_approver_company_level_id_fkey` FOREIGN KEY (`company_level_id`) REFERENCES `company_level`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
