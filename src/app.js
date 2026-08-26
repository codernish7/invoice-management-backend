const express = require("express");
const cookieParser = require("cookie-parser");
const companyRoutes = require("./routes/companyRoutes");
const clientRoutes = require("./routes/clientRoutes");
const productRoutes = require("./routes/productRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));
app.use(authRoutes);
app.use("/company", companyRoutes);
app.use("/company", clientRoutes);
app.use("/company", productRoutes);
app.use("/company", invoiceRoutes);

module.exports = app;
