import React from 'react';
import { Star } from 'lucide-react';

function StarRating({ value = 0, onChange, size = 18 }) {
  const [hover, setHover] = React.useState(0);
  const current = hover || value;
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const v = i + 1;
        const filled = v <= current;
        return (
          <button
            key={v}
            type="button"
            onMouseEnter={() => onChange && setHover(v)}
            onMouseLeave={() => onChange && setHover(0)}
            onClick={() => onChange && onChange(v)}
            className="text-blue-400"
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


