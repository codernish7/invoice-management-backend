const pool = require("../config/db");

const createProduct = async (companyId, productData) => {
  const { product_name, selling_price, stock } = productData;

  const query = `INSERT INTO products (company_id, product_name, selling_price, stock) VALUES ($1,$2,$3,$4) RETURNING *;`;

  const values = [companyId,product_name, selling_price, stock]

  const result = await pool.query(query,values)

  return result.rows[0]
};
module.exports = { createProduct };
