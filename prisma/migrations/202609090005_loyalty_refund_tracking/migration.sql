ALTER TABLE `Order`
  ADD COLUMN `pointsRestoredAt` DATETIME(3) NULL;

UPDATE `Order`
SET `pointsRestoredAt` = `updatedAt`
WHERE `pointsUsed` > 0
  AND (
    `status` = 'CANCELLED'
    OR (`status` = 'RETURNED' AND `paymentStatus` = 'REFUNDED')
  );
