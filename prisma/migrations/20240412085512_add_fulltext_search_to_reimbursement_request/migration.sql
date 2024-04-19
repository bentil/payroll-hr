-- CreateIndex
CREATE FULLTEXT INDEX `reimbursement_request_title_description_status_idx` ON `reimbursement_request`(`title`, `description`);
