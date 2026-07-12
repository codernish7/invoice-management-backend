const express = require("express");
const {
  createInvoiceController,
  createInvoiceItemController,
  getInvoiceController,
} = require("../controllers/invoiceController");
const {
  generateInvoicePdfController,
} = require("../controllers/generateInvoicePdfController");

const router = express.Router();

router.post("/:company_id/:buyer_id/invoice", createInvoiceController);

router.post(
  "/:invoice_id/:product_id/invoiceItem",
  createInvoiceItemController,
);

router.get("/:invoice_id", getInvoiceController);

router.get("/:invoice_id/pdf", generateInvoicePdfController);

module.exports = router;
