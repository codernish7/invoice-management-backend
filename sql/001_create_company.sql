CREATE TABLE company (
    id SERIAL PRIMARY KEY,
    owner VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(15),
    email VARCHAR(100),
    pan VARCHAR(10),
    gstin VARCHAR(15),
    address TEXT,
    invoice_prefix VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);