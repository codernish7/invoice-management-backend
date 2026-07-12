const puppeteer = require("puppeteer");
const { getInvoice } = require("../services/invoiceService");
const { generateInvoiceHTML } = require("../templates/invoiceTemplate");

const generateInvoicePdfController = async (req, res) => {
  let browser;

  try {
    const { invoice_id } = req.params;

    const invoice = await getInvoice(invoice_id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const html = generateInvoiceHTML(invoice);

    browser = await puppeteer.launch({
      headless: true,
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${invoice.invoice.invoice_number}.pdf`,
    );

    return res.send(pdfBuffer);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  generateInvoicePdfController,
};
