-- CreateTable
CREATE TABLE `DisciplinaryAction` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `action_type_id` INTEGER UNSIGNED NOT NULL,
    `action_number` VARCHAR(30) NOT NULL,
    `grievance_report_id` INTEGER UNSIGNED NULL,
    `notes` TEXT NOT NULL,
    `action_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `DisciplinaryAction_action_number_company_id_key`(`action_number`, `company_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `DisciplinaryAction` ADD CONSTRAINT `DisciplinaryAction_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisciplinaryAction` ADD CONSTRAINT `DisciplinaryAction_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisciplinaryAction` ADD CONSTRAINT `DisciplinaryAction_action_type_id_fkey` FOREIGN KEY (`action_type_id`) REFERENCES `disciplinary_action_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DisciplinaryAction` ADD CONSTRAINT `DisciplinaryAction_grievance_report_id_fkey` FOREIGN KEY (`grievance_report_id`) REFERENCES `grievance_report`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
