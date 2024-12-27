// src/config/index.js
const dotenv = require('dotenv');
dotenv.config();

/*  host: config.mailerParams.host,
            port: config.mailerParams.port,
            secure: false,
            auth: {
                user: config.mailerSecrets.username,
                pass: config.mailerSecrets.password,
            },*/


class Config {
    constructor() {
        this.env = {
            // Server Configuration
            PORT: 8000,
            NODE_ENV: 'development',

            // MongoDB Configuration
            MONGODB_URI: 'mongodb://localhost:27017/payment-api-gateway',
            
            // JWT Configuration
            JWT_SECRET: 'payment-secret-gateway',
            JWT_EXPIRY: '24h',
            
            // M-Pesa Configuration
            MPESA_ENVIRONMENT: 'sandbox',
            MPESA_API_URL: 'https://sandbox.safaricom.co.ke',
            
            // Redis Configuration
            REDIS_HOST: 'localhost',
            REDIS_PORT: 6379,
            
            // API Configuration
            API_PREFIX: '/api',
            CORS_ORIGIN: '*',
            
            // Logging Configuration
            LOG_LEVEL: 'info',
            
            // Rate Limiting
            RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
            RATE_LIMIT_MAX: 100, // requests per window

            EMAIL_HOST: 'smtp.gmail.com',
            EMAIL_PORT: 587,
            EMAIL_SECURE: false,
            EMAIL_USERNAME: process.env.EMAIL_USERNAME,
            EMAIL_PASSWORD: process.env.EMAIL_PASSWORD,
            EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@spark.co.ke',

            
        };

        // Override defaults with environment variables
        Object.keys(this.env).forEach(key => {
            if (process.env[key] !== undefined) {
                this.env[key] = process.env[key];
            }
        });
    }
    getEmailConfig() {
        return {
            mailerParams: {
                host: this.get('EMAIL_HOST'),
                port: parseInt(this.get('EMAIL_PORT')),
                secure: this.get('EMAIL_SECURE')
            },
            mailerSecrets: {
                username: this.get('EMAIL_USERNAME'),
                password: this.get('EMAIL_PASSWORD'),
                senderEmail: this.get('EMAIL_FROM')
            }
        };
    }

    get(key) {
        return this.env[key];
    }

    set(key, value) {
        this.env[key] = value;
    }

    getMongoURI() {
        return this.get('MONGODB_URI');
    }

    getPort() {
        return parseInt(this.get('PORT'));
    }

    isProduction() {
        return this.get('NODE_ENV') === 'production';
    }

    isDevelopment() {
        return this.get('NODE_ENV') === 'development';
    }

    getCorsConfig() {
        return {
            origin: this.get('CORS_ORIGIN'),
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization']
        };
    }

    getHelmetConfig() {
        return {
            contentSecurityPolicy: this.isProduction(),
            crossOriginEmbedderPolicy: this.isProduction()
        };
    }

    getRateLimitConfig() {
        return {
            windowMs: this.get('RATE_LIMIT_WINDOW'),
            max: this.get('RATE_LIMIT_MAX')
        };
    }

    getMpesaConfig() {
        return {
            environment: this.get('MPESA_ENVIRONMENT'),
            baseUrl: this.get('MPESA_API_URL')
        };
    }

    getLogConfig() {
        return {
            level: this.get('LOG_LEVEL'),
            disable: process.env.NODE_ENV === 'test'
        };
    }
}
module.exports = new Config();