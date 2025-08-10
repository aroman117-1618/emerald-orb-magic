import React from "react";

const EmeraldOrb: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Central SVG-driven blob with masked silhouette and layered fills */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] sm:w-[110vw] md:w-[80vw] lg:w-[960px] aspect-square"
        viewBox="0 0 1000 1000"
        aria-hidden
        style={{ imageRendering: "pixelated" }}
      >
        <defs>
          {/* Smooth morph filter (subtle drift) */}
          <filter id="morphFilter" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.0035" numOctaves="2" seed="7">
              <animate attributeName="baseFrequency" dur="36s" values="0.003;0.0045;0.0032;0.003" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="36">
              <animate attributeName="scale" dur="28s" values="24;40;28;36;24" repeatCount="indefinite" />
            </feDisplacementMap>
          </filter>

          {/* Digital pixelation and quantization */}
          <filter id="digitalPixel" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" filterRes="96 96">
            <feColorMatrix type="saturate" values="0.92"/>
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 0.22 0.44 0.66 0.88 1" />
              <feFuncG type="discrete" tableValues="0 0.22 0.44 0.66 0.88 1" />
              <feFuncB type="discrete" tableValues="0 0.22 0.44 0.66 0.88 1" />
              <feFuncA type="table" tableValues="0 1" />
            </feComponentTransfer>
          </filter>

          {/* Luminous fill with animated center */}
          <radialGradient id="blobGlow" cx="45%" cy="38%" r="70%">
            <animate attributeName="cx" dur="12s" values="45%;42%;48%;45%" repeatCount="indefinite" />
            <animate attributeName="cy" dur="11s" values="38%;42%;36%;38%" repeatCount="indefinite" />
            <stop offset="0%" stopColor="hsl(var(--brand-glow))" stopOpacity="0.95" />
            <stop offset="55%" stopColor="hsl(var(--brand))" stopOpacity="0.42" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>

          {/* Darker ink fill for depth */}
          <radialGradient id="blobInk" cx="65%" cy="72%" r="85%">
            <stop offset="0%" stopColor="hsl(var(--brand-accent))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="hsl(var(--brand-accent))" stopOpacity="0" />
          </radialGradient>

          {/* Multi-lobed blob silhouette mask */}
          <mask id="blobMask" x="0" y="0" width="1000" height="1000" maskUnits="userSpaceOnUse">
            <path
              id="morphingBlob"
              fill="#fff"
              d="M500,140 C620,110 780,220 840,350 C900,480 880,640 760,720 C640,800 470,860 340,780 C210,700 170,560 210,420 C250,280 360,180 500,140 Z"
            >
              <animate
                attributeName="d"
                dur="13s"
                repeatCount="indefinite"
                values="
        M500,130 C630,100 820,240 870,380 C910,500 840,690 710,760 C560,840 380,840 270,740 C180,660 180,500 240,380 C300,260 380,180 500,130 Z;
        M520,150 C700,110 860,260 900,420 C920,560 820,700 670,770 C520,840 380,820 290,720 C220,630 220,470 300,360 C380,250 440,180 520,150 Z;
        M480,150 C620,130 780,220 860,360 C930,500 860,700 680,780 C520,850 360,820 270,700 C200,600 200,460 260,340 C320,230 400,180 480,150 Z;
        M510,140 C680,120 840,260 890,420 C920,560 820,740 650,810 C500,870 360,820 280,700 C200,580 210,460 280,340 C350,220 420,170 510,140 Z;
        M495,160 C640,140 820,280 880,430 C920,580 840,730 700,800 C540,880 380,840 290,720 C210,610 220,470 300,360 C380,260 420,200 495,160 Z;
        M500,130 C630,100 820,240 870,380 C910,500 840,690 710,760 C560,840 380,840 270,740 C180,660 180,500 240,380 C300,260 380,180 500,130 Z
      "
                calcMode="spline"
                keyTimes="0;0.2;0.4;0.6;0.8;1"
                keySplines="0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1;0.25 0.1 0.25 1"
              />
            </path>
          </mask>
        
          {/* Pixel grid pattern for subtle digital texture */}
          <pattern id="bitGrid" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="translate(0 0)">
            <rect width="12" height="12" fill="transparent" />
            <rect x="0" y="0" width="1" height="1" fill="hsl(var(--foreground))" fillOpacity="0.10" shapeRendering="crispEdges"/>
            <rect x="6" y="2" width="1" height="1" fill="hsl(var(--foreground))" fillOpacity="0.07" shapeRendering="crispEdges"/>
            <rect x="3" y="8" width="1" height="1" fill="hsl(var(--foreground))" fillOpacity="0.06" shapeRendering="crispEdges"/>
            <rect x="10" y="10" width="1" height="1" fill="hsl(var(--foreground))" fillOpacity="0.05" shapeRendering="crispEdges"/>
            <animateTransform attributeName="patternTransform" type="translate" dur="9s" values="0 0; 6 -5; -4 6; 0 0" repeatCount="indefinite" />
          </pattern>

          {/* Subtle scanlines pattern */}
          <pattern id="scanLines" width="4" height="8" patternUnits="userSpaceOnUse" patternTransform="translate(0 0)">
            <rect width="4" height="8" fill="transparent"/>
            <rect x="0" y="0" width="4" height="1" fill="hsl(var(--foreground))" fillOpacity="0.05" shapeRendering="crispEdges"/>
            <animateTransform attributeName="patternTransform" type="translate" dur="6s" values="0 0; 0 4; 0 0" repeatCount="indefinite" />
          </pattern>
        </defs>

        {/* Layered content clipped by the blob silhouette */}
        <g mask="url(#blobMask)" filter="url(#digitalPixel)">
          {/* Core gradient field */}
          <rect x="0" y="0" width="1000" height="1000" fill="url(#blobGlow)" opacity="0.98" />

          {/* Depth ink */}
          <rect x="0" y="0" width="1000" height="1000" fill="url(#blobInk)" opacity="0.26">
            <animate attributeName="opacity" dur="7s" values="0.22;0.30;0.24;0.26" repeatCount="indefinite" />
          </rect>

          {/* Pixel grid breathing */}
          <rect x="0" y="0" width="1000" height="1000" fill="url(#bitGrid)" opacity="0.18" className="mix-blend-soft-light" />

          {/* Scanlines drift */}
          <rect x="0" y="0" width="1000" height="1000" fill="url(#scanLines)" opacity="0.10" />
        </g>

        {/* Micro glints (bytes) */}
        <g mask="url(#blobMask)">
          <rect x="420" y="520" width="6" height="6" fill="hsl(var(--foreground))" fillOpacity="0.16" shapeRendering="crispEdges">
            <animate attributeName="x" dur="8s" values="420;460;440;420" repeatCount="indefinite" />
            <animate attributeName="y" dur="9s" values="520;500;540;520" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" dur="4s" values="0.12;0.2;0.1;0.16" repeatCount="indefinite" />
          </rect>
          <rect x="560" y="460" width="5" height="5" fill="hsl(var(--foreground))" fillOpacity="0.14" shapeRendering="crispEdges">
            <animate attributeName="x" dur="10s" values="560;600;580;560" repeatCount="indefinite" />
            <animate attributeName="y" dur="7s" values="460;480;440;460" repeatCount="indefinite" />
            <animate attributeName="fill-opacity" dur="5s" values="0.1;0.22;0.08;0.14" repeatCount="indefinite" />
          </rect>
          <rect x="480" y="600" width="4" height="4" fill="hsl(var(--foreground))" fillOpacity="0.12" shapeRendering="crispEdges">
            <animate attributeName="x" dur="9s" values="480;520;500;480" repeatCount="indefinite" />
            <animate attributeName="y" dur="8s" values="600;580;620;600" repeatCount="indefinite" />
          </rect>
          <rect x="620" y="560" width="4" height="4" fill="hsl(var(--foreground))" fillOpacity="0.12" shapeRendering="crispEdges">
            <animate attributeName="x" dur="11s" values="620;640;600;620" repeatCount="indefinite" />
            <animate attributeName="y" dur="10s" values="560;540;580;560" repeatCount="indefinite" />
          </rect>
          <rect x="360" y="460" width="5" height="5" fill="hsl(var(--foreground))" fillOpacity="0.12" shapeRendering="crispEdges">
            <animate attributeName="x" dur="12s" values="360;380;340;360" repeatCount="indefinite" />
            <animate attributeName="y" dur="9s" values="460;440;480;460" repeatCount="indefinite" />
          </rect>
        </g>
      </svg>

      {/* Soft vignette to seat the orb */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_30%,hsl(var(--foreground)/0.1)_70%,hsl(var(--foreground)/0.16)_100%)]" />
    </div>
  );
};

export default EmeraldOrb;
