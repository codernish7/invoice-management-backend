-- Add company bank columns (TEXT). Sensitive fields account_number / ifsc_code
-- are stored as AES-GCM ciphertext; bank_name / branch are plaintext.
ALTER TABLE company
    ADD COLUMN bank_name TEXT,
    ADD COLUMN account_number TEXT,
    ADD COLUMN ifsc_code TEXT,
    ADD COLUMN branch TEXT;

-- One bank-details row per client (1:1). Same encryption rule:
-- encrypt account_number / ifsc_code only; bank_name / branch plaintext.
CREATE TABLE client_bank_details (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
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
