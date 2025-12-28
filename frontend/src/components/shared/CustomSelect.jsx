import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

/**
 * CustomSelect Component
 * A premium, animated dropdown component to replace native select elements.
 * 
 * @param {Object} props
 * @param {string} props.value - The currently selected value
 * @param {function} props.onChange - Callback function(value) when selection changes
 * @param {Array<string|Object>} props.options - Array of options. Can be strings or objects {label, value}
 * @param {string} props.label - Optional label text
 * @param {string} props.placeholder - Placeholder text when no value is selected
 * @param {string} props.className - Additional CSS classes
 */
/**
 * CustomSelect Component
 * A premium, animated dropdown component to replace native select elements.
 * 
 * @param {Object} props
 * @param {string} props.value - The currently selected value
 * @param {function} props.onChange - Callback function(value) when selection changes
 * @param {Array<string|Object>} props.options - Array of options. Can be strings or objects {label, value}
 * @param {string} props.label - Optional label text
 * @param {string} props.placeholder - Placeholder text when no value is selected
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.icon - Optional icon component to display
 */
function CustomSelect({
    value,
    onChange,
    options = [],
    label,
    placeholder = "Select an option",
    className = "",
    error,
    disabled = false,
    icon: Icon,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        // If the value is not in options, but options are loaded, and there is a "default" option (like empty string value),
        // we might not need to force update here, but it explains why "Select an option" might appear.
        // It's purely render time logic.
    }, [value, options]);

    const handleSelect = (option) => {
        // Handle both string options and object options
        const selectedValue = typeof option === "object" ? option.value : option;

        // Create a synthetic event object to mimic native select behavior if needed, 
        // or just pass the value directly. ideally components should handle the value.
        // For compatibility with the form handler in Contact.jsx which expects e.target.value:
        const syntheticEvent = {
            target: { value: selectedValue }
        };

        onChange(syntheticEvent);
        setIsOpen(false);
    };

    // Helper to get display label
    const getDisplayLabel = (val) => {
        if (val === "" || val === null || val === undefined) {
            // Check if there is an option that explicitly represents empty string
            const emptyOpt = options.find(opt => (typeof opt === 'object' ? opt.value === val : opt === val));
            if (emptyOpt) return typeof emptyOpt === 'object' ? emptyOpt.label : emptyOpt;
            return placeholder;
        }

        const found = options.find(opt => (typeof opt === 'object' ? opt.value === val : opt === val));
        if (!found) return val;
        return typeof found === 'object' ? found.label : found;
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-sm font-medium text-gray-300 mb-2">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`w-full relative flex items-center justify-between py-3 text-left 
            bg-gray-800/50 border ${error ? 'border-red-500/50' : 'border-gray-700'} 
            rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 
            transition-all duration-200 hover:bg-gray-800/80
            ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-gray-800/50' : 'cursor-pointer'}
            ${Icon ? 'pl-10 pr-3' : 'px-3'}
        `}
            >
                {Icon && (
                    <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                )}
                <span className={`block truncate ${!value && value !== 0 ? "text-gray-400" : ""}`}>
                    {getDisplayLabel(value)}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ml-2 ${isOpen ? "rotate-180" : ""
                        }`}
                />
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        className="absolute z-50 mt-2 w-full bg-gray-900/95 backdrop-blur-xl border border-gray-800 rounded-lg shadow-xl overflow-hidden"
                    >
                        <div className="max-h-60 overflow-auto py-1 scrollbar-hide">
                            {options.map((option, index) => {
                                const optValue = typeof option === "object" ? option.value : option;
                                const optLabel = typeof option === "object" ? option.label : option;
                                const isSelected = optValue === value;

                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors duration-150
                      ${isSelected
                                                ? "bg-blue-600/20 text-blue-400 font-medium"
                                                : "text-gray-300 hover:bg-white/5 hover:text-white"
                                            }
                    `}
                                    >
                                        {optLabel}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Error Message */}
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </div>
    );
}

export default CustomSelect;
