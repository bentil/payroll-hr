-- CreateTable
CREATE TABLE `overtime` (
    `id` INTEGER UNSIGNED NOT NULL,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `employee_band_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(30) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `min_hours_required` INTEGER NOT NULL,
    `max_hours_permitted` INTEGER NOT NULL,
    `taxable` BOOLEAN NOT NULL,
    `active` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `employee_overtime_entry` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `pay_period_id` INTEGER UNSIGNED NOT NULL,
    `overtime_id` INTEGER UNSIGNED NOT NULL,
    `number_of_hours` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry` ADD CONSTRAINT `employee_overtime_entry_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry` ADD CONSTRAINT `employee_overtime_entry_pay_period_id_fkey` FOREIGN KEY (`pay_period_id`) REFERENCES `pay_period`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `employee_overtime_entry` ADD CONSTRAINT `employee_overtime_entry_overtime_id_fkey` FOREIGN KEY (`overtime_id`) REFERENCES `overtime`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
