const express = require("express");
const {
  getCompanyController,
  updateCompanyController,
} = require("../controllers/companyController");
const { requireAuth } = require("../utils/middleware");

const router = express.Router();

router.get("/", requireAuth, getCompanyController);
router.patch("/", requireAuth, updateCompanyController);

module.exports = router;
