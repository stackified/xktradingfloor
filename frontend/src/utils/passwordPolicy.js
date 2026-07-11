export const PASSWORD_POLICY = { minLength: 8, maxLength: 128 };

export function validatePassword(password) {
  const errors = [];
  if (!password) return { valid: false, errors: ["Password is required."] };
  if (password.length < 8) errors.push("Password must be at least 8 characters.");
  if (password.length > 128) errors.push("Password must be no more than 128 characters.");
  if (!/[A-Z]/.test(password)) errors.push("Password must include at least one uppercase letter.");
  if (!/[a-z]/.test(password)) errors.push("Password must include at least one lowercase letter.");
  if (!/[0-9]/.test(password)) errors.push("Password must include at least one number.");
  return { valid: errors.length === 0, errors };
}

export function getPasswordRequirements(password = "") {
  return [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter", met: /[a-z]/.test(password) },
    { label: "One number", met: /[0-9]/.test(password) },
  ];
}
