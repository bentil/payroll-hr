-- CreateIndex
CREATE FULLTEXT INDEX `announcement_title_body_idx` ON `announcement`(`title`, `body`);
