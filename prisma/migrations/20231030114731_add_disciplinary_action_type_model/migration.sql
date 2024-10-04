-- CreateTable
CREATE TABLE `disciplinary_action_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `disciplinary_action_type_code_company_id_key`(`code`, `company_id`),
    UNIQUE INDEX `disciplinary_action_type_name_company_id_key`(`name`, `company_id`),
    FULLTEXT INDEX `disciplinary_action_type_code_name_description_idx`(`code`, `name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `disciplinary_action_type` ADD CONSTRAINT `disciplinary_action_type_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
