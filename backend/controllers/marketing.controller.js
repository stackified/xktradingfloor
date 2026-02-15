const mailchimp = require("@mailchimp/mailchimp_marketing");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const ejs = require("ejs");

// Configure Mailchimp
mailchimp.setConfig({
    apiKey: process.env.MAILCHIMP_API_KEY,
    server: process.env.MAILCHIMP_SERVER_PREFIX,
});

exports.sendBulkEmail = async (req, res) => {
    try {
        if (!req.files.file) {
            return res.status(400).json({ message: "Please upload an Excel file." });
        }

        const { subject, message } = req.body;
        if (!subject || !message) {
            return res
                .status(400)
                .json({ message: "Subject and Message are required." });
        }

        // 1. Read Excel file
        const workbook = xlsx.readFile(req.files.file[0].path);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        // Extract emails and names
        const recipients = data
            .map((row) => {
                const email = row.email || row.Email || row.EMAIL;
                const name = row.name || row.Name || row.NAME || row['First Name'] || row['First Name'];
                return { email, name };
            })
            .filter((recipient) => recipient.email);

        if (recipients.length === 0) {
            return res
                .status(400)
                .json({ message: "No valid email addresses found in the file." });
        }

        const listId = process.env.MAILCHIMP_AUDIENCE_ID;

        // 2. Add members to list
        const successfulAdds = [];
        const failedAdds = [];

        for (const recipient of recipients) {
            try {
                const subscriberHash = crypto
                    .createHash("md5")
                    .update(recipient.email.toLowerCase())
                    .digest("hex");

                const mergeFields = {};
                if (recipient.name) {
                    mergeFields.FNAME = recipient.name;
                }

                await mailchimp.lists.setListMember(listId, subscriberHash, {
                    email_address: recipient.email,
                    status_if_new: "subscribed",
                    status: "subscribed",
                    merge_fields: mergeFields
                });
                successfulAdds.push(recipient.email);
            } catch (error) {
                console.error(`Failed to add/update ${recipient.email}:`, error);
                failedAdds.push({ email: recipient.email, error: error.detail || error.message });
            }
        }

        if (successfulAdds.length === 0) {
            return res.status(500).json({ message: "Failed to add any recipients to Mailchimp.", failures: failedAdds });
        }


        // 3. Create Campaign
        const tagName = `Batch_${Date.now()}`;
        const segment = await mailchimp.lists.createSegment(listId, {
            name: tagName,
            static_segment: successfulAdds
        });

        const campaign = await mailchimp.campaigns.create({
            type: "regular",
            recipients: {
                list_id: listId,
                segment_opts: {
                    saved_segment_id: segment.id
                }
            },
            settings: {
                subject_line: subject,
                from_name: process.env.MAILCHIMP_FROM_NAME || "XK Trading Floor",
                reply_to: process.env.MAILCHIMP_FROM_EMAIL || "stackified01@gmail.com",
            },
        });

        // 4. Set Content using EJS
        let templateFile = "bulkTemplate.ejs";
        let templateData = {
            subject: subject,
            message: message,
            companyName: "XK Trading Floor",
        };

        const templatePath = path.join(__dirname, "../emails", templateFile);
        const renderedHtml = await ejs.renderFile(templatePath, templateData);

        await mailchimp.campaigns.setContent(campaign.id, {
            html: renderedHtml,
        });

        // 5. Send Campaign
        await mailchimp.campaigns.send(campaign.id);

        // Cleanup
        if (req.files.file && req.files.file[0]) {
            fs.unlinkSync(req.files.file[0].path);
        }

        res.status(200).json({
            message: "Campaign created and sent successfully.",
            total_uploaded: recipients.length,
            successful_adds: successfulAdds.length,
            failed_adds: failedAdds,
            tag_used: tagName
        });

    } catch (error) {
        console.error("Error in sendBulkEmail:", error);
        if (req.files && req.files.file && req.files.file[0] && fs.existsSync(req.files.file[0].path)) {
            fs.unlinkSync(req.files.file[0].path);
        }
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
};