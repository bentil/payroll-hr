/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `employee` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `employee` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `employee` ADD COLUMN `exclude_from_payroll_run` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hr` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `user_id` VARCHAR(191) NULL,
    ADD COLUMN `username` VARCHAR(50) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `employee_username_key` ON `employee`(`username`);

-- CreateIndex
CREATE UNIQUE INDEX `employee_user_id_key` ON `employee`(`user_id`);
