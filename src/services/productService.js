const pool = require("../config/db");
const { escapeIlikePattern } = require("../utils/pagination");

const SEARCH_COLUMNS = ["product_name", "hsn_code"];

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

const getProducts = async (
  companyId,
  {
    minimal = false,
    page,
    limit,
    search = "",
    gstPercent = null,
    unit = "",
  } = {}
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

  if (gstPercent !== null) {
    values.push(gstPercent);
    whereClause += ` AND gst_percent = $${values.length}`;
  }

  if (unit) {
    values.push(unit);
    whereClause += ` AND LOWER(unit) = LOWER($${values.length})`;
  }

  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS count FROM products WHERE ${whereClause}`,
    values
  );
  const totalItems = countResult.rows[0].count;

  const selectList = minimal
    ? "id, product_name, unit, hsn_code"
    : "*";
  const orderBy = minimal
    ? "product_name ASC, id ASC"
    : "created_at DESC, id DESC";
  const limitParam = values.length + 1;
  const offsetParam = values.length + 2;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `
      SELECT ${selectList}
      FROM products
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
    [...values, limit, offset]
  );

  return { data: result.rows, totalItems };
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
