const express = require("express");
const { fakeAuth } = require("../utils/middleware");
const {
  createInvoiceController,
  getInvoicesController,
  getInvoiceController,
  downloadInvoicePDFController,
} = require("../controllers/invoiceController");
const router = express.Router();

router.post("/invoice", fakeAuth, createInvoiceController);
router.get("/invoice/view", fakeAuth, getInvoicesController);
router.get("/invoice/:id", fakeAuth, getInvoiceController);
router.get("/invoice/:id/pdf", fakeAuth, downloadInvoicePDFController);

module.exports = router;
