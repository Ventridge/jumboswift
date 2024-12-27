// services/business-service/src/models/MpesaCredential.js
const mongoose = require('mongoose');

const mpesaCredentialSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: [true, 'Business ID is required'],
        unique: true  // Using schema-level unique instead of explicit index
    },
    paybillNumber: {
        type: String,
        required: [true, 'Paybill number is required'],
        unique: true,  // Using schema-level unique instead of explicit index
        trim: true,
        validate: {
            validator: function(v) {
                return /^\d{6}$/.test(v);
            },
            message: props => `${props.value} is not a valid paybill number! Must be 6 digits.`
        }
    },
    shortcode: {
        type: String,
        required: [true, 'Shortcode is required'],
        trim: true,
        default: function() {
            return this.paybillNumber;
        }
    },
    callbackUrl: {
        type: String,
        required: [true, 'Callback URL is required'],
        validate: {
            validator: function(v) {
                return /^https?:\/\//.test(v);  // Allow http in development
            },
            message: props => 'Callback URL must be HTTP(S)'
        },
        default: function() {
            return `${process.env.API_BASE_URL}/mpesa/callback`;
        }
    },
    timeoutUrl: {
        type: String,
        required: [true, 'Timeout URL is required'],
        validate: {
            validator: function(v) {
                return /^https?:\/\//.test(v);  // Allow http in development
            },
            message: props => 'Timeout URL must be HTTP(S)'
        },
        default: function() {
            return `${process.env.API_BASE_URL}/mpesa/timeout`;
        }
    },
    environment: {
        type: String,
        enum: ['sandbox', 'production'],
        default: 'sandbox'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'pending'],
        default: 'pending'
    },
  
    vaultSecretPath: {
        type: String,
        required: [true, 'Vault secret path is required']
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    },
    lastVerified: {
        type: Date
    },
    verificationStatus: {
        type: String,
        enum: ['verified', 'unverified', 'failed'],
        default: 'unverified'
    },
    credentialHistory: [{
        action: {
            type: String,
            enum: ['created', 'updated', 'rotated', 'deactivated'],
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        performedBy: {
            type: String,
            required: true
        }
    }]
}, {
    timestamps: true
});

// Only adding index for status since businessId and paybillNumber already have unique constraints
mpesaCredentialSchema.index({ status: 1 });

// Methods
mpesaCredentialSchema.methods.verifyCredentials = async function() {
    try {
        // Implement credential verification logic here
        this.lastVerified = new Date();
        this.verificationStatus = 'verified';
        await this.save();
        return true;
    } catch (error) {
        this.verificationStatus = 'failed';
        await this.save();
        throw error;
    }
};

mpesaCredentialSchema.methods.rotateCredentials = async function(performedBy) {
    try {
        // Implement credential rotation logic here
        this.credentialHistory.push({
            action: 'rotated',
            performedBy
        });
        await this.save();
        return true;
    } catch (error) {
        throw error;
    }
};

// Statics
mpesaCredentialSchema.statics.findActiveCredentials = function() {
    return this.find({ status: 'active' });
};

// Middleware
mpesaCredentialSchema.pre('save', function(next) {
    if (this.isNew) {
        this.credentialHistory.push({
            action: 'created',
            performedBy: this.businessId.toString()
        });
    }
    next();
});

mpesaCredentialSchema.pre('remove', async function(next) {
    try {
        // Cleanup associated vault secrets when credentials are removed
        // Implement vault cleanup logic here
        next();
    } catch (error) {
        next(error);
    }
});

// Virtual for full integration status
mpesaCredentialSchema.virtual('integrationStatus').get(function() {
    if (this.status === 'active' && this.verificationStatus === 'verified') {
        return 'fully_integrated';
    } else if (this.status === 'pending') {
        return 'pending_integration';
    } else {
        return 'integration_issues';
    }
});

// Export model
const MpesaCredential = mongoose.model('MpesaCredential', mpesaCredentialSchema);

module.exports = MpesaCredential;

