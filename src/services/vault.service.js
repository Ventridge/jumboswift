// services/business-service/src/services/vault.service.js
const axios = require('axios');

class VaultService {
    constructor() {
        this.baseUrl = process.env.VAULT_ADDR || 'http://localhost:8200'
        this.token = process.env.VAULT_TOKEN || 'hvs.TMuibIZuJyXxPV16FtkHq55P';
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'X-Vault-Token': this.token
            }
        });
    }

    async initialize() {
        try {
          // Get token using AppRole
          const response = await axios.post(
            `${this.baseUrl}/v1/auth/approle/login`,
            {
              role_id: process.env.VAULT_ROLE_ID,
              secret_id: process.env.VAULT_SECRET_ID
            }
          );
          
          this.token = response.data.auth.client_token;
          
          // Set up axios instance with token
          this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
              'X-Vault-Token': this.token
            }
          });
        } catch (error) {
          console.error('Failed to initialize Vault service:', error);
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
        try {
            const path = `secret/data/mpesa/${businessId}`;
            await this.client.post(`/v1/${path}`, {
                data: {
                    consumerKey: credentials.consumerKey,
                    consumerSecret: credentials.consumerSecret,
                    passkey: credentials.passkey,
                    environment: credentials.environment || 'sandbox'
                }
            });
        } catch (error) {
            console.error('Error storing M-Pesa credentials in Vault:', error.message);
            throw new Error('Failed to store credentials securely');
        }
    }

    /**
     * Retrieve M-Pesa credentials from Vault
     * @param {string} businessId Business identifier
     * @returns {Promise<Object>}
     */
    async getMpesaCredentials(businessId) {
        try {
            const path = `secret/data/mpesa/${businessId}`;
            const response = await this.client.get(`/v1/${path}`);
            return response.data.data.data;
        } catch (error) {
            if (error.response?.status === 404) {
                throw new Error('Credentials not found');
            }
            console.error('Error retrieving M-Pesa credentials from Vault:', error);
            throw new Error('Failed to retrieve credentials');
        }
    }

    /**
     * Update M-Pesa credentials in Vault
     * @param {string} businessId Business identifier
     * @param {Object} credentials Updated M-Pesa credentials
     * @returns {Promise<void>}
     */
    async updateMpesaCredentials(businessId, credentials) {
        try {
            const path = `secret/data/mpesa/${businessId}`;
            await this.client.put(`/v1/${path}`, {
                data: {
                    consumerKey: credentials.consumerKey,
                    consumerSecret: credentials.consumerSecret,
                    passkey: credentials.passkey,
                    environment: credentials.environment || 'sandbox'
                }
            });
        } catch (error) {
            console.error('Error updating M-Pesa credentials in Vault:', error);
            throw new Error('Failed to update credentials');
        }
    }

    /**
     * Delete M-Pesa credentials from Vault
     * @param {string} businessId Business identifier
     * @returns {Promise<void>}
     */
    async deleteMpesaCredentials(businessId) {
        try {
            const path = `secret/metadata/mpesa/${businessId}`;
            await this.client.delete(`/v1/${path}`);
        } catch (error) {
            console.error('Error deleting M-Pesa credentials from Vault:', error);
            throw new Error('Failed to delete credentials');
        }
    }

    /**
     * Check if credentials exist in Vault
     * @param {string} businessId Business identifier
     * @returns {Promise<boolean>}
     */
    async hasCredentials(businessId) {
        try {
            const path = `secret/metadata/mpesa/${businessId}`;
            await this.client.get(`/v1/${path}`);
            return true;
        } catch (error) {
            if (error.response?.status === 404) {
                return false;
            }
            throw error;
        }
    }

    /**
     * List all business credentials
     * @returns {Promise<string[]>} List of business IDs with stored credentials
     */
    async listBusinessCredentials() {
        try {
            const path = 'secret/metadata/mpesa';
            const response = await this.client.get(`/v1/${path}?list=true`);
            return response.data.data.keys || [];
        } catch (error) {
            console.error('Error listing business credentials:', error);
            throw new Error('Failed to list credentials');
        }
    }

    /**
     * Rotate credentials for a business
     * @param {string} businessId Business identifier
     * @param {Object} newCredentials New M-Pesa credentials
     * @returns {Promise<void>}
     */
    async rotateCredentials(businessId, newCredentials) {
        try {
            // Get current credentials as backup
            const currentCredentials = await this.getMpesaCredentials(businessId);

            // Store new credentials
            await this.storeMpesaCredentials(businessId, newCredentials);

            // Store backup of old credentials
            const backupPath = `secret/data/mpesa/${businessId}/backup`;
            await this.client.post(`/v1/${backupPath}`, {
                data: currentCredentials
            });
        } catch (error) {
            console.error('Error rotating credentials:', error);
            throw new Error('Failed to rotate credentials');
        }
    }

    /**
     * Verify Vault connection
     * @returns {Promise<boolean>}
     */
    async verifyConnection() {
        try {
            await this.client.get('/v1/sys/health');
            return true;
        } catch (error) {
            console.error('Vault connection error:', error);
            return false;
        }
    }
}

module.exports = VaultService;