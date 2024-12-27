// services/report-service/src/services/email.service.js
const nodemailer = require("nodemailer");
const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");
const path = require('path');
const fs = require('fs').promises;
const Handlebars = require('handlebars');

class EmailService {
    constructor() {
        this.templates = {};
        this.initializeTemplates();

        const emailConfig = config.getEmailConfig();
        this.transporter = nodemailer.createTransport({
            host: emailConfig.mailerParams.host,
            port: emailConfig.mailerParams.port,
            secure: emailConfig.mailerParams.secure,
            auth: {
                user: emailConfig.mailerSecrets.username,
                pass: emailConfig.mailerSecrets.password,
            },
        });
    }

    async initializeTemplates() {
        try {
            const templatesDir = path.join(__dirname, '../templates/email');
            const templates = {
                reportReady: await fs.readFile(path.join(templatesDir, 'report-ready.hbs'), 'utf-8'),
                reportError: await fs.readFile(path.join(templatesDir, 'report-error.hbs'), 'utf-8'),
                scheduledReport: await fs.readFile(path.join(templatesDir, 'scheduled-report.hbs'), 'utf-8')
            };

            for (const [name, template] of Object.entries(templates)) {
                this.templates[name] = Handlebars.compile(template);
            }
        } catch (error) {
            logger.error('Failed to load email templates:', error);
        }
    }

    async sendEmail(emailAddress, subject, message, islink = false, isHtml = true, attachments = undefined, cc = undefined, sender = undefined) {
        try {
            const senderEmail = sender || config.mailerSecrets.senderEmail;

            if (islink) {
                const response = await axios.get(message);
                message = response.data;
            }

            const mailOptions = {
                from: senderEmail,
                to: emailAddress,
                subject: subject,
                text: isHtml ? undefined : message,
                html: isHtml ? message : undefined,
            };

            if (cc) {
                mailOptions.cc = cc;
            }

            if (attachments) {
                mailOptions.attachments = attachments.map(att => ({
                    url: att.url,
                    filename: att.name
                }));
            }

            const response = await this.transporter.sendMail(mailOptions);
            logger.info(`Email sent successfully: ${response.messageId}`);
            return response;

        } catch (error) {
            logger.error(`Error sending email: ${error.message}`);
            throw error;
        }
    }

    async sendReportEmail(options) {
        const { 
            recipients, 
            reportUrl, 
            reportType, 
            businessName,
            startDate,
            endDate,
            format
        } = options;

        try {
            const template = this.templates['reportReady'];
            const html = template({
                businessName,
                reportType,
                reportUrl,
                startDate,
                endDate,
                format,
                expiryHours: 24
            });

            await this.sendEmail(
                recipients,
                `${businessName} - ${reportType} Report Ready`,
                html,
                false,
                true
            );
        } catch (error) {
            logger.error('Failed to send report email:', error);
            throw error;
        }
    }

    async sendReportErrorNotification(options) {
        const { 
            recipients, 
            businessName, 
            reportType, 
            error 
        } = options;

        try {
            const template = this.templates['reportError'];
            const html = template({
                businessName,
                reportType,
                error: error.message,
                timestamp: new Date().toISOString()
            });

            await this.sendEmail(
                recipients,
                `${businessName} - Report Generation Failed`,
                html,
                false,
                true
            );
        } catch (error) {
            logger.error('Failed to send error notification:', error);
            throw error;
        }
    }

    async sendScheduledReportNotification(options) {
        const { 
            recipients, 
            businessName, 
            reportType, 
            schedule,
            nextRunDate
        } = options;

        try {
            const template = this.templates['scheduledReport'];
            const html = template({
                businessName,
                reportType,
                schedule,
                nextRunDate: nextRunDate.toISOString(),
                frequency: schedule.frequency
            });

            await this.sendEmail(
                recipients,
                `${businessName} - Report Schedule Confirmation`,
                html,
                false,
                true
            );
        } catch (error) {
            logger.error('Failed to send schedule notification:', error);
            throw error;
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = {
    sendEmail: (...args) => emailService.sendEmail(...args),
    sendReportEmail: (...args) => emailService.sendReportEmail(...args),
    sendReportErrorNotification: (...args) => emailService.sendReportErrorNotification(...args),
    sendScheduledReportNotification: (...args) => emailService.sendScheduledReportNotification(...args)
};