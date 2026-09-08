-- The unique orderId index now supports the foreign key, so the temporary
-- bridge index is no longer needed.
DROP INDEX `ReturnRequest_orderId_fk_bridge_idx` ON `ReturnRequest`;
