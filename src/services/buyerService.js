const pool = require("../config/db");

const createBuyer = async (companyId, buyerData) => {
  const {
    buyer_name,
    email,
    phone,
    pan,
    gstin,
    address,
    business_name,
    onboarding_date,
  } = buyerData;

  const query = `INSERT INTO buyers 
  ( 
    company_id,
    buyer_name,
    email,
    phone,
    pan,
    gstin,
    address,
    business_name,
    onboarding_date
    
    ) 

    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) 
    
    RETURNING *;`;

  const values = [
    companyId,
    buyer_name,
    email,
    phone,
    pan,
    gstin,
    address,
    business_name,
    onboarding_date,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

module.exports = { createBuyer };
