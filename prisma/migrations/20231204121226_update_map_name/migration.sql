/*
  Warnings:

  - You are about to drop the column `numberOfDays` on the `leave_plan` table. All the data in the column will be lost.
  - You are about to drop the column `numberOfDays` on the `leave_request` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `leave_plan` DROP COLUMN `numberOfDays`,
    ADD COLUMN `number_of_days` INTEGER NULL;

-- AlterTable
ALTER TABLE `leave_request` DROP COLUMN `numberOfDays`,
    ADD COLUMN `number_of_days` INTEGER NULL;
