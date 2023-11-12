-- CreateTable
CREATE TABLE `payroll_company` (
    `id` INTEGER NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `address` VARCHAR(191) NOT NULL,
    `logo_url` VARCHAR(255) NULL,
    `contact_email` VARCHAR(255) NOT NULL,
    `contact_misdn` VARCHAR(20) NULL,
    `status` VARCHAR(191) NOT NULL,
    `currency_id` INTEGER NOT NULL,
    `country_id` INTEGER NULL,
    `allow_negative_rates` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,
    `status_last_modified_at` DATETIME(3) NULL,
    `allow_negative_rates_last_modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee` (
    `id` INTEGER NOT NULL,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `notch_id` INTEGER UNSIGNED NULL,
    `employee_number` VARCHAR(40) NOT NULL,
    `title` VARCHAR(10) NOT NULL,
    `first_name` VARCHAR(100) NOT NULL,
    `last_name` VARCHAR(100) NOT NULL,
    `other_names` VARCHAR(255) NULL,
    `gender` VARCHAR(191) NOT NULL,
    `date_of_birth` DATETIME(3) NOT NULL,
    `photo_url` VARCHAR(191) NULL,
    `ssn` VARCHAR(30) NOT NULL,
    `tax_identification_number` VARCHAR(30) NULL,
    `major_grade_level_id` INTEGER UNSIGNED NULL,
    `minor_grade_level_id` INTEGER UNSIGNED NULL,
    `nationality` VARCHAR(191) NOT NULL,
    `region_id` INTEGER UNSIGNED NULL,
    `tribe_id` INTEGER UNSIGNED NULL,
    `email` VARCHAR(255) NULL,
    `private_email` VARCHAR(255) NULL,
    `msisdn` VARCHAR(20) NULL,
    `alternate_msisdn` VARCHAR(20) NULL,
    `address` VARCHAR(191) NULL,
    `digital_address` VARCHAR(30) NULL,
    `job_title_id` INTEGER UNSIGNED NULL,
    `department_id` INTEGER UNSIGNED NULL,
    `division_id` INTEGER UNSIGNED NULL,
    `station_id` INTEGER UNSIGNED NULL,
    `cost_area_id` INTEGER UNSIGNED NULL,
    `status` VARCHAR(191) NOT NULL,
    `employment_date` DATETIME(3) NOT NULL,
    `termination_date` DATETIME(3) NULL,
    `reemployed` BOOLEAN NULL DEFAULT false,
    `resident` BOOLEAN NULL DEFAULT false,
    `union_member` BOOLEAN NULL DEFAULT false,
    `status_last_modified_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GrievanceType` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `GrievanceType_company_id_key`(`company_id`),
    UNIQUE INDEX `GrievanceType_code_company_id_key`(`code`, `company_id`),
    UNIQUE INDEX `GrievanceType_name_company_id_key`(`name`, `company_id`),
    FULLTEXT INDEX `GrievanceType_code_name_description_idx`(`code`, `name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GrievanceType` ADD CONSTRAINT `GrievanceType_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
