const { createProduct } = require("../services/productService");

const createProductController=async(req, res)=>{
try {
    const product = await createProduct(
      req.params.company_id,
      req.body,
    );

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
}

module.exports= {createProductController}