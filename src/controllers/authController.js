const { createCompany, authenticateCompany } = require("../services/companyService");
const { signCompanyToken, COOKIE_MAX_AGE_MS } = require("../utils/jwt");

const signupController = async (req, res) => {
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

    const token = signCompanyToken(company.id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: !req.headers.host.includes("localhost"),
      maxAge: COOKIE_MAX_AGE_MS,
    });

    res.status(201).json({
      success: true,
      message: "Company created successfully",
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

const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = await authenticateCompany(email, password);
    const token = signCompanyToken(company.id);

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: !req.headers.host.includes("localhost"),
      maxAge: COOKIE_MAX_AGE_MS,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: { company },
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

module.exports = { signupController, loginController };
