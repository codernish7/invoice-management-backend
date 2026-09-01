const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
} = require("../services/productService");

const FORBIDDEN_PATCH_FIELDS = ["id", "company_id", "created_at", "updated_at"];

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

const getProductByIdController = async (req, res) => {
  try {
    const product = await getProductById(req.params.productId, req.company.id);
    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      data: product,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.log("productById-->", error);
    }
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
};

const updateProductController = async (req, res) => {
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

    const product = await updateProduct(
      req.params.productId,
      req.company.id,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    if (status >= 500) {
      console.log("updateProduct-->", error);
    }
    res.status(status).json({
      success: false,
      message: status === 500 ? "Internal server error" : error.message,
    });
  }
};

module.exports = {
  createProductController,
  getProductController,
  getProductByIdController,
  updateProductController,
};
