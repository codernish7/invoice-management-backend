const express = require("express");
const {
  createProductController,
  getProductController,
  getProductByIdController,
  updateProductController,
} = require("../controllers/productController");
const { requireAuth } = require("../utils/middleware");

const router = express.Router();

router.post("/product", requireAuth, createProductController);
router.get("/products/view", requireAuth, getProductController);
router.get("/product/:productId", requireAuth, getProductByIdController);
router.patch("/product/:productId", requireAuth, updateProductController);

module.exports = router;
