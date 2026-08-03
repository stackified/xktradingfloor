/** Shared blog landing design tokens */
export const BLOG_CONTAINER = "max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8";

export const BLOG_COLORS = {
  bg: "#05070D",
  blue: "#3B82F6",
};

export const BLOG_SECTION_HEADING =
  "text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-white leading-[1.15] tracking-[-0.01em]";

export const BLOG_NAV_BTN =
  "h-12 w-12 rounded-full flex items-center justify-center transition-all duration-300 border border-[rgba(255,255,255,0.08)] bg-[rgba(11,17,32,0.65)] backdrop-blur-sm hover:bg-[#3B82F6] hover:border-[#3B82F6] group";

export const BLOG_LINK =
  "text-[15px] font-semibold text-[#3B82F6] hover:text-[#2563EB] transition-colors duration-300 whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] rounded-sm";

/**
 * Shared blog image sizing. Every blog image (card, cover, slider, skeleton)
 * must use the SAME 16:9 box so one upload is never cropped differently across
 * views. The box reserves layout space (fixes CLS); BLOG_IMAGE fills it.
 */
export const BLOG_IMAGE_BOX =
  "relative w-full aspect-[16/9] overflow-hidden bg-[#05070D]";

export const BLOG_IMAGE = "h-full w-full object-cover";
