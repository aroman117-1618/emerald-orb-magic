import React from "react";

const EmeraldOrb: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] sm:w-[60vw] md:w-[48vw] lg:w-[640px] aspect-square rounded-full bg-[radial-gradient(50%_50%_at_30%_30%,hsl(var(--brand-glow))_0%,transparent_60%),radial-gradient(50%_50%_at_70%_70%,hsl(var(--brand))_0%,transparent_55%)] blur-3xl opacity-70 animate-orb-drift motion-reduce:animate-none will-change-transform"
      />
    </div>
  );
};

export default EmeraldOrb;
