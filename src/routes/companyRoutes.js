const express = require("express")
const { createCompany } = require("../controllers/companyController")

const router = express.Router()

//purpose of routes is just to guide the api call to its destination endpoint and request/response handler will be inside controller which will have the standard req and res arguments and that function will be imported here
router.post("/", createCompany)