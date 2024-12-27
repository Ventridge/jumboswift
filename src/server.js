// Updated server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config');

// Import routes
const businessRoutes = require('./routes/business.routes.js');
const mpesaRoutes = require('./routes/mpesa.routes.js');
const settingsRoutes = require('./routes/settings.routes.js');
const authRoutes = require('./routes/auth.routes.js');
const paymentRoutes = require('./routes/payment.routes.js');
const reportRoutes = require('./routes/report.routes.js');

class BusinessService {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cors(config.getCorsConfig()));
        this.app.use(helmet(config.getHelmetConfig()));

        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }

    setupRoutes() {
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                service: 'business-service',
                timestamp: new Date().toISOString()
            });
        });

        const apiPrefix = config.get('API_PREFIX');
        this.app.use(`${apiPrefix}/auth`, authRoutes);
        this.app.use(`${apiPrefix}/business`, businessRoutes);
        this.app.use(`${apiPrefix}/mpesa`, mpesaRoutes);
        this.app.use(`${apiPrefix}/settings`, settingsRoutes);
        this.app.use(`${apiPrefix}/payment`, paymentRoutes);
        this.app.use(`${apiPrefix}/report`, reportRoutes);


        this.app.use((req, res) => {
            res.status(404).json({
                status: 'error',
                message: 'Route not found'
            });
        });
    }

    setupErrorHandling() {
        this.app.use((err, req, res, next) => {
            console.error('Error:', err);

            if (err.name === 'ValidationError') {
                return res.status(400).json({
                    status: 'error',
                    message: 'Validation Error',
                    errors: Object.values(err.errors).map(e => e.message)
                });
            }

            if (err.code === 11000) {
                return res.status(409).json({
                    status: 'error',
                    message: 'Duplicate record found'
                });
            }

            res.status(err.status || 500).json({
                status: 'error',
                message: err.message || 'Internal Server Error',
                ...(config.isDevelopment() && { stack: err.stack })
            });
        });
    }

    async connectDB() {
        try {
            await mongoose.connect(config.getMongoURI(), {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Connected to MongoDB');
        } catch (error) {
            console.error('MongoDB connection error:', error);
            process.exit(1);
        }
    }

    async start() {
        await this.connectDB();

        const port = config.getPort();
        this.app.listen(port, () => {
            console.log(`Business service running on port ${port}`);
        });
    }

    async shutdown() {
        try {
            await mongoose.connection.close();
            console.log('MongoDB connection closed');
            process.exit(0);
        } catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    }
}

const businessService = new BusinessService();

process.on('SIGTERM', () => businessService.shutdown());
process.on('SIGINT', () => businessService.shutdown());

businessService.start().catch(error => {
    console.error('Failed to start business service:', error);
    process.exit(1);
});

module.exports = BusinessService;