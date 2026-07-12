const { createSeller } = require("../services/sellerService");

const createSellerController = async (req, res) => {
  try {
    const seller = await createSeller(
      req.params.company_id,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Seller created successfully",
      data: seller,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createSellerController,
};
