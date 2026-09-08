-- Keep a second FK-supporting index in place while the following committed
-- migration replaces the original non-unique orderId index with a unique one.
CREATE INDEX `ReturnRequest_orderId_fk_bridge_idx`
  ON `ReturnRequest`(`orderId`);
