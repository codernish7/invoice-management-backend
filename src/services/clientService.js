const pool = require("../config/db");
const { escapeIlikePattern } = require("../utils/pagination");

const SEARCH_COLUMNS = [
  "name",
  "client_business",
  "gstin",
  "email",
  "phone",
  "state",
];

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

const getClients = async (
  companyId,
  { minimal = false, page, limit, search = "" } = {}
) => {
  const values = [companyId];
  let whereClause = "company_id = $1";

  if (search) {
    values.push(`%${escapeIlikePattern(search)}%`);
    const searchParam = `$${values.length}`;
    const searchConditions = SEARCH_COLUMNS.map(
      (column) => `${column} ILIKE ${searchParam} ESCAPE '\\'`
    ).join(" OR ");
    whereClause += ` AND (${searchConditions})`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM client WHERE ${whereClause}`,
    values
  );
  const totalItems = countResult.rows[0].count;

  const selectList = minimal ? "id, client_business" : "*";
  const orderBy = minimal
    ? "client_business ASC NULLS LAST, id ASC"
    : "created_at DESC, id DESC";
  const limitParam = values.length + 1;
  const offsetParam = values.length + 2;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `
      SELECT ${selectList}
      FROM client
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
    [...values, limit, offset]
  );

  return { data: result.rows, totalItems };
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
