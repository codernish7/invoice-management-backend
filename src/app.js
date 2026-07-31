const express = require("express");
const companyRoutes = require("./routes/companyRoutes");
const clientRoutes = require("./routes/clientRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

app.use(express.json());

app.use("/company", companyRoutes);
app.use("/company", clientRoutes);
app.use("/company", sellerRoutes);
app.use("/company", productRoutes);
app.use("/company", invoiceRoutes);
app.use("/invoice", invoiceRoutes);

module.exports = app;
