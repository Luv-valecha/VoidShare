// src/lib/crypto.js
//
// All Web Crypto usage for VoidShare lives here:
//   - Each device generates an ephemeral ECDH (P-256) key pair per session.
//   - The two peers exchange their *public* ECDH keys over the (already
//     DTLS-encrypted) WebRTC DataChannel.
//   - Each side derives the same AES-256-GCM "shared key" from
//     (my private key, their public key) without either private key ever
//     leaving the browser.
//   - Every file gets its own random, one-time AES-GCM key. That one-time
//     key is what's actually encrypted with the ECDH shared key before
//     being sent, so a fresh symmetric key is used per transfer.

/** Generate a fresh ephemeral ECDH key pair (P-256). */
export async function generateECDHKeyPair() {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );
}

/** Export a public CryptoKey to raw bytes so it can be sent over the wire. */
export async function exportPublicKey(publicKey) {
  const raw = await crypto.subtle.exportKey("raw", publicKey);
  return Array.from(new Uint8Array(raw));
}

/** Re-import a peer's raw public key bytes into a usable CryptoKey. */
export async function importPeerPublicKey(bytes) {
  return crypto.subtle.importKey(
    "raw",
    new Uint8Array(bytes),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );
}

/**
 * Derive the AES-256-GCM key shared between us and a peer.
 *
 * Both `privateKey` and `publicKey` MUST already be CryptoKey instances
 * (not null, not raw bytes) or SubtleCrypto throws
 * "EcdhKeyDeriveParams: public: Must be a CryptoKey". Callers should check
 * key-exchange readiness (see useVoidShare's `keysReady`) before calling
 * this, rather than relying on this function to fail gracefully.
 */
export async function deriveSharedKey(privateKey, publicKey) {
  if (!privateKey || !publicKey) {
    throw new Error(
      "Cannot derive shared key: the ECDH key exchange with your peer hasn't finished yet."
    );
  }
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: publicKey },
    privateKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/** Generate a fresh one-time AES-256-GCM key for a single file transfer. */
export async function generateFileKey() {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function exportRawKey(key) {
  return crypto.subtle.exportKey("raw", key);
}

export async function importRawAESKey(rawKey) {
  return crypto.subtle.importKey("raw", rawKey, "AES-GCM", true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptWithAES(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv, encrypted };
}

export async function decryptWithAES(key, encrypted, iv) {
  return crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
}

export async function sha256Hex(buffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashFile(file) {
  return sha256Hex(await file.arrayBuffer());
}

export async function verifyBlobHash(blob, expectedHash) {
  const computed = await sha256Hex(await blob.arrayBuffer());
  return computed === expectedHash;
}
