import React from "react";

const EmeraldOrb: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] sm:w-[90vw] md:w-[70vw] lg:w-[880px] aspect-square rounded-full bg-[radial-gradient(40%_40%_at_35%_30%,hsl(var(--brand-glow))_0%,transparent_45%),radial-gradient(55%_55%_at_65%_70%,hsl(var(--brand))_0%,transparent_50%),conic-gradient(from_210deg_at_50%_50%,hsl(var(--brand-accent)/0.25),transparent_20%,hsl(var(--brand-glow)/0.2)_40%,transparent_70%,hsl(var(--brand-accent)/0.25)_100%)] blur-[32px] opacity-95 animate-orb-drift motion-reduce:animate-none will-change-transform"
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] sm:w-[90vw] md:w-[70vw] lg:w-[880px] aspect-square rounded-full orb-noise animate-orb-breathe animate-orb-flow"
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_30%,hsl(var(--foreground)/0.1)_70%,hsl(var(--foreground)/0.18)_100%)]" />
    </div>
  );
};

export default EmeraldOrb;
