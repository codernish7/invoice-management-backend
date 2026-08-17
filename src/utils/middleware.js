const { verifyCompanyToken } = require("./jwt");

const requireAuth = (req, res, next) => {
  try {
    const token = req?.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const payload = verifyCompanyToken(token);
    const companyId = payload.sub;

    if (!companyId || typeof companyId !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    req.company = { id: companyId };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = { requireAuth };
