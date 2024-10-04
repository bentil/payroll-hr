-- CreateTable
CREATE TABLE `job_title` (
    `id` INTEGER UNSIGNED NOT NULL,
    `organization_id` VARCHAR(100) NOT NULL,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `employee_band_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `description` TEXT NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `company_level_id` INTEGER UNSIGNED NOT NULL,
    `minimum_age` TINYINT UNSIGNED NULL,
    `maximum_age` TINYINT UNSIGNED NULL,
    `minimum_experience_years` TINYINT UNSIGNED NULL,
    `accept_disability` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `company_tree_node` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `job_title_id` INTEGER UNSIGNED NOT NULL,
    `employee_id` INTEGER UNSIGNED NULL,
    `parent_id` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_tree_node` ADD CONSTRAINT `company_tree_node_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_tree_node` ADD CONSTRAINT `company_tree_node_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_tree_node` ADD CONSTRAINT `company_tree_node_job_title_id_fkey` FOREIGN KEY (`job_title_id`) REFERENCES `job_title`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
