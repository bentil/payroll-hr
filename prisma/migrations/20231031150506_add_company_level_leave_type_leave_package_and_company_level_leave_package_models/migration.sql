-- CreateTable
CREATE TABLE `company_level` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` VARCHAR(100) NOT NULL,
    `company_Id` INTEGER UNSIGNED NULL,
    `level_number` SMALLINT NOT NULL,
    `level_name` VARCHAR(55) NOT NULL,
    `junior_level` BOOLEAN NOT NULL DEFAULT true,
    `parent_id` INTEGER NULL,
    `child_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_type` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `color_code` VARCHAR(10) NOT NULL,
    `description` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `leave_type_code_key`(`code`),
    UNIQUE INDEX `leave_type_name_key`(`name`),
    FULLTEXT INDEX `leave_type_code_name_description_idx`(`code`, `name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leave_package` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `leave_type_id` INTEGER UNSIGNED NOT NULL,
    `max_days` INTEGER NOT NULL,
    `paid` BOOLEAN NULL DEFAULT true,
    `redeemable` BOOLEAN NULL DEFAULT false,
    `accrued` BOOLEAN NULL DEFAULT true,
    `carry_over_days_value` INTEGER NULL,
    `carry_over_days_percent` DECIMAL(10, 4) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    INDEX `leave_package_company_id_idx`(`company_id`),
    INDEX `leave_package_code_idx`(`code`),
    INDEX `leave_package_leave_type_id_idx`(`leave_type_id`),
    INDEX `leave_package_paid_idx`(`paid`),
    INDEX `leave_package_redeemable_idx`(`redeemable`),
    INDEX `leave_package_accrued_idx`(`accrued`),
    UNIQUE INDEX `leave_package_code_company_id_key`(`code`, `company_id`),
    UNIQUE INDEX `leave_package_name_company_id_key`(`name`, `company_id`),
    FULLTEXT INDEX `leave_package_code_name_description_idx`(`code`, `name`, `description`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_level_leave_package` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_level_id` INTEGER UNSIGNED NOT NULL,
    `leave_package_id` INTEGER UNSIGNED NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `leave_package` ADD CONSTRAINT `leave_package_leave_type_id_fkey` FOREIGN KEY (`leave_type_id`) REFERENCES `leave_type`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_level_leave_package` ADD CONSTRAINT `company_level_leave_package_leave_package_id_fkey` FOREIGN KEY (`leave_package_id`) REFERENCES `leave_package`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_level_leave_package` ADD CONSTRAINT `company_level_leave_package_company_level_id_fkey` FOREIGN KEY (`company_level_id`) REFERENCES `company_level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
