// services/business-service/src/models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    businessId: {
        type: String,
        required: [true, 'Business ID is required']
    },
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [1, 'Amount must be greater than 0']
    },
    currency: {
        type: String,
        default: 'KES',
        uppercase: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        validate: {
            validator: function(v) {
                return /^254\d{9}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    mpesaReceiptNumber: {
        type: String,
        sparse: true,
        unique: true
    },
    checkoutRequestID: {
        type: String,
        required: true,
        unique: true    // Using schema-level unique instead of explicit index
    },
    merchantRequestID: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    resultCode: {
        type: String
    },
    resultDescription: {
        type: String
    },
    accountReference: {
        type: String,
        required: true
    },
    transactionType: {
        type: String,
        enum: ['CustomerPayBillOnline', 'CustomerBuyGoodsOnline'],
        default: 'CustomerPayBillOnline'
    },
    metadata: {
        type: Map,
        of: String,
        default: {}
    },
    callbackReceived: {
        type: Boolean,
        default: false
    },
    callbackData: {
        type: mongoose.Schema.Types.Mixed
    },
    retryCount: {
        type: Number,
        default: 0
    },
    lastRetryTime: {
        type: Date
    },
    processingErrors: [{
        error: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Define only necessary indexes
transactionSchema.index({ businessId: 1, status: 1 });
transactionSchema.index({ createdAt: -1 });

// Methods
transactionSchema.methods.updateStatus = async function(status, description) {
    this.status = status;
    if (description) {
        this.resultDescription = description;
    }
    this.updatedAt = Date.now();
    return this.save();
};

transactionSchema.methods.recordError = async function(error) {
    this.processingErrors.push({ error });
    this.retryCount += 1;
    this.lastRetryTime = new Date();
    return this.save();
};

transactionSchema.methods.handleCallback = async function(callbackData) {
    console.log('Handling callback for transaction:',callbackData);
    this.callbackReceived = true;
    this.callbackData = callbackData;
    
    // Update status based on callback data
    const resultCode = callbackData.ResultCode;
    this.resultCode = resultCode;
    this.resultDescription = callbackData.ResultDesc;
    
    if (resultCode === '0' || resultCode === 0) {
        this.status = 'completed';
        this.mpesaReceiptNumber = callbackData.MpesaReceiptNumber;
    } else {
        this.status = 'failed';
    }
    
    return this.save();
};

// Statics
transactionSchema.statics.getBusinessTransactions = function(businessId, filters = {}) {
    const query = { businessId, ...filters };
    return this.find(query).sort({ createdAt: -1 });
};

transactionSchema.statics.getPendingTransactions = function() {
    return this.find({
        status: 'pending',
        retryCount: { $lt: 3 },
        createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
};

// Virtual for transaction age
transactionSchema.virtual('transactionAge').get(function() {
    return Date.now() - this.createdAt.getTime();
});

// Virtual for retry eligible
transactionSchema.virtual('canRetry').get(function() {
    return this.status === 'failed' && 
           this.retryCount < 3 && 
           this.transactionAge < 24 * 60 * 60 * 1000;
});

// Pre-save middleware
transactionSchema.pre('save', function(next) {
    if (this.isNew) {
        // Set default metadata if not provided
        if (!this.metadata.has('initiatedFrom')) {
            this.metadata.set('initiatedFrom', 'api');
        }
    }
    next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;