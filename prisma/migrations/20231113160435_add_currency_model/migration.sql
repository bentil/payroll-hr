-- CreateTable
CREATE TABLE `currency` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(5) NOT NULL,
    `symbol` VARCHAR(5) NOT NULL,
    `name` VARCHAR(30) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    UNIQUE INDEX `currency_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reimbursement_request` ADD CONSTRAINT `reimbursement_request_currency_fkey` FOREIGN KEY (`currency`) REFERENCES `currency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
