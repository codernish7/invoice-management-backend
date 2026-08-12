const generateInvoiceHTML = (data) => {
  const { company, client, invoice, items, bank } = data;

  const formatMoney = (amount) => {
    return Number(amount || 0).toFixed(2);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN");
  };

  const invoiceType = String(invoice.invoice_type || "").toUpperCase();
  const isPurchase = invoiceType === "PURCHASE";

  // SALE: From = company, To = client; PURCHASE: From = client, To = company
  const fromParty = isPurchase ? client : company;
  const toParty = isPurchase ? company : client;
  const fromIsCompany = !isPurchase;
  const toIsCompany = isPurchase;

  const renderPartyBlock = (label, party, isCompany) => {
    if (isCompany) {
      return `
<div class="section-title">
${label}
</div>
<div class="bold">
${party.name || ""}
</div>
<div class="small">
${party.address || ""}
<br>
State : ${party.state || ""}
<br>
GSTIN : ${party.gstin || ""}
<br>
PAN : ${party.pan || ""}
<br>
Phone : ${party.phone || ""}
<br>
Email : ${party.email || ""}
</div>
`;
    }

    return `
<div class="section-title">
${label}
</div>
<div class="bold">
${party.client_business || ""}
</div>
<div class="small">
${party.name || ""}
<br>
${party.address || ""}
<br>
State : ${party.state || ""}
<br>
GSTIN : ${party.gstin || ""}
<br>
PAN : ${party.pan || ""}
<br>
Phone : ${party.phone || ""}
</div>
`;
  };

  const payeeBank = bank || {};
  const hasBankDetails = Boolean(
    payeeBank.bank_name ||
      payeeBank.account_number ||
      payeeBank.ifsc_code ||
      payeeBank.branch
  );
  // PURCHASE with no client bank row: omit bank section; SALE always shows placeholders
  const showBankSection = !isPurchase || hasBankDetails;

  const bankSectionHtml = showBankSection
    ? `
<div class="section-title">
Bank Details
</div>
<div class="small">
Bank Name : ${payeeBank.bank_name || "________________"}
<br>
Account No : ${payeeBank.account_number || "________________"}
<br>
IFSC : ${payeeBank.ifsc_code || "________________"}
<br>
Branch : ${payeeBank.branch || "________________"}
</div>
`
    : "";

  const itemRows = items
    .map(
      (item, index) => `
<tr>
    <td class="center">${index + 1}</td>
    <td>${item.product_name}</td>
    <td class="center">${item.hsn_code}</td>
    <td class="center">${item.gst_percent}%</td>
    <td class="center">${item.quantity}</td>
    <td class="center">${item.unit}</td>
    <td class="right">${formatMoney(item.rate)}</td>
    <td class="right">${formatMoney(item.line_total)}</td>
</tr>
`
    )
    .join("");

  return `

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Invoice</title>

<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
}

body{

font-family:Arial,Helvetica,sans-serif;

font-size:12px;

padding:20px;

color:#000;

}

.container{

width:100%;

border:2px solid black;

}

table{

width:100%;

border-collapse:collapse;

}

td,
th{

border:1px solid black;

padding:6px;

vertical-align:top;

}

.center{

text-align:center;

}

.right{

text-align:right;

}

.bold{

font-weight:bold;

}

.heading{

font-size:26px;

font-weight:bold;

text-align:center;

padding:12px;

border-bottom:2px solid black;

}

.section-title{

font-weight:bold;

margin-bottom:4px;

font-size:13px;

}

.small{

font-size:11px;

line-height:18px;

}

.items th{

background:#efefef;

}

.total-table td{

padding:8px;

}

.footer{

height:120px;

}

.signature{

margin-top:60px;

font-weight:bold;

text-align:center;

}

</style>

</head>

<body>

<div class="container">

<div class="heading">

TAX INVOICE

</div>

<table>

<tr>

<td width="40%">

${renderPartyBlock("From", fromParty, fromIsCompany)}

</td>

<td width="35%">

${renderPartyBlock("To", toParty, toIsCompany)}

</td>

<td width="25%">

<table>

<tr>

<td class="bold">

Invoice No

</td>

</tr>

<tr>

<td>

${invoice.invoice_number}

</td>

</tr>

<tr>

<td class="bold">

Invoice Date

</td>

</tr>

<tr>

<td>

${formatDate(invoice.invoice_date)}

</td>

</tr>

<tr>

<td class="bold">

Status

</td>

</tr>

<tr>

<td>

${invoice.status}

</td>

</tr>

<tr>

<td class="bold">

Type

</td>

</tr>

<tr>

<td>

${invoice.invoice_type}

</td>

</tr>

</table>

</td>

</tr>

</table>

<br>

<table class="items">

<tr>

<th width="6%">

Sr

</th>

<th>

Description

</th>

<th width="12%">

HSN

</th>

<th width="10%">

GST %

</th>

<th width="8%">

Qty

</th>

<th width="8%">

Unit

</th>

<th width="15%">

Rate

</th>

<th width="18%">

Amount

</th>

</tr>

${itemRows}

</table>

<br>

<table class="total-table">

<tr>

<td width="65%" rowspan="6">

<div class="section-title">

Amount In Words

</div>

<div class="small">

${invoice.amount_in_words || "Amount in words will be added later"}

</div>

<br><br>

<div class="section-title">

Declaration

</div>

<div class="small">

We declare that this invoice shows the actual price of the goods
described and that all particulars are true and correct.

</div>

</td>

<td class="bold">

Subtotal

</td>

<td class="right">

₹ ${formatMoney(invoice.subtotal)}

</td>

</tr>

<tr>

<td class="bold">

CGST

</td>

<td class="right">

₹ ${formatMoney(invoice.cgst_amount)}

</td>

</tr>

<tr>

<td class="bold">

SGST

</td>

<td class="right">

₹ ${formatMoney(invoice.sgst_amount)}

</td>

</tr>

<tr>

<td class="bold">

IGST

</td>

<td class="right">

₹ ${formatMoney(invoice.igst_amount)}

</td>

</tr>

<tr>

<td class="bold">

Grand Total

</td>

<td class="right bold">

₹ ${formatMoney(invoice.grand_total)}

</td>

</tr>

</table>

<br>

<table>

<tr>

<th colspan="6">

Tax Summary

</th>

</tr>

<tr>

<th>

HSN

</th>

<th>

GST %

</th>

<th>

Taxable Value

</th>

<th>

CGST %

</th>

<th>

CGST Amt

</th>

<th>

SGST %

</th>

<th>

SGST Amt

</th>

<th>

IGST %

</th>

<th>

IGST Amt

</th>

</tr>

${items
  .map((item) => {
    const taxable = Number(item.line_total);
    const gst = Number(item.gst_amount);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (Number(invoice.igst_amount) > 0) {
      igst = gst;
    } else {
      cgst = gst / 2;
      sgst = gst / 2;
    }

    return `

<tr>

<td class="center">
${item.hsn_code}
</td>

<td class="center">
${item.gst_percent}%
</td>

<td class="right">
₹ ${formatMoney(taxable)}
</td>

<td class="center">
${cgst > 0 ? Number(item.gst_percent) / 2 : "-"}
</td>

<td class="right">
${cgst > 0 ? "₹ " + formatMoney(cgst) : "-"}
</td>

<td class="center">
${sgst > 0 ? Number(item.gst_percent) / 2 : "-"}
</td>

<td class="right">
${sgst > 0 ? "₹ " + formatMoney(sgst) : "-"}
</td>

<td class="center">
${igst > 0 ? Number(item.gst_percent) : "-"}
</td>

<td class="right">
${igst > 0 ? "₹ " + formatMoney(igst) : "-"}
</td>

</tr>

`;
  })
  .join("")}

</table>

<br>

<table>

<tr>

<td width="60%">

${bankSectionHtml}

</td>

<td width="40%">

<div class="signature">

For ${company.name}

<br><br><br><br>

Authorized Signatory

</div>

</td>

</tr>

</table>

</div>

</body>

</html>

`;

};

module.exports = {
  generateInvoiceHTML,
};
