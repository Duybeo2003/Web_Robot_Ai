ALTER TABLE `Order`
  ADD COLUMN `completedAt` DATETIME(3) NULL;

UPDATE `Order`
SET `completedAt` = `updatedAt`
WHERE `status` = 'COMPLETED' AND `completedAt` IS NULL;
