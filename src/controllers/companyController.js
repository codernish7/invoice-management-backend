//this is the req/res handler which will take the request body and return a response

const { createCompany } = require("../services/companyService");

const createCompanyController = async (req, res) => {
  try {
    const { bank_name, account_number, ifsc_code, branch } = req.body;
    const hasAnyBankField =
      bank_name != null ||
      account_number != null ||
      ifsc_code != null ||
      branch != null;

    if (hasAnyBankField) {
      const missing = [];
      if (!bank_name) missing.push("bank_name");
      if (!account_number) missing.push("account_number");
      if (!ifsc_code) missing.push("ifsc_code");
      if (!branch) missing.push("branch");

      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `When providing bank details, all four fields are required: bank_name, account_number, ifsc_code, branch. Missing: ${missing.join(", ")}`,
        });
      }
    }

    const company = await createCompany(req.body);

    res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: company,
    });
  } catch (error) {
    console.log("error--->", error);
    res
      .status(500)
      .json({ success: "false", message: "Internal server error" });
  }
};

module.exports = { createCompanyController };
