CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_product_company
        FOREIGN KEY (company_id)
        REFERENCES company(id)
);