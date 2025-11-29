import React from "react";
import { X } from "lucide-react";

function ChipInput({ value, onChange, placeholder = "Type and press comma to add...", label }) {
  const [inputValue, setInputValue] = React.useState("");
  const chips = Array.isArray(value) ? value : [];

  const handleKeyDown = (e) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const trimmed = inputValue.trim();
      if (trimmed && !chips.includes(trimmed)) {
        onChange([...chips, trimmed]);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && inputValue === "" && chips.length > 0) {
      // Remove last chip on backspace when input is empty
      onChange(chips.slice(0, -1));
    }
  };

  const handleRemove = (index) => {
    onChange(chips.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-300">{label}</label>
      )}
      <div className="input input-bordered w-full border-white/10 bg-gray-950/40 text-white placeholder:text-gray-500 min-h-[3rem] flex flex-wrap items-center gap-2 p-2">
        {chips.map((chip, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/20 text-blue-300 text-sm border border-blue-500/30"
          >
            {chip}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="hover:bg-blue-500/30 rounded p-0.5 transition-colors"
              aria-label={`Remove ${chip}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={chips.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-white placeholder:text-gray-500"
        />
      </div>
      {chips.length > 0 && (
        <p className="text-xs text-gray-400">
          {chips.length} {chips.length === 1 ? "item" : "items"} added
        </p>
      )}
    </div>
  );
}

export default ChipInput;

