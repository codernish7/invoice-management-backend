const {
  getCompanyById,
  updateCompany,
} = require("../services/companyService");

const FORBIDDEN_PATCH_FIELDS = [
  "id",
  "email",
  "password",
  "password_hash",
  "next_invoice_number",
  "created_at",
];

const getCompanyController = async (req, res) => {
  try {
    const company = await getCompanyById(req.company.id);
    res.status(200).json({
      success: true,
      message: "Company fetched successfully",
      data: company,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.log("error--->", error);
    }
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
};

const updateCompanyController = async (req, res) => {
  try {
    const attempted = FORBIDDEN_PATCH_FIELDS.filter((field) =>
      Object.prototype.hasOwnProperty.call(req.body, field),
    );
    if (attempted.length > 0) {
      return res.status(400).json({
        success: false,
        message: `These fields cannot be updated via PATCH: ${attempted.join(", ")}`,
      });
    }

    const { bank_name, account_number, ifsc_code, branch } = req.body;
    const hasAnyBankField =
      bank_name !== undefined ||
      account_number !== undefined ||
      ifsc_code !== undefined ||
      branch !== undefined;

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

    const company = await updateCompany(req.company.id, req.body);

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: company,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.log("error--->", error);
    }
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
};

module.exports = { getCompanyController, updateCompanyController };
