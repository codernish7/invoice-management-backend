const {
  createClientBankDetails,
  updateClientBankDetails,
} = require("../services/clientBankService");

const validateBankBody = (body) => {
  const { bank_name, account_number, ifsc_code, branch } = body;
  const missing = [];
  if (!bank_name) missing.push("bank_name");
  if (!account_number) missing.push("account_number");
  if (!ifsc_code) missing.push("ifsc_code");
  if (!branch) missing.push("branch");
  return missing;
};

const statusForError = (message) => {
  if (message === "Client not found" || message === "Bank details not found") {
    return 404;
  }
  if (message === "Bank details already exist for this client") {
    return 409;
  }
  return 500;
};

const createClientBankController = async (req, res) => {
  try {
    const missing = validateBankBody(req.body);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `All four fields are required: bank_name, account_number, ifsc_code, branch. Missing: ${missing.join(", ")}`,
      });
    }

    const bankDetails = await createClientBankDetails(
      req.company.id,
      req.params.clientId,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Client bank details created successfully",
      data: bankDetails,
    });
  } catch (error) {
    const status = statusForError(error.message);
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
};

const updateClientBankController = async (req, res) => {
  try {
    const missing = validateBankBody(req.body);
    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `All four fields are required: bank_name, account_number, ifsc_code, branch. Missing: ${missing.join(", ")}`,
      });
    }

    const bankDetails = await updateClientBankDetails(
      req.company.id,
      req.params.clientId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Client bank details updated successfully",
      data: bankDetails,
    });
  } catch (error) {
    const status = statusForError(error.message);
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
};

module.exports = {
  createClientBankController,
  updateClientBankController,
};
