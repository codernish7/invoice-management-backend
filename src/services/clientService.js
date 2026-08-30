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

const getClients = async (companyId, minimal = false) => {
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

const getClientById = async (clientId, companyId) => {
  const query = `SELECT * FROM client WHERE id = $1 AND company_id = $2;`;
  const result = await pool.query(query, [clientId, companyId]);
  if (result.rows.length === 0) {
    throw new Error("Client not found");
  }
  return result.rows[0];
};

const EDITABLE_FIELDS = [
  "name",
  "email",
  "phone",
  "pan",
  "gstin",
  "address",
  "client_business",
  "onboarding_date",
  "state",
];

const updateClient = async (clientId, clientData, companyId) => {
  const setClauses = [];
  const values = [];

  for (const field of EDITABLE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(clientData, field)) {
      setClauses.push(`${field} = $${values.length + 1}`);
      values.push(clientData[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new Error("No fields to update");
  }

  values.push(clientId);
  values.push(companyId);

  const query = `
    UPDATE client
    SET ${setClauses.join(", ")},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $${values.length - 1}
      AND company_id = $${values.length}
    RETURNING *;
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new Error("Client not found");
  }

  return result.rows[0];
};

module.exports = { createClient, getClients, updateClient, getClientById };
