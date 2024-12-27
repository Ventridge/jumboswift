// services/payment-service/src/vault.js
const axios = require('axios');

class VaultService {
  constructor(config) {
    this.config = config;
    this.token = config.token;
    this.baseUrl = config.address;
    this.axios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'X-Vault-Token': this.token
      }
    });
  }

  /**
   * Initialize Vault connection
   * @param {Object} config Configuration object
   * @param {string} config.address Vault server address
   * @param {string} config.token Vault authentication token
   * @returns {Promise<VaultService>}
   */
  static async connect(config) {
    try {
      const service = new VaultService(config);
      // Verify connection by checking Vault status
      await service.getStatus();
      return service;
    } catch (error) {
      console.error('Failed to connect to Vault:', error);
      throw new Error('Vault connection failed');
    }
  }

  /**
   * Get Vault server status
   * @returns {Promise<Object>}
   */
  async getStatus() {
    try {
      const response = await this.axios.get('/v1/sys/health');
      return response.data;
    } catch (error) {
      console.error('Failed to get Vault status:', error);
      throw error;
    }
  }

  /**
   * Read secret from Vault
   * @param {string} path Secret path
   * @returns {Promise<Object>}
   */
  async read(path) {
    try {
      const response = await this.axios.get(`/v1/${path}`);
      return response.data.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error(`Secret not found at path: ${path}`);
      }
      console.error(`Failed to read secret from path ${path}:`, error);
      throw error;
    }
  }

  /**
   * Write secret to Vault
   * @param {string} path Secret path
   * @param {Object} data Secret data
   * @returns {Promise<void>}
   */
  async write(path, data) {
    try {
      await this.axios.post(`/v1/${path}`, { data });
    } catch (error) {
      console.error(`Failed to write secret to path ${path}:`, error);
      throw error;
    }
  }

  /**
   * Delete secret from Vault
   * @param {string} path Secret path
   * @returns {Promise<void>}
   */
  async delete(path) {
    try {
      await this.axios.delete(`/v1/${path}`);
    } catch (error) {
      console.error(`Failed to delete secret from path ${path}:`, error);
      throw error;
    }
  }

  /**
   * Store M-Pesa credentials in Vault
   * @param {string} businessId Business identifier
   * @param {Object} credentials M-Pesa credentials
   * @returns {Promise<void>}
   */
  async storeMpesaCredentials(businessId, credentials) {
    const path = `secret/mpesa/${businessId}`;
    try {
      await this.write(path, credentials);
    } catch (error) {
      console.error(`Failed to store M-Pesa credentials for business ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Retrieve M-Pesa credentials from Vault
   * @param {string} businessId Business identifier
   * @returns {Promise<Object>}
   */
  async getMpesaCredentials(businessId) {
    const path = `secret/mpesa/${businessId}`;
    try {
      return await this.read(path);
    } catch (error) {
      console.error(`Failed to retrieve M-Pesa credentials for business ${businessId}:`, error);
      throw error;
    }
  }

  /**
   * Update M-Pesa credentials in Vault
   * @param {string} businessId Business identifier
   * @param {Object} credentials Updated M-Pesa credentials
   * @returns {Promise<void>}
   */
  async updateMpesaCredentials(businessId, credentials) {
    const path = `secret/mpesa/${businessId}`;
    try {
      await this.write(path, credentials);
    } catch (error) {
      console.error(`Failed to update M-Pesa credentials for business ${businessId}:`, error);
      throw error;
    }
  }
}

module.exports = VaultService;