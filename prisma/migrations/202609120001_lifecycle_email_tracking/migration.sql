-- AlterTable
ALTER TABLE `cart` ADD COLUMN `abandonedEmailSentAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `order` ADD COLUMN `reviewRequestSentAt` DATETIME(3) NULL;
