-- CreateTable
CREATE TABLE `grade_level` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `company_level_id` INTEGER UNSIGNED NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `description` TEXT NOT NULL,
    `type` ENUM('MAJOR', 'MINOR') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee` ADD CONSTRAINT `employee_major_grade_level_id_fkey` FOREIGN KEY (`major_grade_level_id`) REFERENCES `grade_level`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `grade_level` ADD CONSTRAINT `grade_level_company_level_id_fkey` FOREIGN KEY (`company_level_id`) REFERENCES `company_level`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
