-- AlterTable
ALTER TABLE `leave_response` MODIFY `response_type` ENUM('APPROVED', 'DECLINED', 'ADJUSTED') NOT NULL;
