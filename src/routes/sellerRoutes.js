const express = require("express");
const { createSellerController } = require("../controllers/sellerController");

const router = express.Router();

router.post("/:company_id/seller", createSellerController);

module.exports = router;
