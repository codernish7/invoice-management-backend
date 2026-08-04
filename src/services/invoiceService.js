const pool = require("../config/db");

const createInvoice = async (companyId, invoiceData) => {
  console.log(companyId);
  console.log(invoiceData);

  const { client_id, invoice_type, status, invoice_date, items } = invoiceData;

  if (!client_id) {
    throw new Error("Client is required");
  }

  const clientQuery = `
        SELECT
            id,
            state
        FROM client
        WHERE id=$1
        AND company_id=$2
      `;

  const clientResult = await pool.query(clientQuery, [client_id, companyId]);

  if (clientResult.rows.length === 0) {
    throw new Error("Client not found");
  }

  const client = clientResult.rows[0];
  const clientState = client.state;

  if (!invoice_type) {
    throw new Error("Invoice type is required");
  }

  if (!items || items.length === 0) {
    throw new Error("Invoice must contain at least one item");
  }

  const companyQuery = `
        SELECT
          invoice_prefix,
          state
        FROM company
        WHERE id=$1
      `;

  const companyResult = await pool.query(companyQuery, [companyId]);

  if (companyResult.rows.length === 0) {
    throw new Error("Company not found");
  }

  const company = companyResult.rows[0];
  const companyState = company.state;

  const productIds = items.map((item) => item.product_id);

  const productQuery = `
        SELECT
          id,
          product_name,
          hsn_code,
          unit,
          gst_percent
        FROM products
        WHERE company_id = $1
        AND id = ANY($2)
      `;
  const productResult = await pool.query(productQuery, [companyId, productIds]);

  if (productResult.rows.length !== productIds.length) {
    throw new Error("One or more products were not found");
  }

  const products = productResult.rows;

  const productMap = {};

  products.forEach((product) => {
    productMap[product.id] = product;
  });

  const invoiceItems = [];

  let subtotal = 0;
  let totalGST = 0;

  for (const item of items) {
    const product = productMap[item.product_id];
    const lineTotal = item.quantity * item.rate;
    const gstAmount = (lineTotal * product.gst_percent) / 100;
    subtotal += lineTotal;
    totalGST += gstAmount;
    invoiceItems.push({
      product_id: product.id,

      product_name: product.product_name,

      hsn_code: product.hsn_code,

      unit: product.unit,

      quantity: item.quantity,

      rate: item.rate,

      gst_percent: product.gst_percent,

      line_total: lineTotal,

      gst_amount: gstAmount,
    });
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (companyState === clientState) {
    cgstAmount = totalGST / 2;
    sgstAmount = totalGST / 2;
  } else {
    igstAmount = totalGST;
  }

  const grandTotal = subtotal + totalGST;

  const db = await pool.connect();

  try {
    await db.query("BEGIN");

    const companyCounterQuery = `SELECT invoice_prefix, next_invoice_number FROM company WHERE id = $1 FOR UPDATE`;

    const companyCounterResult = await db.query(companyCounterQuery, [
      companyId,
    ]);

    const companyData = companyCounterResult.rows[0];

    const currentYear = new Date().getFullYear();
    const invoiceNumber = `${companyData.invoice_prefix}-${currentYear}-${String(companyData.next_invoice_number).padStart(6, "0")}`;

    const updateCounterQuery = `UPDATE company
                                SET next_invoice_number = next_invoice_number + 1
                                WHERE id = $1
                                `;

    await db.query(updateCounterQuery, [companyId]);

    const invoiceInsertQuery = `
INSERT INTO invoices
(
company_id,
client_id,
invoice_type,
invoice_number,
status,
cgst_amount,
sgst_amount,
igst_amount,
subtotal,
grand_total,
invoice_date
)
VALUES
(
$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
)
RETURNING id;
`;

const invoiceInsertValues = [
    companyId,
    client_id,
    invoice_type,
    invoiceNumber,
    status,
    cgstAmount,
    sgstAmount,
    igstAmount,
    subtotal,
    grandTotal,
    invoice_date
];

const invoiceResult = await db.query(
    invoiceInsertQuery,
    invoiceInsertValues
);

const invoiceId = invoiceResult.rows[0].id;

    

    invoiceItems.forEach((item) => (item.invoice_id = invoiceId));

    const placeholders = [];
    const values = [];

    invoiceItems.forEach((item, index) => {
      const base = index * 10;

      placeholders.push(
        `($${base + 1},
              $${base + 2},
              $${base + 3},
              $${base + 4},
              $${base + 5},
              $${base + 6},
              $${base + 7},
              $${base + 8},
              $${base + 9},
              $${base + 10})`,
      );

      values.push(
        item.invoice_id,

        item.product_id,

        item.product_name,

        item.hsn_code,

        item.unit,

        item.quantity,

        item.rate,

        item.gst_percent,

        item.line_total,

        item.gst_amount,
      );
    });

    const invoiceItemQuery = `
      INSERT INTO invoice_items
      (
      invoice_id,
      product_id,
      product_name,
      hsn_code,
      unit,
      quantity,
      rate,
      gst_percent,
      line_total,
      gst_amount
      )

      VALUES

      ${placeholders.join(",")}

      RETURNING *;`;

    const invoiceItemResult = await db.query(invoiceItemQuery, values);

    await db.query("COMMIT");

    return {
      invoice_id: invoiceId,

      invoice_number: invoiceNumber,

      subtotal,

      cgstAmount,

      sgstAmount,

      igstAmount,

      grandTotal,

      items: invoiceItemResult.rows,
    };
  } catch (error) {
    await db.query("ROLLBACK");

    throw error;
  } finally {
    db.release();
  }
};



const getInvoice = async (companyId, invoiceId) => {
  const invoiceQuery = `
    SELECT
      -- Invoice
      i.id,
      i.invoice_number,
      i.invoice_type,
      i.status,
      i.invoice_date,
      i.subtotal,
      i.cgst_amount,
      i.sgst_amount,
      i.igst_amount,
      i.grand_total,

      -- Company
      c.id AS company_id,
      c.name AS company_name,
      c.owner AS company_owner,
      c.email AS company_email,
      c.phone AS company_phone,
      c.gstin AS company_gstin,
      c.pan AS company_pan,
      c.address AS company_address,
      c.state AS company_state,

      -- Client
      cl.id AS client_id,
      cl.name AS client_name,
      cl.email AS client_email,
      cl.phone AS client_phone,
      cl.gstin AS client_gstin,
      cl.pan AS client_pan,
      cl.address AS client_address,
      cl.state AS client_state,
      cl.client_business

    FROM invoices i

    JOIN company c
      ON i.company_id = c.id

    JOIN client cl
      ON i.client_id = cl.id

    WHERE
      i.id = $1
      AND i.company_id = $2;
  `;

  const invoiceResult = await pool.query(invoiceQuery, [
    invoiceId,
    companyId,
  ]);

  if (invoiceResult.rows.length === 0) {
    throw new Error("Invoice not found");
  }

  const invoice = invoiceResult.rows[0];

  const itemQuery = `
    SELECT
      id,
      product_id,
      product_name,
      hsn_code,
      unit,
      quantity,
      rate,
      gst_percent,
      gst_amount,
      line_total
    FROM invoice_items
    WHERE invoice_id = $1
    ORDER BY id;
  `;

  const itemResult = await pool.query(itemQuery, [invoiceId]);

  return {
    company: {
      id: invoice.company_id,
      owner: invoice.company_owner,
      name: invoice.company_name,
      email: invoice.company_email,
      phone: invoice.company_phone,
      gstin: invoice.company_gstin,
      pan: invoice.company_pan,
      address: invoice.company_address,
      state: invoice.company_state,
    },

    client: {
      id: invoice.client_id,
      name: invoice.client_name,
      email: invoice.client_email,
      phone: invoice.client_phone,
      gstin: invoice.client_gstin,
      pan: invoice.client_pan,
      address: invoice.client_address,
      state: invoice.client_state,
      client_business: invoice.client_business,
    },

    invoice: {
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      invoice_type: invoice.invoice_type,
      status: invoice.status,
      invoice_date: invoice.invoice_date,
      subtotal: invoice.subtotal,
      cgst_amount: invoice.cgst_amount,
      sgst_amount: invoice.sgst_amount,
      igst_amount: invoice.igst_amount,
      grand_total: invoice.grand_total,
    },

    items: itemResult.rows,
    total_items: itemResult.rows.length
  };
};



module.exports = {
  createInvoice,getInvoice
};
