CREATE INDEX `Order_status_paymentStatus_inventoryReservedUntil_idx`
  ON `Order`(`status`, `paymentStatus`, `inventoryReservedUntil`);

-- Preserve the oldest workflow before enforcing one return request per order.
DELETE newer
FROM `ReturnRequest` newer
INNER JOIN `ReturnRequest` older
  ON newer.`orderId` = older.`orderId`
  AND (
    newer.`createdAt` > older.`createdAt`
    OR (newer.`createdAt` = older.`createdAt` AND newer.`id` > older.`id`)
  );
DROP INDEX `ReturnRequest_orderId_idx` ON `ReturnRequest`;
CREATE UNIQUE INDEX `ReturnRequest_orderId_key` ON `ReturnRequest`(`orderId`);

CREATE TABLE `ContactRequest` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `phone` VARCHAR(191) NOT NULL,
  `email` VARCHAR(191) NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('NEW', 'IN_PROGRESS', 'RESOLVED', 'SPAM') NOT NULL DEFAULT 'NEW',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `ContactRequest_status_createdAt_idx`(`status`, `createdAt`),
  INDEX `ContactRequest_phone_idx`(`phone`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
