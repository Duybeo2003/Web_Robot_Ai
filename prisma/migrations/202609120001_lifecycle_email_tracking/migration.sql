-- AlterTable
ALTER TABLE `Cart` ADD COLUMN `abandonedEmailSentAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `Order` ADD COLUMN `reviewRequestSentAt` DATETIME(3) NULL;
