-- Allow ad-hoc purchase lines without a catalog product.
-- FK fk_invoiceitem_product remains; NULLs are permitted.
ALTER TABLE invoice_items
    ALTER COLUMN product_id DROP NOT NULL;
