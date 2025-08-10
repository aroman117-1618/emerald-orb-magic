import React from "react";

const EmeraldOrb: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Central SVG-driven blob with masked silhouette and layered fills */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] sm:w-[110vw] md:w-[80vw] lg:w-[960px] aspect-square"
        viewBox="0 0 1000 1000"
        aria-hidden
      >
        <defs>
          {/* Smooth morph filter (no seed jitter, gentle frequency + scale) */}
          <filter id="morphFilter" x="0" y="0" width="1000" height="1000" filterUnits="userSpaceOnUse">
            <feTurbulence type="fractalNoise" baseFrequency="0.0025" numOctaves="2" seed="4">
              <animate attributeName="baseFrequency" dur="80s" values="0.002;0.0035;0.002" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="32">
              <animate attributeName="scale" dur="90s" values="24;38;28;24" repeatCount="indefinite" />
            </feDisplacementMap>
          </filter>

          {/* Luminous fill */}
          <radialGradient id="blobGlow" cx="350" cy="320" r="520" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--brand-glow))" stopOpacity="0.9" />
            <stop offset="60%" stopColor="hsl(var(--brand))" stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Darker ink fill for depth */}
          <radialGradient id="blobInk" cx="650" cy="700" r="520" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="hsl(var(--brand-accent))" stopOpacity="0.35" />
            <stop offset="65%" stopColor="hsl(var(--brand-accent))" stopOpacity="0" />
          </radialGradient>

          {/* Blob silhouette mask (drifting circle distorted by morph filter) */}
          <mask id="blobMask" x="0" y="0" width="1000" height="1000" maskUnits="userSpaceOnUse">
            <g filter="url(#morphFilter)">
              <circle cx="520" cy="500" r="360" fill="#fff">
                <animate attributeName="cx" dur="61s" values="520;470;530;520" repeatCount="indefinite" />
                <animate attributeName="cy" dur="47s" values="500;540;460;500" repeatCount="indefinite" />
                <animate attributeName="r" dur="73s" values="360;330;390;360" repeatCount="indefinite" />
              </circle>
            </g>
          </mask>
        </defs>

        {/* Layered content clipped by the blob silhouette */}
        <g mask="url(#blobMask)">
          {/* Glow layer (screen-like) */}
          <g className="mix-blend-screen">
            <circle cx="500" cy="500" r="520" fill="url(#blobGlow)" opacity="0.95">
              <animate attributeName="cx" dur="61s" values="500;480;520;500" repeatCount="indefinite" />
              <animate attributeName="cy" dur="49s" values="500;520;480;500" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Ink/shadow layer (multiply) */}
          <g className="mix-blend-multiply">
            <circle cx="520" cy="520" r="520" fill="url(#blobInk)" opacity="0.28">
              <animate attributeName="cx" dur="53s" values="520;560;500;520" repeatCount="indefinite" />
              <animate attributeName="cy" dur="59s" values="520;480;540;520" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
      </svg>

      {/* Soft vignette to seat the orb */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_30%,hsl(var(--foreground)/0.1)_70%,hsl(var(--foreground)/0.16)_100%)]" />
    </div>
  );
};

export default EmeraldOrb;
