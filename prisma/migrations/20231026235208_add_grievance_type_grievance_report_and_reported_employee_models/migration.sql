/*
  Warnings:

  - The primary key for the `employee` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `employee` table. The data in that column could be lost. The data in that column will be cast from `Int` to `UnsignedInt`.
  - The primary key for the `payroll_company` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `payroll_company` table. The data in that column could be lost. The data in that column will be cast from `Int` to `UnsignedInt`.
  - You are about to drop the `GrievanceType` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `GrievanceType` DROP FOREIGN KEY `GrievanceType_company_id_fkey`;

-- AlterTable
ALTER TABLE `employee` DROP PRIMARY KEY,
    MODIFY `id` INTEGER UNSIGNED NOT NULL,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `payroll_company` DROP PRIMARY KEY,
    MODIFY `id` INTEGER UNSIGNED NOT NULL,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `GrievanceType`;

-- CreateTable
CREATE TABLE `grievance_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `grievance_type_code_company_id_key`(`code`, `company_id`),
    UNIQUE INDEX `grievance_type_name_company_id_key`(`name`, `company_id`),
    FULLTEXT INDEX `grievance_type_code_name_description_idx`(`code`, `name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grievance_report` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `grievance_type_id` INTEGER UNSIGNED NOT NULL,
    `report_number` VARCHAR(30) NOT NULL,
    `reporting_employee_id` INTEGER UNSIGNED NOT NULL,
    `report_date` DATETIME(3) NOT NULL,
    `note` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `grievance_report_company_id_report_number_key`(`company_id`, `report_number`),
    FULLTEXT INDEX `grievance_report_report_number_note_idx`(`report_number`, `note`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `grievance_reported_employee` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `report_id` INTEGER UNSIGNED NOT NULL,
    `reported_employee_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `grievance_reported_employee_report_id_reported_employee_id_key`(`report_id`, `reported_employee_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `grievance_type` ADD CONSTRAINT `grievance_type_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievance_report` ADD CONSTRAINT `grievance_report_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievance_report` ADD CONSTRAINT `grievance_report_reporting_employee_id_fkey` FOREIGN KEY (`reporting_employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievance_report` ADD CONSTRAINT `grievance_report_grievance_type_id_fkey` FOREIGN KEY (`grievance_type_id`) REFERENCES `grievance_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievance_reported_employee` ADD CONSTRAINT `grievance_reported_employee_report_id_fkey` FOREIGN KEY (`report_id`) REFERENCES `grievance_report`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grievance_reported_employee` ADD CONSTRAINT `grievance_reported_employee_reported_employee_id_fkey` FOREIGN KEY (`reported_employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
