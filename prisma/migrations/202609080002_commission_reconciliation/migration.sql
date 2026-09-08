ALTER TABLE `Commission`
  MODIFY `status` ENUM('PENDING', 'PAID', 'CANCELLED', 'REVERSED') NOT NULL DEFAULT 'PENDING',
  ADD COLUMN `payoutReference` VARCHAR(191) NULL,
  ADD COLUMN `paidAt` DATETIME(3) NULL,
  ADD COLUMN `reversedAt` DATETIME(3) NULL;

CREATE UNIQUE INDEX `Commission_payoutReference_key`
  ON `Commission`(`payoutReference`);
