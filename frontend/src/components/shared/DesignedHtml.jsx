import React from "react";
import { renderDesignedHtml } from "../../utils/designedHtml.js";

// Renders stored "designed HTML" (see utils/designedHtml.js) with its own
// styling, isolated from the rest of the site. Pass either the stored string
// as `content`, or an already-computed `rendered` result (pages that also
// need the headings compute it once and share it).
function DesignedHtml({ content, rendered, className = "" }) {
  const result = React.useMemo(
    () => rendered || renderDesignedHtml(content),
    [content, rendered]
  );
  if (!result.html) return null;

  // Layout classes go on an outer box: the scoped root itself is reset with
  // `all: revert`, which would cancel utility classes placed on it.
  return (
    <div className={className}>
      {result.fonts.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style>{result.css}</style>
      <div className={result.scopeClass} dangerouslySetInnerHTML={{ __html: result.html }} />
    </div>
  );
}

export default DesignedHtml;
