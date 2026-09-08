ALTER TABLE `WalletTransaction`
  ADD COLUMN `providerReference` VARCHAR(191) NULL,
  ADD COLUMN `processedAt` DATETIME(3) NULL;

UPDATE `WalletTransaction`
SET `processedAt` = `createdAt`
WHERE `status` IN ('COMPLETED', 'REJECTED') AND `processedAt` IS NULL;

CREATE UNIQUE INDEX `WalletTransaction_providerReference_key`
  ON `WalletTransaction`(`providerReference`);
CREATE INDEX `WalletTransaction_type_status_createdAt_idx`
  ON `WalletTransaction`(`type`, `status`, `createdAt`);
