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
                dur="22s"
                repeatCount="indefinite"
                values="
        M500,140 C680,170 880,300 900,480 C920,660 760,820 600,860 C430,900 270,840 220,690 C170,540 210,380 280,300 C350,220 420,160 500,140 Z;
        M520,150 C710,180 870,320 880,490 C890,660 740,820 560,850 C380,880 260,820 230,660 C200,500 230,380 300,300 C370,220 450,170 520,150 Z;
        M480,150 C640,130 820,260 870,430 C920,600 840,780 680,830 C520,880 360,860 270,740 C180,620 190,460 250,340 C310,220 380,170 480,150 Z;
        M500,160 C680,180 860,300 880,460 C900,620 780,780 650,830 C520,880 360,840 280,720 C200,600 180,480 240,360 C300,240 360,180 500,160 Z;
        M510,130 C700,160 900,300 910,490 C920,680 760,860 560,890 C360,920 240,820 210,650 C180,480 230,360 320,280 C410,200 450,150 510,130 Z;
        M500,140 C680,170 880,300 900,480 C920,660 760,820 600,860 C430,900 270,840 220,690 C170,540 210,380 280,300 C350,220 420,160 500,140 Z
      "
                calcMode="spline"
                keyTimes="0;0.2;0.4;0.6;0.8;1"
                keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1"
              />
            </path>
          </mask>
        
          {/* Quantization filter for subtle posterization/pixel breath */}
          <filter id="quantize" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feColorMatrix type="saturate" values="0.9"/>
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
              <feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
              <feFuncB type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
              <feFuncA type="table" tableValues="0 1" />
            </feComponentTransfer>
          </filter>

          {/* Pixel grid pattern for subtle digital texture */}
          <pattern id="pixelGrid" width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="transparent" />
            <rect x="0" y="0" width="1" height="1" fill="hsl(var(--foreground))" fillOpacity="0.12" shapeRendering="crispEdges"/>
            <rect x="4" y="4" width="1" height="1" fill="hsl(var(--foreground))" fillOpacity="0.07" shapeRendering="crispEdges"/>
          </pattern>
        </defs>

        {/* Layered content clipped by the blob silhouette */}
        <g mask="url(#blobMask)" filter="url(#quantize)">
          {/* Glow layer (screen-like) */}
          <g className="mix-blend-screen">
            <circle cx="500" cy="500" r="520" fill="url(#blobGlow)" opacity="0.95">
              <animate attributeName="cx" dur="19s" values="500;460;540;500" repeatCount="indefinite" />
              <animate attributeName="cy" dur="17s" values="500;540;460;500" repeatCount="indefinite" />
            </circle>
          </g>

          {/* Ink/shadow layer (multiply) */}
          <g className="mix-blend-multiply">
            <circle cx="520" cy="520" r="520" fill="url(#blobInk)" opacity="0.28">
              <animate attributeName="cx" dur="21s" values="520;580;480;520" repeatCount="indefinite" />
              <animate attributeName="cy" dur="23s" values="520;480;560;520" repeatCount="indefinite" />
            </circle>
          </g>
        </g>
        {/* Subtle pixel-grid overlay inside the silhouette for a 'digital breath' texture */}
        <g mask="url(#blobMask)" className="mix-blend-soft-light">
          <rect x="0" y="0" width="1000" height="1000" fill="url(#pixelGrid)" opacity="0.10" shapeRendering="crispEdges">
            <animateTransform attributeName="transform" type="translate" dur="18s" values="0 0; 6 -8; -5 7; 0 0" repeatCount="indefinite" />
          </rect>
        </g>
      </svg>

      {/* Soft vignette to seat the orb */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_30%,hsl(var(--foreground)/0.1)_70%,hsl(var(--foreground)/0.16)_100%)]" />
    </div>
  );
};

export default EmeraldOrb;
