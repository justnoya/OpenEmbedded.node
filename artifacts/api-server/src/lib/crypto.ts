// @ts-nocheck
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env["BOT_ENCRYPTION_KEY"];
  if (raw) {
    if (raw.length === 64) return Buffer.from(raw, "hex");
    return Buffer.from(raw.slice(0, 32).padEnd(32, "0"), "utf8");
  }
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "BOT_ENCRYPTION_KEY must be set in production. " +
      "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  const fallback = (process.env["SESSION_SECRET"] ?? "dev-key-do-not-use-in-production-at-all")
    .padEnd(32, "0")
    .slice(0, 32);
  return Buffer.from(fallback, "utf8");
}

/**
 * Encrypt a bot token with AES-256-GCM.
 * Returns: `iv_hex:authTag_hex:ciphertext_hex`
 */
export function encryptToken(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a token previously encrypted by encryptToken().
 */
export function decryptToken(ciphertext: string): string {
  const parts = ciphertext.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted token format");
  const [ivHex, tagHex, encHex] = parts;
  const key = getKey();
  const decipher = createDecipheriv(ALGO, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(encHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}
