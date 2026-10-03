import React from "react";
import { trackEvent } from "../../utils/analytics.js";

// The XK Trading Floor community invite. One place, so every button on the
// site points at the same server.
export const DISCORD_URL = "https://discord.gg/c2rtKXU56s";

// A plain link to the Discord invite, opened in a new tab. Joining used to
// require an XK login first (DiscordAuthGate); the client asked on 2 Oct 2026
// for every Discord button to open the invite directly, to make joining the
// community as easy as possible.
function DiscordLink({ href = DISCORD_URL, className, children, onClick, ...rest }) {
  const handleClick = (e) => {
    trackEvent("discord_click", { page: window.location.pathname });
    onClick?.(e);
  };
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  );
}

export default DiscordLink;
