const marketingService = require("../services/marketing.service");
const xlsx = require("xlsx");
const fs = require("fs");

/**
 * Controller for Marketing operations
 */
exports.sendBulkEmail = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ message: "Please upload an Excel file." });
        }

        const { subject, message } = req.body;
        if (!subject || !message) {
            return res.status(400).json({ message: "Subject and Message are required." });
        }

        // Read Excel file
        const workbook = xlsx.readFile(req.files.file[0].path);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const recipients = data
            .map((row) => {
                const email = row.email || row.Email || row.EMAIL;
                const name = row.name || row.Name || row.NAME || row["First Name"];
                return { email, name };
            })
            .filter((r) => r.email);

        if (recipients.length === 0) {
            return res.status(400).json({ message: "No valid email addresses found." });
        }

        // Call service
        const result = await marketingService.sendBulkEmail(
            recipients,
            subject,
            message,
            req.user ? req.user._id : null
        );

        // Cleanup file
        if (fs.existsSync(req.files.file[0].path)) {
            fs.unlinkSync(req.files.file[0].path);
        }

        res.status(200).json({
            message: "Campaign sent successfully.",
            ...result,
        });
    } catch (error) {
        console.error("MarketingController.sendBulkEmail Error:", error);
        // Cleanup on error
        if (req.files && req.files.file && req.files.file[0] && fs.existsSync(req.files.file[0].path)) {
            fs.unlinkSync(req.files.file[0].path);
        }
        res.status(500).json({ message: "Failed to send campaign.", error: error.message });
    }
};

exports.getCampaignHistory = async (req, res) => {
    try {
        const history = await marketingService.getCampaignHistory();
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch history.", error: error.message });
    }
};

exports.saveDraft = async (req, res) => {
    try {
        const { subject, body } = req.body;
        const draft = await marketingService.saveDraft(subject, body, req.user ? req.user._id : null);
        res.status(201).json({ message: "Draft saved.", draft });
    } catch (error) {
        res.status(500).json({ message: "Failed to save draft.", error: error.message });
    }
};