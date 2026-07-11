import React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { getPasswordRequirements } from "../../utils/passwordPolicy.js";

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const requirements = getPasswordRequirements(password);
  const metCount = requirements.filter((item) => item.met).length;

  return (
    <ul className="space-y-1.5">
      {requirements.map((requirement) => (
        <li
          key={requirement.label}
          className={`flex items-center gap-2 text-xs ${
            requirement.met ? "text-green-400" : "text-gray-500"
          }`}
        >
          {requirement.met ? (
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <Circle className="h-3.5 w-3.5 flex-shrink-0" />
          )}
          <span>{requirement.label}</span>
        </li>
      ))}
      <li className="text-xs text-gray-400 pt-1">
        {metCount}/{requirements.length} requirements met
      </li>
    </ul>
  );
}
