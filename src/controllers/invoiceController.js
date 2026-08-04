const {createInvoice, getInvoice} = require("../services/invoiceService");

const createInvoiceController = async (req, res) => {
  try {
    const invoice = await createInvoice(req.company.id, req.body);

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getInvoiceController = async (req, res) => {
  try {
    const companyId = req.company.id;
    const invoiceId = req.params.id;

    const invoice = await getInvoice(companyId, invoiceId);

    res.status(200).json({
      success: true,
      message: "Invoice fetched successfully",
      data: invoice,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



module.exports = {
  createInvoiceController,getInvoiceController
};

