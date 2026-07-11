const PASSWORD_POLICY = {
    minLength: 8,
    maxLength: 128,
};

function validatePassword(password) {
    const errors = [];

    if (!password || typeof password !== "string") {
        return { valid: false, errors: ["Password is required."] };
    }
    if (password.length < PASSWORD_POLICY.minLength) {
        errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters.`);
    }
    if (password.length > PASSWORD_POLICY.maxLength) {
        errors.push(`Password must be no more than ${PASSWORD_POLICY.maxLength} characters.`);
    }
    if (!/[A-Z]/.test(password)) {
        errors.push("Password must include at least one uppercase letter.");
    }
    if (!/[a-z]/.test(password)) {
        errors.push("Password must include at least one lowercase letter.");
    }
    if (!/[0-9]/.test(password)) {
        errors.push("Password must include at least one number.");
    }

    return { valid: errors.length === 0, errors };
}

module.exports = { validatePassword };
