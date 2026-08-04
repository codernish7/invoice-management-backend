const pool = require("../config/db");

const createProduct = async (companyId, productData) => {
  const products = Array.isArray(productData) ? productData : [productData];

  const placeHolders = [];
  const values = [];

  products.forEach((items, index) => {
    const base = index * 5;
    placeHolders.push(`($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5})`);
    values.push(companyId, items.product_name, items.hsn_code, items.unit, items.gst_percent);
  });

  const query = `INSERT INTO products (company_id, product_name, hsn_code, unit, gst_percent) VALUES ${placeHolders.join(", ")} RETURNING *`;

  const result = await pool.query(query, values);

  return result.rows;
};

const getProducts = async (companyId, minimal = false) => {
  let query = "";

  if (minimal) {
    query = `
      SELECT
        id,
        product_name,
        unit,
        hsn_code
      FROM products
      WHERE company_id = $1
      ORDER BY product_name;
    `;
  } else {
    query = `
      SELECT *
      FROM products
      WHERE company_id = $1
      ORDER BY created_at DESC;
    `;
  }

  const result = await pool.query(query, [companyId]);

  return result.rows;
};
module.exports = { createProduct, getProducts };
