-- AlterTable
ALTER TABLE `reimbursement_request` MODIFY `status` ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'QUERIED', 'COMPLETED') NOT NULL DEFAULT 'SUBMITTED';
