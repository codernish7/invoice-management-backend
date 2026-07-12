const { createBuyer } = require("../services/buyerService");

const createBuyerController = async (req, res) => {
  try {
    const buyer = await createBuyer(req.params.company_id, req.body);
    res.status(201).json({
      success: true,
      message: "Buyer created successfully",
      data: buyer,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: "false", message: "Internal server error" });
  }
};

module.exports = { createBuyerController };
