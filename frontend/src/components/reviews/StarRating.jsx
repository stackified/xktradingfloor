import React from 'react';
import { Star } from 'lucide-react';

// Read-only when there's no onChange: plain icons, tight spacing, one label for
// screen readers. Sahil (8 Oct): the stars on cards and in the sidebar sat too
// far apart, because every display star was a 28px button.
function StarRating({ value = 0, onChange, size = 18 }) {
  const [hover, setHover] = React.useState(0);
  const current = hover || value;

  if (!onChange) {
    const rounded = Math.round((Number(value) || 0) * 10) / 10;
    return (
      <div
        className="inline-flex items-center gap-0.5 text-blue-400"
        role="img"
        aria-label={`Rated ${rounded} out of 5`}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            style={{ width: size, height: size }}
            className={i + 1 <= current ? 'fill-blue-400' : ''}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        const filled = v <= current;
        return (
          <button
            key={v}
            type="button"
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(v)}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-blue-400"
            aria-label={`Rate ${v}`}
          >
            <Star style={{ width: size, height: size }} className={filled ? 'fill-blue-400' : ''} />
          </button>
        );
      })}
    </div>
  );
}

export default StarRating;
