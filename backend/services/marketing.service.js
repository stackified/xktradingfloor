// const mailchimpService = require("./mailchimp.service");
const brevoService = require("./brevo.service");
const emailService = require("./email.service");
const EmailCampaign = require("../models/EmailCampaign.model");
const EmailLog = require("../models/EmailLog.model");
const EmailDraft = require("../models/EmailDraft.model");

/**
 * Service for Marketing specific business logic
 */
class MarketingService {
    /**
     * Process bulk email from recipients list
     */
    async sendBulkEmail(recipients, subject, message, userId) {
        /*
        // MAILCHIMP IMPLEMENTATION (COMMENTED OUT)
        const listId = process.env.MAILCHIMP_AUDIENCE_ID;
        const successfulAdds = [];
        const failedAdds = [];

        // 1. Add/Update members in Mailchimp
        for (const recipient of recipients) {
            try {
                await mailchimpService.upsertMember(listId, recipient);
                successfulAdds.push(recipient.email);
            } catch (error) {
                console.error(`Failed to add ${recipient.email}:`, error);
                failedAdds.push({ email: recipient.email, error: error.detail || error.message });
            }
        }

        if (successfulAdds.length === 0) {
            throw new Error("No recipients were successfully added to Mailchimp.");
        }

        // 2. Create Segment
        const tagName = `Batch_${Date.now()}`;
        const segment = await mailchimpService.createSegment(listId, tagName, successfulAdds);

        // 3. Create Campaign
        const campaign = await mailchimpService.createCampaign(
            listId,
            segment.id,
            subject,
            process.env.MAILCHIMP_FROM_NAME || "XK Trading Floor",
            process.env.MAILCHIMP_FROM_EMAIL || "stackified01@gmail.com"
        );

        // 4. Set Content
        const renderedHtml = await emailService.renderTemplate("bulkTemplate.ejs", {
            subject,
            message,
            // platformUrl: process.env.FRONTEND_URL || "https://xktradingfloor.com"
        });

        await mailchimpService.setCampaignContent(campaign.id, renderedHtml);

        // 5. Send Campaign
        await mailchimpService.sendCampaign(campaign.id);

        // 6. Log Campaign in Database
        const emailCampaign = await EmailCampaign.create({
            subject,
            segmentName: tagName,
            mailchimpCampaignId: campaign.id,
            status: "sent",
            recipientsCount: successfulAdds.length,
            sentAt: new Date(),
            createdBy: userId,
        });

        return {
            campaign: emailCampaign,
            successfulCount: successfulAdds.length,
            failedAdds,
            tag_used: tagName,
        };
        */

        // BREVO IMPLEMENTATION
        try {
            // 1. Render Content
            const renderedHtml = await emailService.renderTemplate("bulkTemplate.ejs", {
                subject,
                message,
            });

            // 2. Send Bulk Email via Brevo
            const results = await brevoService.sendBulkEmail(recipients, subject, renderedHtml);

            const successfulAdds = results.filter(r => r.success).map(r => r.email);
            const failedAdds = results.filter(r => !r.success).map(r => ({ email: r.email, error: r.error }));

            // 3. Log Campaign in Database
            const emailCampaign = await EmailCampaign.create({
                subject,
                status: "sent",
                recipientsCount: successfulAdds.length,
                sentAt: new Date(),
                createdBy: userId,
                provider: "brevo" // Added provider info
            });

            return {
                campaign: emailCampaign,
                successfulCount: successfulAdds.length,
                failedAdds,
            };
        } catch (error) {
            console.error("MarketingService.sendBulkEmail Brevo Error:", error);
            throw error;
        }
    }

    /**
     * Save a draft marketing email
     */
    async saveDraft(subject, body, userId) {
        return await EmailDraft.create({
            subject,
            body,
            createdBy: userId,
        });
    }

    /**
     * Get campaign history
     */
    async getCampaignHistory() {
        return await EmailCampaign.find().sort({ createdAt: -1 }).populate("createdBy", "name email");
    }
}

module.exports = new MarketingService();
