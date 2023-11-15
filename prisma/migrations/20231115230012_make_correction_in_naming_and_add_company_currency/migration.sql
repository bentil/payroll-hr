/*
  Warnings:

  - You are about to drop the column `currency` on the `reimbursement_request` table. All the data in the column will be lost.
  - Added the required column `currency_id` to the `reimbursement_request` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `reimbursement_request` DROP FOREIGN KEY `reimbursement_request_currency_fkey`;

-- AlterTable
ALTER TABLE `reimbursement_request` DROP COLUMN `currency`,
    ADD COLUMN `currency_id` INTEGER UNSIGNED NOT NULL;

-- CreateTable
CREATE TABLE `company_currency` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER UNSIGNED NOT NULL,
    `base_currency_id` INTEGER UNSIGNED NOT NULL,
    `currency_id` INTEGER UNSIGNED NOT NULL,
    `buy_rate` DECIMAL(20, 4) NOT NULL,
    `sell_rate` DECIMAL(20, 4) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `company_currency` ADD CONSTRAINT `company_currency_base_currency_id_fkey` FOREIGN KEY (`base_currency_id`) REFERENCES `currency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_currency` ADD CONSTRAINT `company_currency_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `currency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `company_currency` ADD CONSTRAINT `company_currency_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `payroll_company`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursement_request` ADD CONSTRAINT `reimbursement_request_currency_id_fkey` FOREIGN KEY (`currency_id`) REFERENCES `company_currency`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
