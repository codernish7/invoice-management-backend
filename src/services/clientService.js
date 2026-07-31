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

const getClient = async (companyId) => {
  const query = `SELECT * FROM client WHERE company_id =$1 ORDER BY created_at ASC;`;
  const value = [companyId];
  const result = await pool.query(query, value);
  return result.rows;
};

module.exports = { createClient, getClient };
