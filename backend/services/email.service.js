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
    /**
     * Send Welcome Email
     */
    async sendWelcomeEmail(to, name) {
        return this.sendEmail({
            to,
            subject: "Welcome to XK Trading Floor",
            template: "welcome.ejs",
            data: { name }
        });
    }

    /**
     * Send Verification Email
     */
    async sendVerificationEmail(to, verifyUrl) {
        return this.sendEmail({
            to,
            subject: "Verify Your Email - XK Trading Floor",
            template: "verifyEmail.ejs",
            data: { verifyUrl }
        });
    }

    /**
     * Send Password Reset Email
     */
    async sendPasswordResetEmail(to, resetUrl) {
        return this.sendEmail({
            to,
            subject: "Reset Your Password - XK Trading Floor",
            template: "resetPassword.ejs",
            data: { resetUrl }
        });
    }

    /**
     * Send Login Notification
     */
    async sendLoginNotification(to, { time, location }) {
        return this.sendEmail({
            to,
            subject: "New Login Detected - XK Trading Floor",
            template: "loginNotification.ejs",
            data: { time, location }
        });
    }

    /**
     * Send Security Alert
     */
    async sendSecurityAlert(to, data) {
        return this.sendEmail({
            to,
            subject: "Security Alert - XK Trading Floor",
            template: "securityAlert.ejs",
            data
        });
    }

    /**
     * Send Blog Notification
     */
    async sendBlogNotification(to, { articleUrl }) {
        return this.sendEmail({
            to,
            subject: "New Article Published - XK Trading Floor",
            template: "blogNotification.ejs",
            data: { articleUrl }
        });
    }

    /**
     * Send Podcast Notification
     */
    async sendPodcastNotification(to, { podcastUrl }) {
        return this.sendEmail({
            to,
            subject: "New Podcast Episode - XK Trading Floor",
            template: "podcastEpisode.ejs",
            data: { podcastUrl }
        });
    }

    /**
     * Send Event Notification
     */
    async sendEventNotification(to, { eventUrl }) {
        return this.sendEmail({
            to,
            subject: "New Event is Live - XK Trading Floor",
            template: "newEvent.ejs",
            data: { eventUrl }
        });
    }

    /**
     * Send Broker Review Notification
     */
    async sendBrokerReviewNotification(to, { reviewUrl }) {
        return this.sendEmail({
            to,
            subject: "Broker Review Published - XK Trading Floor",
            template: "brokerReview.ejs",
            data: { reviewUrl }
        });
    }
}

module.exports = new EmailService();
