-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
