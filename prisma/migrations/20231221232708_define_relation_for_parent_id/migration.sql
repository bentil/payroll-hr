-- AddForeignKey
ALTER TABLE `company_tree_node` ADD CONSTRAINT `company_tree_node_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `company_tree_node`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
