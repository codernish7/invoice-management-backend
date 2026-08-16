const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

const hashPassword = async (plaintext) => {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error("Password must be a valid text string");
  }
  return bcrypt.hash(String(plaintext), SALT_ROUNDS);
};

const comparePassword = async (plaintext, passwordHash) => {
  if (!plaintext || typeof plaintext !== 'string') {
    return false;
  }
  return bcrypt.compare(String(plaintext), passwordHash);
};

module.exports = { hashPassword, comparePassword };
