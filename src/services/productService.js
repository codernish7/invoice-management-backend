const pool = require("../config/db");

const createProduct = async (companyId, productData) => {
  const products = Array.isArray(productData) ? productData : [productData];

  const placeHolders = [];
  const values = [];

  products.forEach((items, index) => {
    const base = index * 4;
    placeHolders.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4})`);
    values.push(companyId, items.product_name, items.hsn_code, items.unit);
  });

  const query = `INSERT INTO products (company_id, product_name, hsn_code, unit) VALUES ${placeHolders.join(", ")} RETURNING *`;

  const result = await pool.query(query, values);

  return result.rows;
};

const getProducts = async (companyId) => {
  const query = `SELECT * FROM products WHERE company_id=$1 ORDER BY created_at ASC;`;
  const value = [companyId];
  const result = await pool.query(query, value);
  return result.rows;
};
module.exports = { createProduct, getProducts };
