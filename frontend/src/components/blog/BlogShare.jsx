import React from "react";
import { Link2, Check, Linkedin, Twitter, Facebook, MessageCircle } from "lucide-react";

const BTN =
  "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] " +
  "text-[#94A3B8] transition-all duration-200 hover:border-[#3B82F6] hover:bg-[#3B82F6]/10 hover:text-white " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]";

// Share links for the current article. Uses the page URL without its hash so
// a link copied while reading a section still points at the article.
function BlogShare({ title = "" }) {
  const [copied, setCopied] = React.useState(false);
  const url = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const links = [
    { label: "Share on X", icon: Twitter, href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { label: "Share on LinkedIn", icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { label: "Share on Facebook", icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { label: "Share on WhatsApp", icon: MessageCircle, href: `https://wa.me/?text=${t}%20${u}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2" aria-label="Share this article">
      {links.map(({ label, icon: Icon, href }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className={BTN} aria-label={label} title={label}>
          <Icon className="h-4 w-4" />
        </a>
      ))}
      <button
        type="button"
        onClick={copy}
        className={`${BTN} ${copied ? "border-emerald-500/60 text-emerald-400" : ""}`}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
      >
        {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

export default BlogShare;
