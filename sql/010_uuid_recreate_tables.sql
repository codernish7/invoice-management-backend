-- TODO 7: Drop/recreate all tables with UUID PKs/FKs.
-- Source of truth: live PostgreSQL snapshot (plan TODO 2–4), not stale 001–009.
-- Destructive: existing row data is discarded. Empty tables after this script.

-- ---------------------------------------------------------------------------
-- DROP (dependency order) + leftover SERIAL sequences
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS client_bank_details CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS company CASCADE;

DROP SEQUENCE IF EXISTS invoice_items_id_seq;
DROP SEQUENCE IF EXISTS invoices_id_seq;
DROP SEQUENCE IF EXISTS client_bank_details_id_seq;
DROP SEQUENCE IF EXISTS products_id_seq;
DROP SEQUENCE IF EXISTS client_id_seq;
DROP SEQUENCE IF EXISTS company_id_seq;

-- ---------------------------------------------------------------------------
-- CREATE (dependency order)
-- PostgreSQL 18: gen_random_uuid() is native (no pgcrypto required).
-- ---------------------------------------------------------------------------

CREATE TABLE company (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100) NOT NULL,
    pan VARCHAR(10),
    gstin VARCHAR(15),
    address TEXT,
    invoice_prefix VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    state VARCHAR(50),
    next_invoice_number INTEGER NOT NULL DEFAULT 1,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    branch TEXT,
    password_hash TEXT NOT NULL,
    CONSTRAINT company_email_key UNIQUE (email)
);

CREATE TABLE client (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    pan VARCHAR(10),
    gstin VARCHAR(15),
    address TEXT,
    client_business VARCHAR(255),
    state VARCHAR(100),
    onboarding_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_client_email UNIQUE (company_id, email),
    CONSTRAINT uq_client_phone UNIQUE (company_id, phone),
    CONSTRAINT uq_client_pan UNIQUE (company_id, pan),
    CONSTRAINT uq_client_gstin UNIQUE (company_id, gstin)
);

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    hsn_code VARCHAR(20),
    unit VARCHAR(20),
    gst_percent NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
);

CREATE TABLE client_bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    ifsc_code TEXT,
    branch TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_bank_client
        FOREIGN KEY (client_id)
        REFERENCES client(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_client_bank_client UNIQUE (client_id)
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    client_id UUID NOT NULL,
    invoice_type VARCHAR(20) NOT NULL,
    invoice_number VARCHAR(50) NOT NULL,
    invoice_date DATE NOT NULL,
    subtotal NUMERIC(10,2) DEFAULT 0,
    grand_total NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cgst_amount NUMERIC(12,2) DEFAULT 0,
    sgst_amount NUMERIC(12,2) DEFAULT 0,
    igst_amount NUMERIC(12,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'DRAFT',
    CONSTRAINT fk_invoice_company
        FOREIGN KEY (company_id)
        REFERENCES company(id),
    CONSTRAINT fk_invoice_client
        FOREIGN KEY (client_id)
        REFERENCES client(id),
    CONSTRAINT invoices_invoice_number_key UNIQUE (invoice_number),
    CONSTRAINT unique_company_invoice UNIQUE (company_id, invoice_number)
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL,
    product_id UUID,
    quantity INTEGER NOT NULL,
    rate NUMERIC(10,2) NOT NULL,
    line_total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    product_name VARCHAR(255) NOT NULL,
    hsn_code VARCHAR(20),
    unit VARCHAR(20),
    gst_percent NUMERIC(5,2) NOT NULL,
    gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_invoiceitem_invoice
        FOREIGN KEY (invoice_id)
        REFERENCES invoices(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_invoiceitem_product
        FOREIGN KEY (product_id)
        REFERENCES products(id)
);
