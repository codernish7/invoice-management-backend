const express = require("express");
const { fakeAuth } = require("../utils/middleware");
const { createInvoiceController, getInvoiceController } = require("../controllers/invoiceController");
const router = express.Router();

router.post("/invoice", fakeAuth, createInvoiceController);
router.get("/invoice/:id", fakeAuth, getInvoiceController);

module.exports = router;
