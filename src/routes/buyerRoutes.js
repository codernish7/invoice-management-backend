const express = require("express");
const { createBuyerController } = require("../controllers/buyerController");



const router = express.Router();

router.post("/:company_id/buyer",createBuyerController);

module.exports = router;