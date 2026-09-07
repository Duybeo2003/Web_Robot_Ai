-- Extend the existing order payment states and methods.
ALTER TABLE `Order`
  MODIFY `paymentMethod` ENUM('COD', 'BANK_TRANSFER', 'VNPAY') NOT NULL DEFAULT 'COD',
  MODIFY `paymentStatus` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID',
  ADD COLUMN `subtotal` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `shippingFee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `couponCode` VARCHAR(191) NULL,
  ADD COLUMN `couponDiscount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `pointDiscount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `amountPaid` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `amountDue` DECIMAL(10, 2) NOT NULL DEFAULT 0,
  ADD COLUMN `customerName` VARCHAR(191) NULL,
  ADD COLUMN `idempotencyKey` VARCHAR(191) NULL,
  ADD COLUMN `guestAccessTokenHash` VARCHAR(191) NULL,
  ADD COLUMN `inventoryReservedUntil` DATETIME(3) NULL,
  ADD COLUMN `logisticsProvider` VARCHAR(191) NULL,
  ADD COLUMN `trackingCode` VARCHAR(191) NULL,
  ADD COLUMN `shippedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `Order_idempotencyKey_key` ON `Order`(`idempotencyKey`);

-- Keep the oldest review before enforcing one review per user and product.
DELETE newer
FROM `Review` newer
INNER JOIN `Review` older
  ON newer.`userId` = older.`userId`
  AND newer.`productId` = older.`productId`
  AND (
    newer.`createdAt` > older.`createdAt`
    OR (newer.`createdAt` = older.`createdAt` AND newer.`id` > older.`id`)
  );
CREATE UNIQUE INDEX `Review_userId_productId_key` ON `Review`(`userId`, `productId`);

ALTER TABLE `CartItem` ADD COLUMN `selectionKey` VARCHAR(383) NULL;
UPDATE `CartItem`
SET `selectionKey` = CONCAT(`productId`, ':', COALESCE(`variantId`, 'base'));
DELETE newer
FROM `CartItem` newer
INNER JOIN `CartItem` older
  ON newer.`cartId` = older.`cartId`
  AND newer.`selectionKey` = older.`selectionKey`
  AND (
    newer.`createdAt` > older.`createdAt`
    OR (newer.`createdAt` = older.`createdAt` AND newer.`id` > older.`id`)
  );
ALTER TABLE `CartItem` MODIFY `selectionKey` VARCHAR(383) NOT NULL;
CREATE UNIQUE INDEX `CartItem_cartId_selectionKey_key` ON `CartItem`(`cartId`, `selectionKey`);

-- Backfill totals for orders created before the commercial checkout model.
UPDATE `Order`
SET
  `subtotal` = `totalAmount` + `discountAmount`,
  `couponDiscount` = `discountAmount`,
  `amountPaid` = CASE WHEN `paymentStatus` = 'PAID' THEN `totalAmount` ELSE 0 END,
  `amountDue` = CASE WHEN `paymentStatus` = 'PAID' THEN 0 ELSE `totalAmount` END;

CREATE TABLE `PaymentTransaction` (
  `id` VARCHAR(191) NOT NULL,
  `orderId` VARCHAR(191) NOT NULL,
  `provider` ENUM('COD', 'BANK_TRANSFER', 'VNPAY') NOT NULL,
  `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(191) NOT NULL DEFAULT 'VND',
  `idempotencyKey` VARCHAR(191) NOT NULL,
  `providerTransactionId` VARCHAR(191) NULL,
  `rawResponse` JSON NULL,
  `processedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PaymentTransaction_idempotencyKey_key`(`idempotencyKey`),
  UNIQUE INDEX `PaymentTransaction_providerTransactionId_key`(`providerTransactionId`),
  INDEX `PaymentTransaction_orderId_idx`(`orderId`),
  INDEX `PaymentTransaction_provider_status_idx`(`provider`, `status`),
  INDEX `PaymentTransaction_createdAt_idx`(`createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PaymentTransaction`
  ADD CONSTRAINT `PaymentTransaction_orderId_fkey`
  FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;
