-- Disable Foreign Key checks
SET FOREIGN_KEY_CHECKS=0;

-- AlterTable
ALTER TABLE `grade_level` MODIFY `id` INTEGER UNSIGNED NOT NULL;

-- Enable Foreign Key checks
SET FOREIGN_KEY_CHECKS=1;
