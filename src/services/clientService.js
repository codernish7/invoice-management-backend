const pool = require("../config/db");

const createClient = async (clientData, companyId) => {
  const {
    name,
    email,
    phone,
    pan,
    gstin,
    address,
    client_business,
    onboarding_date,
    state,
  } = clientData;

  const query = `INSERT INTO client
  ( 
    company_id,
    name,
    email,
    phone,
    pan,
    gstin,
    address,
    client_business,
    onboarding_date,
    state
    ) 

    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) 
    
    RETURNING *;`;

  const values = [
    companyId,
    name,
    email,
    phone,
    pan,
    gstin,
    address,
    client_business,
    onboarding_date,
    state,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const getClient = async (companyId, minimal = false) => {
  let query = "";

  if (minimal) {
    query = `
      SELECT
        id,
        client_business
      FROM client
      WHERE company_id = $1
      ORDER BY client_business;
    `;
  } else {
    query = `
      SELECT *
      FROM client
      WHERE company_id = $1
      ORDER BY created_at DESC;
    `;
  }

  const result = await pool.query(query, [companyId]);

  return result.rows;
};

module.exports = { createClient, getClient };
