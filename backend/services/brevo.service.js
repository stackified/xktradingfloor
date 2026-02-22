const { BrevoClient } = require("@getbrevo/brevo");

/**
 * Service to handle Brevo operations
 */
class BrevoService {
    constructor() {
        console.log("BREVO KEY:", process.env.BREVO_API_KEY);
        if (!process.env.BREVO_API_KEY) {
            throw new Error("BREVO_API_KEY is not set in environment variables.");
        }

        this.client = new BrevoClient({
            apiKey: process.env.BREVO_API_KEY,
        });

        // Access APIs from client
        this.transactionalApi = this.client.transactionalEmails;
        this.contactsApi = this.client.contacts;
    }

    /**
     * Send transactional email
     */
    async sendEmail(to, subject, html) {
        try {
            const response = await this.transactionalApi.sendTransacEmail({
                sender: {
                    name: process.env.BREVO_FROM_NAME || "XK Trading Floor",
                    email: process.env.BREVO_FROM_EMAIL || "info@xktradingfloor.com",
                },
                to: [{ email: to }],
                subject,
                htmlContent: html,
            });

            console.log("Brevo Email Sent:", response);
            return response;
        } catch (error) {
            console.error("Brevo Email Error:", error);
            throw error;
        }
    }

    /**
     * Create or update contact
     */
    async upsertContact(email, attributes = {}) {
        try {
            const response = await this.contactsApi.createContact({
                email,
                attributes,
                updateEnabled: true,
            });

            console.log("Brevo Contact Upserted:", response);
            return response;
        } catch (error) {
            console.error("Brevo Contact Error:", error);
            throw error;
        }
    }

    /**
     * Bulk email (simple loop)
     */
    async sendBulkEmail(recipients, subject, html) {
        const results = [];

        for (const recipient of recipients) {
            try {
                const res = await this.sendEmail(recipient.email, subject, html);

                results.push({
                    email: recipient.email,
                    success: true,
                });
            } catch (error) {
                results.push({
                    email: recipient.email,
                    success: false,
                    error: error.message,
                });
            }
        }

        return results;
    }
}

module.exports = new BrevoService();