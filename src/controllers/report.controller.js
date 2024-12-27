// services/report-service/src/controllers/report.controller.js
const Report = require('../models/Report');
const ReportSchedule = require('../models/ReportSchedule');
const Transaction = require('../models/Transaction');
const { generatePDF, generateCSV } = require('../utils/reportGenerator.js');
const { uploadToStorage } = require('../services/storage.service.js');
const { sendReportEmail } = require('../services/email.service.js');
const moment = require('moment');

class ReportController {
    async generateReport(businessId, options) {
        try {
            const { type, format, startDate, endDate } = options;

            // Create report record
            const report = new Report({
                businessId,
                type,
                format,
                startDate: new Date(startDate),
                endDate: new Date(endDate || new Date()),
                status: 'processing'
            });
            await report.save();

            // Get transaction data
            const transactions = await this.getTransactionData(
                businessId, 
                report.startDate, 
                report.endDate
            );

            // Generate report file
            const reportData = await this.aggregateReportData(transactions, type);
            const fileBuffer = format === 'pdf' 
                ? await generatePDF(reportData)
                : await generateCSV(reportData);

            // Upload to storage
            const fileName = `reports/${businessId}/${report._id}.${format}`;
            const url = await uploadToStorage(fileName, fileBuffer);

            // Update report record
            report.status = 'completed';
            report.url = url;
            report.generatedAt = new Date();
            await report.save();

            await sendReportEmail({
                recipients: 'user@example.com',
                reportUrl: url,
                reportType: type,
                businessName: 'Business Name',
                startDate,
                endDate,
                format
            });

            return {
                status: 'success',
                data: {
                    reportId: report._id,
                    url,
                    type,
                    format,
                    generatedAt: report.generatedAt
                }
            };
        } catch (error) {
            console.error('Report generation error:', error);
            throw new Error('Failed to generate report');
        }
    }

    async scheduleReport(businessId, options) {
        try {
            const { type, format, schedule, recipients } = options;

            // Validate schedule
            this.validateSchedule(schedule);

            // Calculate next run time
            const nextRun = this.calculateNextRun(schedule);

            // Create schedule record
            const reportSchedule = new ReportSchedule({
                businessId,
                type,
                format,
                schedule,
                recipients,
                nextRun,
                status: 'active'
            });
            await reportSchedule.save();

            return {
                status: 'success',
                data: {
                    scheduleId: reportSchedule._id,
                    nextRun
                }
            };
        } catch (error) {
            console.error('Report scheduling error:', error);
            throw new Error('Failed to schedule report');
        }
    }

    async getTransactionData(businessId, startDate, endDate) {
        return await Transaction.find({
            businessId,
            createdAt: { $gte: startDate, $lte: endDate }
        }).sort({ createdAt: -1 });
    }

    async aggregateReportData(transactions, type) {
        const aggregation = {
            totalTransactions: transactions.length,
            totalAmount: transactions.reduce((sum, t) => sum + t.amount, 0),
            successfulTransactions: transactions.filter(t => t.status === 'completed').length,
            failedTransactions: transactions.filter(t => t.status === 'failed').length,
            averageTransactionAmount: transactions.length > 0 
                ? transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length 
                : 0,
            transactionsByStatus: this.groupByStatus(transactions),
            transactionsByDay: this.groupByDay(transactions)
        };

        if (type === 'monthly') {
            aggregation.transactionsByWeek = this.groupByWeek(transactions);
        }

        return aggregation;
    }

    validateSchedule(schedule) {
        const { frequency, dayOfWeek, dayOfMonth, time } = schedule;

        if (frequency === 'weekly' && (dayOfWeek < 0 || dayOfWeek > 6)) {
            throw new Error('Invalid day of week');
        }

        if (frequency === 'monthly' && (dayOfMonth < 1 || dayOfMonth > 31)) {
            throw new Error('Invalid day of month');
        }

        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
            throw new Error('Invalid time format');
        }
    }

    calculateNextRun(schedule) {
        const { frequency, dayOfWeek, dayOfMonth, time } = schedule;
        const [hours, minutes] = time.split(':');
        let nextRun = moment().set({ hours, minutes, seconds: 0, milliseconds: 0 });

        switch (frequency) {
            case 'daily':
                if (nextRun.isBefore(moment())) {
                    nextRun.add(1, 'day');
                }
                break;

            case 'weekly':
                nextRun.day(dayOfWeek);
                if (nextRun.isBefore(moment())) {
                    nextRun.add(1, 'week');
                }
                break;

            case 'monthly':
                nextRun.date(dayOfMonth);
                if (nextRun.isBefore(moment())) {
                    nextRun.add(1, 'month');
                }
                break;
        }

        return nextRun.toDate();
    }

    groupByStatus(transactions) {
        return transactions.reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {});
    }

    groupByDay(transactions) {
        return transactions.reduce((acc, t) => {
            const day = moment(t.createdAt).format('YYYY-MM-DD');
            acc[day] = (acc[day] || 0) + t.amount;
            return acc;
        }, {});
    }

    groupByWeek(transactions) {
        return transactions.reduce((acc, t) => {
            const week = moment(t.createdAt).format('YYYY-[W]WW');
            acc[week] = (acc[week] || 0) + t.amount;
            return acc;
        }, {});
    }
}

module.exports = ReportController;