const {
  createInvoice,
  createInvoiceItem,
  getInvoice
} = require("../services/invoiceService");


const createInvoiceController = async (req, res) => {
  try {
    const { company_id, buyer_id } = req.params;

    const invoice = await createInvoice(company_id, buyer_id, req.body);

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const createInvoiceItemController = async (req, res) => {
  try {
    const { invoice_id, product_id } = req.params;

    const invoiceItem = await createInvoiceItem(
      invoice_id,
      product_id,
      req.body,
    );

    res.status(201).json({
      success: true,
      message: "Invoice Item created successfully",
      data: invoiceItem,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


const getInvoiceController = async (req, res) => {
    try {

        const { invoice_id } = req.params;

        const invoice = await getInvoice(invoice_id);

        res.status(200).json({
            success: true,
            data: invoice
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

module.exports = {
  createInvoiceController,
  createInvoiceItemController,
  getInvoiceController
};
