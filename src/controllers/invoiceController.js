const {
  createInvoice,
  getInvoices,
  getInvoice,
  downloadInvoicePDF,
  updateInvoice,
} = require("../services/invoiceService");

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

const createInvoiceController = async (req, res) => {
  try {
    const invoice = await createInvoice(req.company.id, req.body);

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInvoicesController = async (req, res) => {
  try {
    const invoices = await getInvoices(req.company.id);

    res.status(200).json({
      success: true,
      message: "Invoices fetched successfully",
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInvoiceController = async (req, res) => {
  try {
    const companyId = req.company.id;
    const invoiceId = req.params.invoice_id;

    const invoice = await getInvoice(companyId, invoiceId);

    res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const downloadInvoicePDFController = async (req, res) => {
  try {
    const companyId = req.company.id;
    const invoiceId = req.params.invoice_id;

    const pdf = await downloadInvoicePDF(companyId, invoiceId);

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${pdf.invoiceNumber}.pdf"`
    );

    res.send(pdf.buffer);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateInvoiceController = async (req, res) => {
  try {
    const attempted = FORBIDDEN_INVOICE_PATCH_FIELDS.filter((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field),
    );
    if (attempted.length > 0) {
      return res.status(400).json({
        success: false,
        message: `These fields cannot be updated via PATCH: ${attempted.join(", ")}`,
      });
    }

    const invoice = await updateInvoice(
      req.params.invoiceId,
      req.company.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.log("updateInvoice-->", error);
    }
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
};

module.exports = {
  createInvoiceController,
  getInvoicesController,
  getInvoiceController,
  downloadInvoicePDFController,
  updateInvoiceController,
};

