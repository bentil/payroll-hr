-- CreateIndex
CREATE FULLTEXT INDEX `employee_first_name_last_name_other_names_employee_number_idx` ON `employee`(`first_name`, `last_name`, `other_names`, `employee_number`);
