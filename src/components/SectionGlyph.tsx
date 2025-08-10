import React from "react";

type Props = {
  variant: "about" | "services" | "impact";
  className?: string;
};

const SectionGlyph: React.FC<Props> = ({ variant, className }) => {
  if (variant === "about") {
    return (
      <svg viewBox="0 0 200 200" className={className} aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="4" opacity="0.35">
          <circle cx="100" cy="100" r="80" />
          <circle cx="100" cy="100" r="60" opacity="0.6" />
          <circle cx="100" cy="100" r="40" opacity="0.4" />
        </g>
      </svg>
    );
  }
  if (variant === "services") {
    return (
      <svg viewBox="0 0 220 200" className={className} aria-hidden>
        <g fill="none" stroke="currentColor" strokeWidth="4" opacity="0.35">
          <rect x="15" y="50" width="190" height="100" rx="24" />
          <path d="M60 80h100M60 110h100" opacity="0.6" />
          <path d="M30 150h60" opacity="0.35" />
        </g>
      </svg>
    );
  }
  // impact
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="6" opacity="0.35">
        <path d="M20 150l60-60 32 28 48-68" />
        <path d="M140 50h36v36" opacity="0.6" />
      </g>
    </svg>
  );
};

export default SectionGlyph;
