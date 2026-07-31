CREATE TABLE client (
    id SERIAL PRIMARY KEY,

    company_id INT NOT NULL,

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