const express = require("express");
const {
  createClientController,
  getClientController,
} = require("../controllers/clientController");
const {
  createClientBankController,
  updateClientBankController,
} = require("../controllers/clientBankController");
const { requireAuth } = require("../utils/middleware");

const router = express.Router();

router.post("/client", requireAuth, createClientController);
router.get("/client/view", requireAuth, getClientController);
router.post(
  "/client/:clientId/bank-details",
  requireAuth,
  createClientBankController
);
router.put(
  "/client/:clientId/bank-details",
  requireAuth,
  updateClientBankController
);

module.exports = router;
