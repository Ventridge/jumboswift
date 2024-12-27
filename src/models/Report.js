// services/report-service/src/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    businessId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Business'
    },
    type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        required: true
    },
    format: {
        type: String,
        enum: ['pdf', 'csv'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    url: String,
    metadata: {
        type: Map,
        of: String
    },
    generatedAt: Date,
    error: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);