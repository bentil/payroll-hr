-- CreateTable
CREATE TABLE `holiday` (
    `id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(200) NOT NULL DEFAULT '',
    `type` ENUM('PUBLIC_HOLIDAY', 'WEEKEND') NOT NULL,
    `date` DATE NOT NULL,
    `organization_id` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
