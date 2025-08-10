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
            <path
              id="morphingBlob"
              fill="#fff"
              d="M500,150 C650,170 820,280 850,450 C880,620 770,770 630,820 C490,870 340,840 260,720 C180,600 170,460 220,340 C270,220 350,170 500,150 Z"
            >
              <animate
                attributeName="d"
                dur="84s"
                repeatCount="indefinite"
                values="
        M500,150 C650,170 820,280 850,450 C880,620 770,770 630,820 C490,870 340,840 260,720 C180,600 170,460 220,340 C270,220 350,170 500,150 Z;
        M520,140 C690,170 860,300 880,470 C900,650 770,820 600,860 C430,900 270,840 220,690 C170,540 200,420 260,320 C320,220 400,170 520,140 Z;
        M480,160 C620,140 780,260 840,420 C900,580 840,760 690,820 C540,880 360,860 260,740 C160,620 180,460 240,340 C300,220 360,180 480,160 Z;
        M500,150 C650,170 820,280 850,450 C880,620 770,770 630,820 C490,870 340,840 260,720 C180,600 170,460 220,340 C270,220 350,170 500,150 Z
      "
                calcMode="spline"
                keyTimes="0;0.33;0.66;1"
                keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1"
              />
            </path>
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
