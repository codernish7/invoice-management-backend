const express = require("express");
const cookieParser = require("cookie-parser");
const companyRoutes = require("./routes/companyRoutes");
const clientRoutes = require("./routes/clientRoutes");
const sellerRoutes = require("./routes/sellerRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(authRoutes);
app.use("/company", companyRoutes);
app.use("/company", clientRoutes);
app.use("/company", sellerRoutes);
app.use("/company", productRoutes);
app.use("/company", invoiceRoutes);

module.exports = app;
