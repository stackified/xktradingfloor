const mailchimp = require("@mailchimp/mailchimp_marketing");
const crypto = require("crypto");

mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
});

/**
 * Service to handle Mailchimp specific operations
 */
class MailchimpService {
    /**
     * Add or update a list member
     */
    async upsertMember(listId, recipient) {
        const subscriberHash = crypto
            .createHash("md5")
            .update(recipient.email.toLowerCase())
            .digest("hex");

        const mergeFields = {};
        if (recipient.name) {
            mergeFields.FNAME = recipient.name;
        }

        return await mailchimp.lists.setListMember(listId, subscriberHash, {
            email_address: recipient.email,
            status_if_new: "subscribed",
            status: "subscribed",
            merge_fields: mergeFields,
        });
    }

    /**
     * Create a segment for a specific batch of emails
     */
    async createSegment(listId, name, emails) {
        return await mailchimp.lists.createSegment(listId, {
            name: name,
            static_segment: emails,
        });
    }

    /**
     * Create a campaign
     */
    async createCampaign(listId, segmentId, subject, fromName, replyTo) {
        return await mailchimp.campaigns.create({
            type: "regular",
            recipients: {
                list_id: listId,
                segment_opts: {
                    saved_segment_id: segmentId,
                },
            },
            settings: {
                subject_line: subject,
                from_name: fromName,
                reply_to: replyTo,
            },
        });
    }

    /**
     * Set campaign content
     */
    async setCampaignContent(campaignId, html) {
        return await mailchimp.campaigns.setContent(campaignId, {
            html: html,
        });
    }

    /**
     * Send the campaign
     */
    async sendCampaign(campaignId) {
        return await mailchimp.campaigns.send(campaignId);
    }

    /**
     * Send transactional email (using Mailchimp Transactional / Mandrill if available)
     * For now, this is a placeholder or can use regular campaigns if that's the current setup.
     * Real transactional usually uses a different API.
     */
    async sendTransactional(to, subject, html) {
        // Placeholder: In a real enterprise app, you'd use Mailchimp Transactional (Mandrill)
        // or another provider like AWS SES.
        console.log(`Sending transactional email to ${to} with subject: ${subject}`);
        // implementation depends on whether Mandrill is set up
    }
}

module.exports = new MailchimpService();
