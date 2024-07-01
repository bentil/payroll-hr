-- CreateTable
CREATE TABLE `announcement` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `body` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `public` BOOLEAN NULL DEFAULT false,
    `publish_date` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_resource` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `announcement_id` INTEGER UNSIGNED NOT NULL,
    `resource_type` ENUM('IMAGE', 'OTHER') NOT NULL,
    `url` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AnnouncementToGradeLevel` (
    `A` INTEGER UNSIGNED NOT NULL,
    `B` INTEGER UNSIGNED NOT NULL,

    UNIQUE INDEX `_AnnouncementToGradeLevel_AB_unique`(`A`, `B`),
    INDEX `_AnnouncementToGradeLevel_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `announcement` ADD CONSTRAINT `announcement_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_resource` ADD CONSTRAINT `announcement_resource_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `announcement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AnnouncementToGradeLevel` ADD CONSTRAINT `_AnnouncementToGradeLevel_A_fkey` FOREIGN KEY (`A`) REFERENCES `announcement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AnnouncementToGradeLevel` ADD CONSTRAINT `_AnnouncementToGradeLevel_B_fkey` FOREIGN KEY (`B`) REFERENCES `grade_level`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
