const express = require("express");
const {
  createClientController,
  getClientController,
} = require("../controllers/clientController");
const {
  createClientBankController,
  updateClientBankController,
} = require("../controllers/clientBankController");
const { fakeAuth } = require("../utils/middleware");

const router = express.Router();

router.post("/client", fakeAuth, createClientController);
router.get("/client/view", fakeAuth, getClientController);
router.post(
  "/client/:clientId/bank-details",
  fakeAuth,
  createClientBankController
);
router.put(
  "/client/:clientId/bank-details",
  fakeAuth,
  updateClientBankController
);

module.exports = router;
