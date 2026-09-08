ALTER TABLE `Review`
  ADD COLUMN `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'APPROVED';

UPDATE `Review`
SET `status` = 'APPROVED';

CREATE INDEX `Review_status_createdAt_idx`
  ON `Review`(`status`, `createdAt`);
