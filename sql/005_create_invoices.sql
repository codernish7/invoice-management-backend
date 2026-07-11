CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    buyer_id INTEGER,
    seller_id INTEGER,
    invoice_type VARCHAR(20) NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_date DATE NOT NULL,
    subtotal NUMERIC(10,2) DEFAULT 0,
    grand_total NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_company
        FOREIGN KEY (company_id)
        REFERENCES company(id),

    CONSTRAINT fk_invoice_buyer
        FOREIGN KEY (buyer_id)
        REFERENCES buyers(id),

    CONSTRAINT fk_invoice_seller
        FOREIGN KEY (seller_id)
        REFERENCES sellers(id)
);