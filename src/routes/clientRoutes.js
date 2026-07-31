const express = require("express");
const {
  createClientController,
  getClientController,
} = require("../controllers/clientController");
const { fakeAuth } = require("../utils/middleware");

const router = express.Router();

router.post("/client", fakeAuth, createClientController);
router.get("/client/view", fakeAuth, getClientController);

module.exports = router;
