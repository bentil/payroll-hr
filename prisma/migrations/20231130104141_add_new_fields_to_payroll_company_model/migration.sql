-- AlterTable
ALTER TABLE `payroll_company` ADD COLUMN `consider_public_holiday_as_workday` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `consider_weekend_as_workday` BOOLEAN NOT NULL DEFAULT false;
