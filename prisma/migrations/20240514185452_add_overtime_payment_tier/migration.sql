-- CreateTable
CREATE TABLE `overtime_payment_tier` (
    `id` INTEGER UNSIGNED NOT NULL,
    `overtime_id` INTEGER UNSIGNED NOT NULL,
    `type` ENUM('FIXED', 'PER_HOUR', 'BY_HOURLY_WAGE') NOT NULL,
    `fixed_component` DECIMAL(20, 4) NOT NULL DEFAULT 0.0,
    `factor_component` DECIMAL(20, 4) NOT NULL DEFAULT 0.0,
    `min_hours` INTEGER NOT NULL,
    `max_hours` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,
    `currency_id` INTEGER UNSIGNED NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `overtime_payment_tier` ADD CONSTRAINT `overtime_payment_tier_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `company_currency`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `overtime_payment_tier` ADD CONSTRAINT `overtime_payment_tier_overtime_id_fkey` FOREIGN KEY (`overtime_id`) REFERENCES `overtime`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
