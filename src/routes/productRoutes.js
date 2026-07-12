const express = require("express");
const { createProductController } = require("../controllers/productController");

const router = express.Router();

router.post("/:company_id/product", createProductController);

module.exports = router;
