// @ts-nocheck
import { createPublicKey, verify as cryptoVerify } from "crypto";

/**
 * Ed25519 DER prefix for SPKI format.
 * Discord provides the public key as a raw 32-byte hex string.
 * Node's crypto.createPublicKey requires the DER-encoded SPKI wrapper.
 */
const ED25519_DER_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Verify a Discord Ed25519 interaction signature.
 *
 * Discord signs: timestamp + raw_body
 * with the application's Ed25519 private key.
 *
 * @param rawBody     - The raw request body as a Buffer (BEFORE JSON parsing)
 * @param signature   - X-Signature-Ed25519 header value (hex string)
 * @param timestamp   - X-Signature-Timestamp header value
 * @param publicKeyHex - The application's public_key from Discord (hex string)
 * @returns true if the signature is valid
 */
export function verifyDiscordSignature(
  rawBody: Buffer,
  signature: string,
  timestamp: string,
  publicKeyHex: string,
): boolean {
  try {
    const keyDer = Buffer.concat([
      ED25519_DER_PREFIX,
      Buffer.from(publicKeyHex, "hex"),
    ]);
    const publicKey = createPublicKey({ key: keyDer, format: "der", type: "spki" });
    const message = Buffer.concat([Buffer.from(timestamp, "utf8"), rawBody]);
    const sig = Buffer.from(signature, "hex");
    return cryptoVerify(null, message, publicKey, sig);
  } catch {
    return false;
  }
}
