// services/report-service/src/utils/reportGenerator.js
const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const moment = require('moment');

class ReportGenerator {
    static async generatePDF(data) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument();
                const chunks = [];

                // Collect PDF chunks
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', reject);

                // Add header
                doc.fontSize(20).text('Transaction Report', { align: 'center' });
                doc.moveDown();
                doc.fontSize(12).text(`Generated on: ${moment().format('YYYY-MM-DD HH:mm:ss')}`);
                doc.moveDown();

                // Add summary section
                doc.fontSize(16).text('Summary');
                doc.moveDown();
                doc.fontSize(12).text(`Total Transactions: ${data.totalTransactions}`);
                doc.text(`Total Amount: ${data.totalAmount.toFixed(2)} KES`);
                doc.text(`Successful Transactions: ${data.successfulTransactions}`);
                doc.text(`Failed Transactions: ${data.failedTransactions}`);
                doc.text(`Average Transaction Amount: ${data.averageTransactionAmount.toFixed(2)} KES`);
                doc.moveDown();

                // Add transactions by status
                doc.fontSize(16).text('Transactions by Status');
                doc.moveDown();
                Object.entries(data.transactionsByStatus).forEach(([status, count]) => {
                    doc.fontSize(12).text(`${status}: ${count}`);
                });
                doc.moveDown();

                // Add daily transactions chart
                doc.fontSize(16).text('Daily Transactions');
                doc.moveDown();
                Object.entries(data.transactionsByDay).forEach(([date, amount]) => {
                    doc.fontSize(12).text(`${date}: ${amount.toFixed(2)} KES`);
                });

                // If monthly report, add weekly breakdown
                if (data.transactionsByWeek) {
                    doc.moveDown();
                    doc.fontSize(16).text('Weekly Breakdown');
                    doc.moveDown();
                    Object.entries(data.transactionsByWeek).forEach(([week, amount]) => {
                        doc.fontSize(12).text(`${week}: ${amount.toFixed(2)} KES`);
                    });
                }

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    static async generateCSV(data) {
        try {
            // Prepare daily transactions data
            const dailyTransactions = Object.entries(data.transactionsByDay).map(([date, amount]) => ({
                date,
                amount: amount.toFixed(2),
                type: 'daily'
            }));

            // Prepare weekly transactions data if available
            const weeklyTransactions = data.transactionsByWeek ? 
                Object.entries(data.transactionsByWeek).map(([week, amount]) => ({
                    date: week,
                    amount: amount.toFixed(2),
                    type: 'weekly'
                })) : [];

            // Prepare status breakdown
            const statusBreakdown = Object.entries(data.transactionsByStatus).map(([status, count]) => ({
                date: 'Total',
                status,
                count,
                type: 'status'
            }));

            // Combine all data
            const csvData = [
                {
                    date: 'Summary',
                    totalTransactions: data.totalTransactions,
                    totalAmount: data.totalAmount.toFixed(2),
                    successfulTransactions: data.successfulTransactions,
                    failedTransactions: data.failedTransactions,
                    averageAmount: data.averageTransactionAmount.toFixed(2),
                    type: 'summary'
                },
                ...dailyTransactions,
                ...weeklyTransactions,
                ...statusBreakdown
            ];

            // Define fields based on data type
            const fields = [
                {
                    label: 'Date/Period',
                    value: 'date'
                },
                {
                    label: 'Amount (KES)',
                    value: row => row.amount || ''
                },
                {
                    label: 'Transaction Count',
                    value: row => row.totalTransactions || ''
                },
                {
                    label: 'Status',
                    value: row => row.status || ''
                },
                {
                    label: 'Status Count',
                    value: row => row.count || ''
                },
                {
                    label: 'Type',
                    value: 'type'
                }
            ];

            const json2csvParser = new Parser({ fields });
            return Buffer.from(json2csvParser.parse(csvData));

        } catch (error) {
            console.error('CSV generation error:', error);
            throw new Error('Failed to generate CSV report');
        }
    }

    // Helper method to format currency
    static formatCurrency(amount) {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    }
}

module.exports = {
    generatePDF: ReportGenerator.generatePDF,
    generateCSV: ReportGenerator.generateCSV
};