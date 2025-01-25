// src/utils/encryption.js
import crypto from "crypto";
import config from "../config/envConfig.js";

class Encryption {
  constructor() {
    if (!config.encryption.key) {
      throw new Error("Encryption key must be provided");
    }

    // Generate key using PBKDF2
    this.key = crypto.pbkdf2Sync(
      config.encryption.key,
      'salt',
      100000, // iterations
      32, // key length
      'sha256'
    );
  }

  /**
   * Encrypt sensitive data
   * @param {string} data - Data to encrypt
   * @returns {string} - Encrypted data with IV prepended
   */
  encrypt(data) {
    if (!data) return null;

    try {
      // Generate a new IV for each encryption
      const iv = crypto.randomBytes(16);
      
      // Create cipher with AES-256-CBC
      const cipher = crypto.createCipheriv('aes-256-cbc', this.key, iv);

      // Encrypt the data
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Prepend IV to encrypted data
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt encrypted data
   * @param {string} encryptedData - Encrypted data with IV prepended
   * @returns {string} - Decrypted data
   */
  decrypt(encryptedData) {
    if (!encryptedData) return null;

    try {
      // Split IV and encrypted data
      const [ivHex, encrypted] = encryptedData.split(':');
      
      // Convert IV back to Buffer
      const iv = Buffer.from(ivHex, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipheriv('aes-256-cbc', this.key, iv);

      // Decrypt the data
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Hash sensitive data (one-way encryption)
   * @param {string} data - Data to hash
   * @returns {string} - Hashed data
   */
  hash(data) {
    if (!data) return null;

    try {
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      console.error("Hashing error:", error);
      throw new Error("Failed to hash data");
    }
  }

  /**
   * Generate a random encryption key
   * @returns {string} - Generated key in hex format
   */
  static generateKey() {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Create singleton instance
const encryption = new Encryption();

// Mongoose field encryption methods
export const encryptField = function(value) {
  if (!value) return value;
  return encryption.encrypt(value.toString());
};

export const decryptField = function(value) {
  if (!value) return value;
  return encryption.decrypt(value);
};

export default encryption;