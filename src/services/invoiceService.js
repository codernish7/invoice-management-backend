const pool = require("../config/db");

const createInvoice = async (companyId, buyerId, invoiceData) => {
  const { invoice_type, invoice_date } = invoiceData;

  // Get invoice prefix
  const prefixResult = await pool.query(
    `SELECT invoice_prefix
     FROM company
     WHERE id = $1`,
    [companyId],
  );

  const prefix = prefixResult.rows[0].invoice_prefix;

  // Generate unique invoice number
  const uniqueNumber = Date.now();

  const invoiceNumber = `${prefix}-${uniqueNumber}`;

  const query = `
      INSERT INTO invoices
      (
        company_id,
        buyer_id,
        invoice_type,
        invoice_number,
        invoice_date,
        subtotal,
        grand_total
      )
      VALUES
      (
        $1,$2,$3,$4,$5,0,0
      )
      RETURNING *;
  `;

  const values = [
    companyId,
    buyerId,
    invoice_type,
    invoiceNumber,
    invoice_date,
  ];

  const result = await pool.query(query, values);

  return result.rows[0];
};

const createInvoiceItem = async (invoiceId, productId, invoiceItemData) => {
  const { quantity } = invoiceItemData;

  // Get product price
  const productResult = await pool.query(
    `SELECT selling_price
     FROM products
     WHERE id = $1`,
    [productId],
  );

  const rate = Number(productResult.rows[0].selling_price);

  const lineTotal = rate * quantity;

  // Insert invoice item
  const insertQuery = `
      INSERT INTO invoice_items
      (
        invoice_id,
        product_id,
        quantity,
        rate,
        line_total
      )
      VALUES
      (
        $1,$2,$3,$4,$5
      )
      RETURNING *;
  `;

  const insertValues = [invoiceId, productId, quantity, rate, lineTotal];

  const result = await pool.query(insertQuery, insertValues);

  // Calculate subtotal
  const subtotalResult = await pool.query(
    `
    SELECT SUM(line_total) AS subtotal
    FROM invoice_items
    WHERE invoice_id = $1
    `,
    [invoiceId],
  );

  const subtotal = subtotalResult.rows[0].subtotal;

  // Update invoice totals
  await pool.query(
    `
    UPDATE invoices
    SET subtotal = $1,
        grand_total = $1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    `,
    [subtotal, invoiceId],
  );

  return result.rows[0];
};

const getInvoice = async (invoiceId) => {
  const query = `
    SELECT

      i.invoice_number,
      i.invoice_date,
      i.invoice_type,
      i.subtotal,
      i.grand_total,

      c.name AS company_name,
      c.owner,
      c.phone AS company_phone,
      c.email AS company_email,
      c.address AS company_address,
      c.gstin AS company_gstin,

      b.buyer_name,
      b.business_name,
      b.phone AS buyer_phone,
      b.email AS buyer_email,
      b.address AS buyer_address,
      b.gstin AS buyer_gstin,

      p.product_name,

      ii.quantity,
      ii.rate,
      ii.line_total

    FROM invoices i

    JOIN company c
      ON i.company_id = c.id

    JOIN buyers b
      ON i.buyer_id = b.id

    JOIN invoice_items ii
      ON i.id = ii.invoice_id

    JOIN products p
      ON ii.product_id = p.id

    WHERE i.id = $1;
  `;

  const result = await pool.query(query, [invoiceId]);

  const rows = result.rows;

  if (rows.length === 0) {
    return null;
  }

  const invoice = {
    invoice_number: rows[0].invoice_number,
    invoice_date: rows[0].invoice_date,
    invoice_type: rows[0].invoice_type,
    subtotal: rows[0].subtotal,
    grand_total: rows[0].grand_total,
  };

  const company = {
    name: rows[0].company_name,
    owner: rows[0].owner,
    phone: rows[0].company_phone,
    email: rows[0].company_email,
    address: rows[0].company_address,
    gstin: rows[0].company_gstin,
  };

  const buyer = {
    buyer_name: rows[0].buyer_name,
    business_name: rows[0].business_name,
    phone: rows[0].buyer_phone,
    email: rows[0].buyer_email,
    address: rows[0].buyer_address,
    gstin: rows[0].buyer_gstin,
  };

  const items = [];

  rows.forEach((row) => {
    items.push({
      product_name: row.product_name,
      quantity: row.quantity,
      rate: row.rate,
      line_total: row.line_total,
    });
  });

  return {
    invoice,
    company,
    buyer,
    items,
  };
};

module.exports = {
  createInvoice,
  createInvoiceItem,
  getInvoice,
};
