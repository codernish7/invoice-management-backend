const pool = require("../config/db");
const puppeteer = require("puppeteer");

const { generateInvoiceHTML } = require("../templates/invoiceTemplate");
const { decrypt } = require("../utils/encryption");

let browserPromise = null;

const getPdfBrowser = async () => {
  if (!browserPromise) {
    browserPromise = puppeteer
      .launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
        ],
      })
      .then((browser) => {
        browser.on("disconnected", () => {
          browserPromise = null;
        });
        return browser;
      })
      .catch((error) => {
        browserPromise = null;
        throw error;
      });
  }

  return browserPromise;
};

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

  const normalizedInvoiceType = String(invoice_type).trim().toUpperCase();

  const normalizedInvoiceStatus = String(status).trim().toUpperCase();

  if (normalizedInvoiceStatus !== "COMPLETE" && normalizedInvoiceStatus !== "DRAFT" && normalizedInvoiceStatus !== "CANCELLED") {
    throw new Error("Invoice status must be COMPLETE, DRAFT or CANCELLED");
  }

  if (normalizedInvoiceType !== "SALE" && normalizedInvoiceType !== "PURCHASE") {
    throw new Error("Invoice type must be SALE or PURCHASE");
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

  // UUID strings for pg ANY($2::uuid[]) — never parseInt / Number on IDs
  const productIds = [
    ...new Set(
      items
        .map((item) => item.product_id)
        .filter((id) => id !== undefined && id !== null && id !== "")
        .map((id) => String(id)),
    ),
  ];

  const productMap = {};

  if (productIds.length > 0) {
    const productQuery = `
        SELECT
          id,
          product_name,
          hsn_code,
          unit,
          gst_percent
        FROM products
        WHERE company_id = $1
        AND id = ANY($2::uuid[])
      `;
    const productResult = await pool.query(productQuery, [
      companyId,
      productIds,
    ]);

    if (productResult.rows.length !== productIds.length) {
      throw new Error("One or more products were not found");
    }

    productResult.rows.forEach((product) => {
      productMap[String(product.id)] = product;
    });
  }

  const invoiceItems = [];

  let subtotal = 0;
  let totalGST = 0;

  for (const item of items) {
    const hasProductId =
      item.product_id !== undefined &&
      item.product_id !== null &&
      item.product_id !== "";

    let productId = null;
    let productName;
    let hsnCode = null;
    let unit = null;
    let gstPercent;

    if (normalizedInvoiceType === "SALE") {
      if (!hasProductId) {
        throw new Error("Each SALE item must include product_id");
      }

      const product = productMap[String(item.product_id)];

      if (!product) {
        throw new Error("One or more products were not found");
      }

      productId = product.id;
      productName = product.product_name;
      hsnCode = product.hsn_code;
      unit = product.unit;
      gstPercent = product.gst_percent;
    } else if (hasProductId) {
      const product = productMap[String(item.product_id)];

      if (!product) {
        throw new Error("One or more products were not found");
      }

      productId = product.id;
      productName = product.product_name;
      hsnCode = product.hsn_code;
      unit = product.unit;
      gstPercent = product.gst_percent;
    } else {
      if (!item.product_name) {
        throw new Error(
          "PURCHASE items without product_id require product_name",
        );
      }

      if (item.gst_percent === undefined || item.gst_percent === null) {
        throw new Error(
          "PURCHASE items without product_id require gst_percent",
        );
      }

      productName = item.product_name;
      hsnCode = item.hsn_code ?? null;
      unit = item.unit ?? null;
      gstPercent = item.gst_percent;
    }

    const lineTotal = item.quantity * item.rate;
    const gstAmount = (lineTotal * gstPercent) / 100;
    subtotal += lineTotal;
    totalGST += gstAmount;
    invoiceItems.push({
      product_id: productId,

      product_name: productName,

      hsn_code: hsnCode,

      unit: unit,

      quantity: item.quantity,

      rate: item.rate,

      gst_percent: gstPercent,

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
    normalizedInvoiceType,
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



const getInvoices = async (companyId) => {
  const query = `
    SELECT
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
      i.client_id,
      cl.name AS client_name,
      cl.client_business
    FROM invoices i
    JOIN client cl
      ON i.client_id = cl.id
    WHERE i.company_id = $1
    ORDER BY i.invoice_date DESC, i.created_at DESC;
  `;

  const result = await pool.query(query, [companyId]);
  return result.rows;
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
      c.bank_name AS company_bank_name,
      c.account_number AS company_account_number,
      c.ifsc_code AS company_ifsc_code,
      c.branch AS company_branch,

      -- Client
      cl.id AS client_id,
      cl.name AS client_name,
      cl.email AS client_email,
      cl.phone AS client_phone,
      cl.gstin AS client_gstin,
      cl.pan AS client_pan,
      cl.address AS client_address,
      cl.state AS client_state,
      cl.client_business,

      -- Client bank (encrypted account/ifsc remain as stored)
      cbd.bank_name AS client_bank_name,
      cbd.account_number AS client_account_number,
      cbd.ifsc_code AS client_ifsc_code,
      cbd.branch AS client_branch

    FROM invoices i

    JOIN company c
      ON i.company_id = c.id

    JOIN client cl
      ON i.client_id = cl.id

    LEFT JOIN client_bank_details cbd
      ON cbd.client_id = cl.id

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
    ORDER BY created_at ASC;
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
      bank_name: invoice.company_bank_name,
      account_number: invoice.company_account_number,
      ifsc_code: invoice.company_ifsc_code,
      branch: invoice.company_branch,
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
      bank_name: invoice.client_bank_name,
      account_number: invoice.client_account_number,
      ifsc_code: invoice.client_ifsc_code,
      branch: invoice.client_branch,
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

const downloadInvoicePDF = async (companyId, invoiceId) => {
  const invoice = await getInvoice(companyId, invoiceId);

  // Payee bank: SALE → company; PURCHASE → client. Decrypt only for PDF.
  const invoiceType = String(invoice.invoice.invoice_type || "").toUpperCase();
  const payee = invoiceType === "PURCHASE" ? invoice.client : invoice.company;

  const bank = {
    bank_name: payee.bank_name ?? null,
    account_number: decrypt(payee.account_number),
    ifsc_code: decrypt(payee.ifsc_code),
    branch: payee.branch ?? null,
  };

  const pdfPayload = {
    ...invoice,
    bank,
  };

  const html = generateInvoiceHTML(pdfPayload);

  const browser = await getPdfBrowser();
  const page = await browser.newPage();

  try {
    page.setDefaultNavigationTimeout(60_000);

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const buffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    return {
      invoiceNumber: invoice.invoice.invoice_number,
      buffer,
    };
  } finally {
    await page.close();
  }
};

const FORBIDDEN_INVOICE_PATCH_FIELDS = [
  "id",
  "invoice_id",
  "company_id",
  "invoice_number",
  "created_at",
  "updated_at",
  "subtotal",
  "cgst_amount",
  "sgst_amount",
  "igst_amount",
  "grand_total",
  "cgstAmount",
  "sgstAmount",
  "igstAmount",
  "grandTotal",
];

const FORBIDDEN_INVOICE_ITEM_PATCH_FIELDS = [
  "product_name",
  "hsn_code",
  "unit",
  "gst_percent",
  "gst_amount",
  "line_total",
  "id",
  "invoice_id",
];

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const updateInvoice = async (invoiceId, companyId, invoiceData) => {
  if (!invoiceId) {
    throw httpError("Invoice id is required", 400);
  }

  const attemptedForbidden = FORBIDDEN_INVOICE_PATCH_FIELDS.filter((field) =>
    Object.prototype.hasOwnProperty.call(invoiceData, field),
  );
  if (attemptedForbidden.length > 0) {
    throw httpError(
      `These fields cannot be updated via PATCH: ${attemptedForbidden.join(", ")}`,
      400,
    );
  }

  const { client_id, invoice_type, status, invoice_date, items } = invoiceData;

  if (!Object.prototype.hasOwnProperty.call(invoiceData, "client_id") || !client_id) {
    throw httpError("client_id is required", 400);
  }
  if (!Object.prototype.hasOwnProperty.call(invoiceData, "invoice_type") || invoice_type == null || String(invoice_type).trim() === "") {
    throw httpError("invoice_type is required", 400);
  }
  if (!Object.prototype.hasOwnProperty.call(invoiceData, "invoice_date") || invoice_date == null || String(invoice_date).trim() === "") {
    throw httpError("invoice_date is required", 400);
  }
  if (!Object.prototype.hasOwnProperty.call(invoiceData, "status") || status == null || String(status).trim() === "") {
    throw httpError("status is required", 400);
  }
  if (!Object.prototype.hasOwnProperty.call(invoiceData, "items") || !Array.isArray(items) || items.length === 0) {
    throw httpError("Invoice must contain at least one item", 400);
  }

  const normalizedInvoiceType = String(invoice_type).trim().toUpperCase();
  if (normalizedInvoiceType !== "SALE") {
    throw httpError("Invoice type must be SALE for this edit endpoint", 400);
  }

  const normalizedStatus = String(status).trim().toUpperCase();
  if (normalizedStatus === "CANCELLED") {
    throw httpError("Cannot set status to CANCELLED via this edit endpoint", 400);
  }
  if (normalizedStatus !== "DRAFT" && normalizedStatus !== "COMPLETE") {
    throw httpError("Invoice status must be DRAFT or COMPLETE", 400);
  }

  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    if (!item || typeof item !== "object") {
      throw httpError(`Item at index ${i} is invalid`, 400);
    }

    const forbiddenOnItem = FORBIDDEN_INVOICE_ITEM_PATCH_FIELDS.filter((field) =>
      Object.prototype.hasOwnProperty.call(item, field),
    );
    if (forbiddenOnItem.length > 0) {
      throw httpError(
        `Item fields cannot be supplied via PATCH: ${forbiddenOnItem.join(", ")}`,
        400,
      );
    }

    if (item.product_id === undefined || item.product_id === null || item.product_id === "") {
      throw httpError("Each SALE item must include product_id", 400);
    }
    if (item.quantity === undefined || item.quantity === null || item.quantity === "") {
      throw httpError("Each item must include quantity", 400);
    }
    if (item.rate === undefined || item.rate === null || item.rate === "") {
      throw httpError("Each item must include rate", 400);
    }

    const quantity = Number(item.quantity);
    const rate = Number(item.rate);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw httpError("quantity must be a valid positive number", 400);
    }
    if (!Number.isFinite(rate) || rate < 0) {
      throw httpError("rate must be a valid non-negative number", 400);
    }
  }

  const clientResult = await pool.query(
    `
      SELECT id, state
      FROM client
      WHERE id = $1 AND company_id = $2
    `,
    [client_id, companyId],
  );

  if (clientResult.rows.length === 0) {
    throw httpError("Client not found", 404);
  }

  const client = clientResult.rows[0];
  const clientState = client.state;

  const companyResult = await pool.query(
    `
      SELECT id, state
      FROM company
      WHERE id = $1
    `,
    [companyId],
  );

  if (companyResult.rows.length === 0) {
    throw httpError("Company not found", 404);
  }

  const companyState = companyResult.rows[0].state;

  const productIds = [
    ...new Set(items.map((item) => String(item.product_id))),
  ];

  const productResult = await pool.query(
    `
      SELECT id, product_name, hsn_code, unit, gst_percent
      FROM products
      WHERE company_id = $1
        AND id = ANY($2::uuid[])
    `,
    [companyId, productIds],
  );

  if (productResult.rows.length !== productIds.length) {
    throw httpError("One or more products were not found", 404);
  }

  const productMap = {};
  productResult.rows.forEach((product) => {
    productMap[String(product.id)] = product;
  });

  const invoiceItems = [];
  let subtotal = 0;
  let totalGST = 0;

  for (const item of items) {
    const product = productMap[String(item.product_id)];
    if (!product) {
      throw httpError("One or more products were not found", 404);
    }

    const quantity = Number(item.quantity);
    const rate = Number(item.rate);
    const gstPercent = Number(product.gst_percent);
    const lineTotal = quantity * rate;
    const gstAmount = (lineTotal * gstPercent) / 100;

    subtotal += lineTotal;
    totalGST += gstAmount;

    invoiceItems.push({
      product_id: product.id,
      product_name: product.product_name,
      hsn_code: product.hsn_code,
      unit: product.unit,
      quantity,
      rate,
      gst_percent: gstPercent,
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

    const existingResult = await db.query(
      `
        SELECT id, invoice_number, status
        FROM invoices
        WHERE id = $1 AND company_id = $2
        FOR UPDATE
      `,
      [invoiceId, companyId],
    );

    if (existingResult.rows.length === 0) {
      throw httpError("Invoice not found", 404);
    }

    const existing = existingResult.rows[0];
    const existingStatus = String(existing.status || "").trim().toUpperCase();

    if (existingStatus === "COMPLETE") {
      throw httpError("Completed invoices cannot be edited", 409);
    }
    if (existingStatus === "CANCELLED") {
      throw httpError("Cancelled invoices cannot be edited", 409);
    }
    if (existingStatus !== "DRAFT") {
      throw httpError("Only DRAFT invoices can be edited", 409);
    }

    const updateHeaderResult = await db.query(
      `
        UPDATE invoices
        SET
          client_id = $1,
          invoice_type = $2,
          invoice_date = $3,
          status = $4,
          cgst_amount = $5,
          sgst_amount = $6,
          igst_amount = $7,
          subtotal = $8,
          grand_total = $9,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $10 AND company_id = $11
        RETURNING id, invoice_number, invoice_type, status, invoice_date,
                  subtotal, cgst_amount, sgst_amount, igst_amount, grand_total
      `,
      [
        client_id,
        normalizedInvoiceType,
        invoice_date,
        normalizedStatus,
        cgstAmount,
        sgstAmount,
        igstAmount,
        subtotal,
        grandTotal,
        invoiceId,
        companyId,
      ],
    );

    if (updateHeaderResult.rows.length === 0) {
      throw httpError("Invoice not found", 404);
    }

    const updatedInvoice = updateHeaderResult.rows[0];

    await db.query(`DELETE FROM invoice_items WHERE invoice_id = $1`, [
      invoiceId,
    ]);

    const placeholders = [];
    const values = [];

    invoiceItems.forEach((item, index) => {
      const base = index * 10;
      placeholders.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10})`,
      );
      values.push(
        invoiceId,
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

    const invoiceItemResult = await db.query(
      `
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
        RETURNING *;
      `,
      values,
    );

    await db.query("COMMIT");

    return {
      invoice_id: updatedInvoice.id,
      invoice_number: updatedInvoice.invoice_number,
      invoice_type: updatedInvoice.invoice_type,
      status: updatedInvoice.status,
      invoice_date: updatedInvoice.invoice_date,
      subtotal: updatedInvoice.subtotal,
      cgstAmount: Number(updatedInvoice.cgst_amount),
      sgstAmount: Number(updatedInvoice.sgst_amount),
      igstAmount: Number(updatedInvoice.igst_amount),
      grandTotal: Number(updatedInvoice.grand_total),
      items: invoiceItemResult.rows,
    };
  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  downloadInvoicePDF,
  updateInvoice,
};
