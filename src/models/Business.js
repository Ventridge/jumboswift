// services/business-service/src/models/Business.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const businessSchema = new mongoose.Schema({
    businessName: {
        type: String,
        required: [true, 'Business name is required'],
        trim: true,
        minlength: [2, 'Business name must be at least 2 characters'],
        maxlength: [100, 'Business name cannot exceed 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,  // This creates an index automatically
        trim: true,
        lowercase: true,
        match: [
            /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/,
            'Please enter a valid email address'
        ]
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true,
        match: [
            /^254\d{9}$/,
            'Please enter a valid Kenyan phone number starting with 254'
        ]
    },
    businessType: {
        type: String,
        required: [true, 'Business type is required'],
        enum: ['retail', 'service', 'wholesale', 'manufacturing', 'other']
    },
    status: {
        type: String,
        enum: ['active', 'suspended', 'pending'],
        default: 'pending'
    },
    address: {
        street: String,
        city: String,
        state: String,
        country: String,
        postalCode: String
    },
    mpesaIntegration: {
        paybillNumber: String,
        credentialsPath: String,
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending'],
            default: 'pending'
        }
    },
    settings: {
        timezone: {
            type: String,
            default: 'Africa/Nairobi'
        },
        currency: {
            type: String,
            default: 'KES'
        },
        language: {
            type: String,
            default: 'en'
        },
        webhookUrl: String,
        callbackUrl: String
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: true
        },
        webhook: {
            type: Boolean,
            default: false
        },
        emailAddresses: [String],
        phoneNumbers: [String]
    }
}, {
    timestamps: true
});

// Only add necessary indexes (email already has an index due to unique: true)
businessSchema.index({ status: 1 });
businessSchema.index({ businessType: 1 });

// Hash password before saving
businessSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 12);
    }
    next();
});

// Compare password method
businessSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Create virtual for full address
businessSchema.virtual('fullAddress').get(function() {
    if (!this.address) return '';
    
    const parts = [
        this.address.street,
        this.address.city,
        this.address.state,
        this.address.country,
        this.address.postalCode
    ];
    
    return parts.filter(Boolean).join(', ');
});

const Business = mongoose.model('Business', businessSchema);

module.exports = Business;

// example usage
// const business = new Business({
//     businessName: 'Acme Corp',
//     email: '
//     password: 'password123',
//     phoneNumber: '254712345678',
//     businessType: 'retail',
//     address: {
//         street: '123 Main St',
//         city: 'Nairobi',
//         country: 'Kenya',
//         postalCode: '00100'
//     }
// });
//