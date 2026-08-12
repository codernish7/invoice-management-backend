//business logic function written is written in service and exported to controller, it will accept an argument and use it to query the database and do some CRUD

const pool = require("../config/db");
const { encrypt } = require("../utils/encryption");

const createCompany = async (companyData) => {
  const {
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
  } = companyData;

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
  branch) 
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) 
  RETURNING *;`;

  const values = [
    owner,
    name,
    phone,
    email,
    pan,
    gstin,
    address,
    invoice_prefix,
    state,
    bank_name || null,
    encrypt(account_number),
    encrypt(ifsc_code),
    branch || null,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

module.exports = { createCompany };
