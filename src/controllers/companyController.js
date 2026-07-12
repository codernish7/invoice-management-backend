//this is the req/res handler which will take the request body and return a response

const { createCompany } = require("../services/companyService");

const createCompanyController = async (req, res) => {
  try {
    //pass the request body to the imported business logic function here which will return something as a response, so business logic function will take one (req body) or more arguments (req params or anything)
    const company = await createCompany(req.body);

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: "false", message: "Internal server error" });
  }
};

module.exports = { createCompanyController };
