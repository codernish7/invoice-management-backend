CREATE TABLE buyers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    buyer_name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(15),
    pan VARCHAR(10),
    gstin VARCHAR(15),
    address TEXT,
    business_name VARCHAR(100),
    onboarding_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_buyer_company
    FOREIGN KEY (company_id)
    REFERENCES company(id)
);