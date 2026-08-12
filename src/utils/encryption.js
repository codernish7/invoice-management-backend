const crypto = require("crypto");
require("dotenv").config();

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function parseKey(keyEnv) {
  if (!keyEnv || typeof keyEnv !== "string" || keyEnv.trim() === "") {
    throw new Error("BANK_ENCRYPTION_KEY is required");
  }

  const trimmed = keyEnv.trim();

  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Buffer.from(trimmed, "hex");
  }

  const key = Buffer.from(trimmed, "base64");
  if (key.length === KEY_LENGTH) {
    return key;
  }

  throw new Error(
    "BANK_ENCRYPTION_KEY must be a 32-byte value encoded as 64-character hex or base64"
  );
}

const key = parseKey(process.env.BANK_ENCRYPTION_KEY);

function encrypt(plaintext) {
  if (plaintext == null || plaintext === "") {
    return null;
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(String(plaintext), "utf8", "base64");
  ciphertext += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("base64")}:${authTag.toString("base64")}:${ciphertext}`;
}

function decrypt(payload) {
  if (payload == null || payload === "") {
    return null;
  }

  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format");
  }

  const [ivB64, authTagB64, ciphertext] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(ciphertext, "base64", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}

const smokeTest = encrypt("encryption-smoke-test");
if (decrypt(smokeTest) !== "encryption-smoke-test") {
  throw new Error("Encryption module smoke check failed");
}

module.exports = { encrypt, decrypt };
