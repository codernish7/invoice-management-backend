const express = require("express");
const { requireAuth } = require("../utils/middleware");
const {
  createInvoiceController,
  getInvoicesController,
  getInvoiceController,
  downloadInvoicePDFController,
} = require("../controllers/invoiceController");

const router = express.Router();

router.post("/invoice", requireAuth, createInvoiceController);
router.get("/invoice/view", requireAuth, getInvoicesController);
router.get("/invoice/:invoice_id", requireAuth, getInvoiceController);
router.get("/invoice/:invoice_id/pdf", requireAuth, downloadInvoicePDFController);

module.exports = router;
