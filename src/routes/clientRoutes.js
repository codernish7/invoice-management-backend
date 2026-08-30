const express = require("express");
const {
  createClientController,
  getClientsController,
  updateClientController,
  getClientByIdController,
} = require("../controllers/clientController");
const {
  createClientBankController,
  updateClientBankController,
} = require("../controllers/clientBankController");
const { requireAuth } = require("../utils/middleware");

const router = express.Router();

router.post("/client", requireAuth, createClientController);
router.get("/clients/view", requireAuth, getClientsController);
router.get("/client/:clientId", requireAuth, getClientByIdController);
router.patch("/client/:clientId/edit", requireAuth, updateClientController);
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
