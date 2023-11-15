-- CreateTable
CREATE TABLE `reimbursement_request` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `employee_id` INTEGER UNSIGNED NOT NULL,
    `title` VARCHAR(50) NOT NULL,
    `description` TEXT NOT NULL,
    `currency` INTEGER UNSIGNED NOT NULL,
    `amount` DECIMAL(20, 4) NOT NULL,
    `status` ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'QUERIED', 'COMPLETED') NOT NULL,
    `expenditure_date` DATETIME(3) NOT NULL,
    `approver_id` INTEGER UNSIGNED NULL,
    `completer_id` INTEGER UNSIGNED NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,
    `status_last_modified_at` DATETIME(3) NULL,
    `approved_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reimbursement_request_attachment` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER UNSIGNED NOT NULL,
    `uploader_id` INTEGER UNSIGNED NOT NULL,
    `attachment_url` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reimbursement_request_comment` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `request_id` INTEGER UNSIGNED NOT NULL,
    `commenter_id` INTEGER UNSIGNED NOT NULL,
    `request_state` ENUM('QUERY', 'APPROVAL', 'COMPLETION') NOT NULL,
    `comment` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `modified_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reimbursement_request` ADD CONSTRAINT `reimbursement_request_employee_id_fkey` FOREIGN KEY (`employee_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursement_request` ADD CONSTRAINT `reimbursement_request_approver_id_fkey` FOREIGN KEY (`approver_id`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursement_request` ADD CONSTRAINT `reimbursement_request_completer_id_fkey` FOREIGN KEY (`completer_id`) REFERENCES `employee`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursement_request_attachment` ADD CONSTRAINT `reimbursement_request_attachment_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `reimbursement_request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursement_request_attachment` ADD CONSTRAINT `reimbursement_request_attachment_uploader_id_fkey` FOREIGN KEY (`uploader_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursement_request_comment` ADD CONSTRAINT `reimbursement_request_comment_request_id_fkey` FOREIGN KEY (`request_id`) REFERENCES `reimbursement_request`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reimbursement_request_comment` ADD CONSTRAINT `reimbursement_request_comment_commenter_id_fkey` FOREIGN KEY (`commenter_id`) REFERENCES `employee`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
