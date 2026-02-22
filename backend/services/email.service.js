const ejs = require("ejs");
const path = require("path");
// const mailchimpService = require("./mailchimp.service");
const brevoService = require("./brevo.service");
const EmailLog = require("../models/EmailLog.model");

/**
 * Abstract Email Service Layer
 * Handles template rendering.
 */
class EmailService {
    constructor() {
        this.templateDir = path.join(__dirname, "../emails/templates");
    }

    /**
     * Render Template directly
     */
    async renderTemplate(templateName, data) {
        const templatePath = path.join(this.templateDir, templateName);
        try {
            return await ejs.renderFile(templatePath, data);
        } catch (error) {
            console.error(`Error rendering template ${templateName}:`, error);
            throw new Error(`Template rendering failed: ${error.message}`);
        }
    }

    /**
     * Send a single email (Transactional)
     */
    async sendEmail({ to, subject, template, data, type = "transactional" }) {
        try {
            const html = await this.renderTemplate(template, {
                ...data,
                subject,
            });

            // Dispatch to provider
            const log = await EmailLog.create({
                email: to,
                type,
                template,
                subject,
                status: "sent",
                provider: "brevo", // Changed from mailchimp
            });

            /*
            // MAILCHIMP TRANSACTIONAL (COMMENTED OUT)
            await mailchimpService.sendTransactional(to, subject, html);
            */

            // BREVO TRANSACTIONAL
            await brevoService.sendEmail(to, subject, html);

            return log;
        } catch (error) {
            console.error("EmailService.sendEmail Error:", error);
            await EmailLog.create({
                email: to,
                type,
                template,
                subject,
                status: "failed",
                errorMessage: error.message,
                provider: "brevo"
            });
            throw error;
        }
    }
}

module.exports = new EmailService();
