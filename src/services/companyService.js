const pool = require("../config/db");
const { encrypt } = require("../utils/encryption");
const { hashPassword, comparePassword } = require("../utils/password");

const normalizeEmail = (email) => {
  if (email == null) return "";
  return String(email).trim().toLowerCase();
};

const stripPasswordHash = (row) => {
  if (!row) return row;
  const { password_hash, ...safe } = row;
  return safe;
};

const createCompany = async (companyData) => {
  const {
    owner,
    name,
    phone,
    email,
    password,
    pan,
    gstin,
    address,
    invoice_prefix,
    state,
    bank_name,
    account_number,
    ifsc_code,
    branch,
  } = companyData;

  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    const err = new Error("Email is required");
    err.statusCode = 400;
    throw err;
  }

  if (!password || String(password).length < 8) {
    const err = new Error("Password must be at least 8 characters");
    err.statusCode = 400;
    throw err;
  }

  if (!owner || !name || !invoice_prefix) {
    const err = new Error("owner, name, and invoice_prefix are required");
    err.statusCode = 400;
    throw err;
  }

  const password_hash = await hashPassword(password);

  const query = `INSERT INTO company (
  owner,
  name,
  phone,
  email,
  pan,
  gstin,
  address,
  invoice_prefix,
  state,
  bank_name,
  account_number,
  ifsc_code,
  branch,
  password_hash)
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
  RETURNING *;`;

  const values = [
    owner,
    name,
    phone || null,
    normalizedEmail,
    pan || null,
    gstin || null,
    address || null,
    invoice_prefix,
    state || null,
    bank_name || null,
    encrypt(account_number),
    encrypt(ifsc_code),
    branch || null,
    password_hash,
  ];

  try {
    const result = await pool.query(query, values);
    return stripPasswordHash(result.rows[0]);
  } catch (error) {
    if (error.code === "23505") {
      const err = new Error("Email already registered");
      err.statusCode = 409;
      throw err;
    }
    throw error;
  }
};

const authenticateCompany = async (email, password) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || password == null || String(password) === "") {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const result = await pool.query(`SELECT * FROM company WHERE email = $1`, [
    normalizedEmail,
  ]);

  if (result.rows.length === 0) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  const company = result.rows[0];
  const matches = await comparePassword(password, company.password_hash);

  if (!matches) {
    const err = new Error("Invalid email or password");
    err.statusCode = 401;
    throw err;
  }

  return stripPasswordHash(company);
};

const getCompanyById = async (companyId) => {
  const result = await pool.query(`SELECT * FROM company WHERE id = $1`, [
    companyId,
  ]);

  if (result.rows.length === 0) {
    const err = new Error("Company not found");
    err.statusCode = 404;
    throw err;
  }

  return stripPasswordHash(result.rows[0]);
};

const EDITABLE_FIELDS = [
  "owner",
  "name",
  "phone",
  "pan",
  "gstin",
  "address",
  "state",
  "invoice_prefix",
  "bank_name",
  "account_number",
  "ifsc_code",
  "branch",
];

const updateCompany = async (companyId, updates) => {
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of EDITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) {
      continue;
    }

    let value = updates[field];

    if (field === "account_number" || field === "ifsc_code") {
      value = encrypt(value);
    } else if (value === "") {
      value = null;
    }

    setClauses.push(`${field} = $${paramIndex}`);
    values.push(value ?? null);
    paramIndex += 1;
  }

  if (setClauses.length === 0) {
    const err = new Error("No updatable fields provided");
    err.statusCode = 400;
    throw err;
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(companyId);

  const query = `
    UPDATE company
    SET ${setClauses.join(", ")}
    WHERE id = $${paramIndex}
    RETURNING *;
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    const err = new Error("Company not found");
    err.statusCode = 404;
    throw err;
  }

  return stripPasswordHash(result.rows[0]);
};

module.exports = {
  createCompany,
  authenticateCompany,
  getCompanyById,
  updateCompany,
};
