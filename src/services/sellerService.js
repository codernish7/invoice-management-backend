const pool = require("../config/db");

const createSeller = async (companyId, sellerData) => {
  const {
    seller_name,
    email,
    phone,
    pan,
    gstin,
    address,
    business_name,
    onboarding_date,
  } = sellerData;

  const query = `
    INSERT INTO sellers
    (
      company_id,
      seller_name,
      email,
      phone,
      pan,
      gstin,
      address,
      business_name,
      onboarding_date
    )
    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8,$9
    )
    RETURNING *;
  `;

  const values = [
    companyId,
    seller_name,
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

module.exports = {
  createSeller,
};