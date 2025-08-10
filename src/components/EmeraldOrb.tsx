import React from "react";

const EmeraldOrb: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] sm:w-[110vw] md:w-[80vw] lg:w-[960px] aspect-square rounded-full bg-[radial-gradient(40%_40%_at_35%_30%,hsl(var(--brand-glow))_0%,transparent_45%),radial-gradient(55%_55%_at_65%_70%,hsl(var(--brand))_0%,transparent_50%),conic-gradient(from_210deg_at_50%_50%,hsl(var(--brand-accent)/0.25),transparent_22%,hsl(var(--brand-glow)/0.24)_44%,transparent_74%,hsl(var(--brand-accent)/0.25)_100%)] blur-[18px] opacity-95 animate-orb-drift animate-orb-wander motion-reduce:animate-none will-change-transform"
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] sm:w-[110vw] md:w-[80vw] lg:w-[960px] aspect-square rounded-full orb-noise animate-orb-breathe animate-orb-flow animate-grain-shift animate-noise-wobble"
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vw] sm:w-[120vw] md:w-[90vw] lg:w-[1100px] aspect-square rounded-full opacity-35 mix-blend-screen blur-[14px] animate-orb-swirl bg-[conic-gradient(from_0deg_at_50%_50%,hsl(var(--brand-glow)/0.15)_0deg,transparent_120deg,hsl(var(--brand-accent)/0.12)_240deg,transparent_360deg)]"
      />
      <svg className="absolute inset-0 h-full w-full mix-blend-screen opacity-90" aria-hidden>
        <defs>
          <filter id="morph" x="-50%" y="-50%" width="200%" height="200%" filterUnits="objectBoundingBox">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="3" seed="5">
              <animate attributeName="baseFrequency" dur="40s" values="0.06;0.12;0.04;0.09;0.06" repeatCount="indefinite" />
              <animate attributeName="seed" dur="60s" values="5;9;7;11;5" repeatCount="indefinite" />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="1200">
              <animate attributeName="scale" dur="35s" values="800;1500;600;1200;800" repeatCount="indefinite" />
            </feDisplacementMap>
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 0.18 0.36 0.54 0.72 0.9 1" />
              <feFuncG type="discrete" tableValues="0 0.2 0.4 0.6 0.8 1" />
              <feFuncB type="discrete" tableValues="0 0.22 0.44 0.66 0.88 1" />
              <feFuncA type="table" tableValues="0 0.6 0.9 1" />
            </feComponentTransfer>
          </filter>
          <radialGradient id="g1">
            <stop offset="0%" stopColor="hsl(var(--brand-glow))" stopOpacity="0.9" />
            <stop offset="70%" stopColor="hsl(var(--brand))" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="g2">
            <stop offset="0%" stopColor="black" stopOpacity="0.6" />
            <stop offset="60%" stopColor="black" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g filter="url(#morph)">
          <circle cx="55%" cy="48%" r="38%" fill="url(#g1)">
            <animate attributeName="cx" dur="40s" values="55%;45%;58%;52%;55%" repeatCount="indefinite" />
            <animate attributeName="cy" dur="37s" values="48%;52%;42%;50%;48%" repeatCount="indefinite" />
            <animate attributeName="r" dur="42s" values="38%;32%;44%;36%;38%" repeatCount="indefinite" />
          </circle>
          <circle cx="48%" cy="54%" r="42%" className="mix-blend-multiply" fill="url(#g2)" opacity="0.8">
            <animate attributeName="cx" dur="52s" values="48%;60%;46%;50%;48%" repeatCount="indefinite" />
            <animate attributeName="cy" dur="49s" values="54%;46%;58%;50%;54%" repeatCount="indefinite" />
            <animate attributeName="r" dur="55s" values="42%;30%;50%;36%;42%" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
      <div className="absolute inset-0 orb-pixel-grid" />
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_28%,hsl(var(--foreground)/0.12)_70%,hsl(var(--foreground)/0.2)_100%)]" />
    </div>
  );
};

export default EmeraldOrb;
