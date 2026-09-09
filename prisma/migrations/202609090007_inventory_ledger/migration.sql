ALTER TABLE `InventoryTransaction`
  ADD COLUMN `variantId` VARCHAR(191) NULL,
  ADD COLUMN `orderId` VARCHAR(191) NULL,
  ADD COLUMN `source` ENUM('MANUAL', 'SALE', 'CANCELLATION', 'RETURN') NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `InventoryTransaction_idempotencyKey_key`
  ON `InventoryTransaction`(`idempotencyKey`);
CREATE INDEX `InventoryTransaction_variantId_idx`
  ON `InventoryTransaction`(`variantId`);
CREATE INDEX `InventoryTransaction_orderId_idx`
  ON `InventoryTransaction`(`orderId`);
CREATE INDEX `InventoryTransaction_source_createdAt_idx`
  ON `InventoryTransaction`(`source`, `createdAt`);

ALTER TABLE `InventoryTransaction`
  ADD CONSTRAINT `InventoryTransaction_variantId_fkey`
    FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `InventoryTransaction_orderId_fkey`
    FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
