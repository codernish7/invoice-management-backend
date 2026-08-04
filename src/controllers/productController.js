const { createProduct, getProducts } = require("../services/productService");

const createProductController = async (req, res) => {
  try {
    const product = await createProduct(req.company.id, req.body);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getProductController = async (req, res) => {
  try {
    const viewProducts = await getProducts(req.company.id, req.query.minimal === "true");
    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      data: viewProducts,
    });
  } catch (error) {
    console.log('products-->',error)
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { createProductController, getProductController };
