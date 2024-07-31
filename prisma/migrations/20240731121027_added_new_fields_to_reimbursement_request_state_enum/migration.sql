-- AlterTable
ALTER TABLE `reimbursement_request_comment` MODIFY `request_state` ENUM('QUERY', 'APPROVAL', 'COMPLETION', 'REJECTION') NOT NULL;
