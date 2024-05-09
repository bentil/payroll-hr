
-- Lock Table and Related Table(s)
LOCK TABLES
  -- `_prisma_migrations` WRITE,
  `company_level` WRITE,
  `company_level_leave_package` WRITE;

-- Disable Foreign Key checks
SET FOREIGN_KEY_CHECKS=0;

-- AlterTable
ALTER TABLE `company_level` MODIFY `id` INTEGER UNSIGNED NOT NULL;

-- Enable Foreign Key checks
SET FOREIGN_KEY_CHECKS=1;

-- Unlock Tables
UNLOCK TABLES;
