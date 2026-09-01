const express = require("express");
const { requireAuth } = require("../utils/middleware");
const {
  createInvoiceController,
  getInvoicesController,
  getInvoiceController,
  downloadInvoicePDFController,
  updateInvoiceController,
} = require("../controllers/invoiceController");

const router = express.Router();

router.post("/invoice", requireAuth, createInvoiceController);
router.get("/invoice/view", requireAuth, getInvoicesController);
router.get("/invoice/:invoice_id", requireAuth, getInvoiceController);
router.get("/invoice/:invoice_id/pdf", requireAuth, downloadInvoicePDFController);
router.patch("/invoice/:invoiceId", requireAuth, updateInvoiceController);

module.exports = router;
