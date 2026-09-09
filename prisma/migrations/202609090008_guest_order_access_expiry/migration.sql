ALTER TABLE `Order`
  ADD COLUMN `guestAccessExpiresAt` DATETIME(3) NULL;

UPDATE `Order`
SET `guestAccessExpiresAt` = DATE_ADD(`createdAt`, INTERVAL 24 HOUR)
WHERE `guestAccessTokenHash` IS NOT NULL;
