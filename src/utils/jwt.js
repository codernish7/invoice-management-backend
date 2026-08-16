const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || String(secret).trim() === "") {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
};

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || "7d";

/** Cookie maxAge in ms — matches default JWT expiry of 7 days. */
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const signCompanyToken = (companyId) => {
  return jwt.sign(
    { sub: String(companyId) },
    getJwtSecret(),
    { expiresIn: getJwtExpiresIn() },
  );
};

module.exports = {
  signCompanyToken,
  getJwtSecret,
  getJwtExpiresIn,
  COOKIE_MAX_AGE_MS,
};
