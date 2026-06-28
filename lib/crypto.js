// lib/crypto.js
// Chunk-level AES-256 encryption using CryptoJS
// Works in browser (no Node crypto needed)

/**
 * Encrypt an ArrayBuffer chunk → Base64 string
 * @param {ArrayBuffer} buffer
 * @param {string} key  passphrase
 * @returns {string} Base64 ciphertext
 */
export function encryptChunk(buffer, key) {
    // Import CryptoJS lazily from window (loaded via CDN script tag in layout)
    const CryptoJS = window.CryptoJS;
  
    // Convert ArrayBuffer → WordArray
    const uint8 = new Uint8Array(buffer);
    const wordArray = CryptoJS.lib.WordArray.create(uint8);
  
    const encrypted = CryptoJS.AES.encrypt(wordArray, key);
    return encrypted.toString(); // Base64 ciphertext
  }
  
  /**
   * Decrypt a Base64 ciphertext string → ArrayBuffer
   * @param {string} ciphertext  Base64
   * @param {string} key passphrase
   * @returns {ArrayBuffer}
   */
  export function decryptChunk(ciphertext, key) {
    const CryptoJS = window.CryptoJS;
  
    const decrypted = CryptoJS.AES.decrypt(ciphertext, key);
    const wordArray = decrypted;
  
    // WordArray → Uint8Array
    const words = wordArray.words;
    const sigBytes = wordArray.sigBytes;
    const uint8 = new Uint8Array(sigBytes);
    for (let i = 0; i < sigBytes; i++) {
      uint8[i] = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
    }
    return uint8.buffer;
  }
  