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

const getProductById = async (productId, companyId) => {
  const query = `
    SELECT *
    FROM products
    WHERE id = $1 AND company_id = $2;
  `;
  const result = await pool.query(query, [productId, companyId]);
  if (result.rows.length === 0) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }
  return result.rows[0];
};

const EDITABLE_FIELDS = ["product_name", "hsn_code", "gst_percent", "unit"];

const updateProduct = async (productId, companyId, updates) => {
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  for (const field of EDITABLE_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(updates, field)) {
      continue;
    }

    let value = updates[field];

    if (field === "product_name") {
      if (value == null || String(value).trim() === "") {
        const err = new Error("product_name cannot be empty");
        err.statusCode = 400;
        throw err;
      }
      value = String(value).trim();
    } else if (field === "gst_percent") {
      if (value === undefined || value === null || value === "") {
        const err = new Error("gst_percent cannot be empty");
        err.statusCode = 400;
        throw err;
      }
      value = Number(value);
      if (Number.isNaN(value)) {
        const err = new Error("gst_percent must be a number");
        err.statusCode = 400;
        throw err;
      }
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
  values.push(productId, companyId);

  const query = `
    UPDATE products
    SET ${setClauses.join(", ")}
    WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}
    RETURNING *;
  `;

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    const err = new Error("Product not found");
    err.statusCode = 404;
    throw err;
  }

  return result.rows[0];
};

module.exports = { createProduct, getProducts, getProductById, updateProduct };
