/*
  Warnings:

  - Made the column `public` on table `announcement` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `announcement` MODIFY `public` BOOLEAN NOT NULL DEFAULT false;
