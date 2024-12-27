// services/report-service/src/models/ReportSchedule.js
const mongoose = require('mongoose');

const reportScheduleSchema = new mongoose.Schema({
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
    schedule: {
        frequency: {
            type: String,
            enum: ['daily', 'weekly', 'monthly'],
            required: true
        },
        dayOfWeek: Number,  // 0-6 for weekly
        dayOfMonth: Number, // 1-31 for monthly
        time: String,       // HH:mm format
    },
    recipients: [{
        email: String,
        name: String
    }],
    status: {
        type: String,
        enum: ['active', 'paused', 'cancelled'],
        default: 'active'
    },
    lastRun: Date,
    nextRun: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('ReportSchedule', reportScheduleSchema);