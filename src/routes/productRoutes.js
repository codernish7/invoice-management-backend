const express = require("express");
const {
  createProductController,
  getProductController,
} = require("../controllers/productController");
const { requireAuth } = require("../utils/middleware");

const router = express.Router();

router.post("/product", requireAuth, createProductController);
router.get("/product/view", requireAuth, getProductController);

module.exports = router;
