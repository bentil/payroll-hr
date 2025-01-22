-- AlterTable
ALTER TABLE `employee` ADD COLUMN `pensioner` BOOLEAN NULL DEFAULT false,
    MODIFY `title` VARCHAR(10) NULL;
