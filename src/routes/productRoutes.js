const express = require("express");
const { createProductController, getProductController } = require("../controllers/productController");
const { fakeAuth } = require("../utils/middleware");

const router = express.Router();

router.post("/product", fakeAuth, createProductController);
router.get("/product/view", fakeAuth, getProductController);

module.exports = router;
