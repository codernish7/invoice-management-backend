const generateInvoiceHTML = (data) => {
  const { invoice, company, buyer, items } = data;

  const itemRows = items
    .map(
      (item) => `
        <tr>
            <td>${item.product_name}</td>
            <td style="text-align:center;">${item.quantity}</td>
            <td style="text-align:right;">₹ ${item.rate}</td>
            <td style="text-align:right;">₹ ${item.line_total}</td>
        </tr>
    `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>

<head>

<meta charset="UTF-8"/>

<style>

body{
    font-family: Arial, Helvetica, sans-serif;
    padding:40px;
    color:#333;
}

.container{
    width:100%;
}

.header{
    text-align:center;
    margin-bottom:30px;
}

.header h1{
    margin:0;
}

.company-details{
    margin-top:15px;
    line-height:1.8;
}

.invoice-info{
    margin:30px 0;
}

.info-table{
    width:100%;
    border-collapse:collapse;
}

.info-table td{
    vertical-align:top;
    padding:8px;
}

.box{
    border:1px solid #ccc;
    padding:12px;
}

.section-title{
    font-weight:bold;
    margin-bottom:10px;
    font-size:15px;
}

.product-table{
    width:100%;
    border-collapse:collapse;
    margin-top:25px;
}

.product-table th{
    border:1px solid #ddd;
    background:#f5f5f5;
    padding:10px;
}

.product-table td{
    border:1px solid #ddd;
    padding:10px;
}

.total-table{
    width:40%;
    margin-left:auto;
    margin-top:20px;
    border-collapse:collapse;
}

.total-table td{
    padding:10px;
    border:1px solid #ddd;
}

.footer{
    margin-top:50px;
    text-align:center;
    color:#777;
    font-size:14px;
}

</style>

</head>

<body>

<div class="container">

<div class="header">

<h1>${company.name}</h1>

<div class="company-details">

<div><strong>Owner :</strong> ${company.owner}</div>

<div><strong>GSTIN :</strong> ${company.gstin}</div>

<div><strong>Phone :</strong> ${company.phone}</div>

<div><strong>Email :</strong> ${company.email}</div>

<div><strong>Address :</strong> ${company.address}</div>

</div>

</div>

<hr/>

<div class="invoice-info">

<table class="info-table">

<tr>

<td>

<strong>Invoice Number</strong><br/>
${invoice.invoice_number}

</td>

<td>

<strong>Invoice Date</strong><br/>
${invoice.invoice_date}

</td>

<td>

<strong>Invoice Type</strong><br/>
${invoice.invoice_type}

</td>

</tr>

</table>

</div>

<table class="info-table">

<tr>

<td width="50%">

<div class="box">

<div class="section-title">

Bill To

</div>

<div><strong>${buyer.business_name}</strong></div>

<div>${buyer.buyer_name}</div>

<div>${buyer.address}</div>

<div>${buyer.phone}</div>

<div>${buyer.email}</div>

<div>GSTIN : ${buyer.gstin}</div>

</div>

</td>

<td width="50%">

<div class="box">

<div class="section-title">

Delivery Address

</div>

<div><strong>${buyer.business_name}</strong></div>

<div>${buyer.address}</div>

</div>

</td>

</tr>

</table>

<table class="product-table">

<thead>

<tr>

<th align="left">Product</th>

<th>Qty</th>

<th align="right">Rate</th>

<th align="right">Amount</th>

</tr>

</thead>

<tbody>

${itemRows}

</tbody>

</table>

<table class="total-table">

<tr>

<td><strong>Subtotal</strong></td>

<td style="text-align:right;">₹ ${invoice.subtotal}</td>

</tr>

<tr>

<td><strong>Grand Total</strong></td>

<td style="text-align:right;"><strong>₹ ${invoice.grand_total}</strong></td>

</tr>

</table>

<div class="footer">

Thank you for your business!

</div>

</div>

</body>

</html>
`;
};

module.exports = {
  generateInvoiceHTML,
};