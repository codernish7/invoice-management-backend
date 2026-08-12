const pool = require("../config/db");
const { encrypt } = require("../utils/encryption");



const assertClientBelongsToCompany = async (clientId, companyId) => {
  const result = await pool.query(
    `SELECT id FROM client WHERE id = $1 AND company_id = $2`,
    [clientId, companyId]
  );

  if (result.rows.length === 0) {
    throw new Error("Client not found");
  }
};

const createClientBankDetails = async (companyId, clientId, bankData) => {
  await assertClientBelongsToCompany(clientId, companyId);

  const { bank_name, account_number, ifsc_code, branch } = bankData;

  try {
    const result = await pool.query(
      `INSERT INTO client_bank_details
        (client_id, bank_name, account_number, ifsc_code, branch)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        clientId,
        bank_name || null,
        encrypt(account_number),
        encrypt(ifsc_code),
        branch || null,
      ]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw new Error("Bank details already exist for this client");
    }
    throw error;
  }
};

const updateClientBankDetails = async (companyId, clientId, bankData) => {
  await assertClientBelongsToCompany(clientId, companyId);

  const { bank_name, account_number, ifsc_code, branch } = bankData;

  const result = await pool.query(
    `UPDATE client_bank_details
     SET
       bank_name = $1,
       account_number = $2,
       ifsc_code = $3,
       branch = $4,
       updated_at = CURRENT_TIMESTAMP
     WHERE client_id = $5
     RETURNING *`,
    [
      bank_name || null,
      encrypt(account_number),
      encrypt(ifsc_code),
      branch || null,
      clientId,
    ]
  );

  if (result.rows.length === 0) {
    throw new Error("Bank details not found");
  }

  return result.rows[0];
};

module.exports = { createClientBankDetails, updateClientBankDetails };
