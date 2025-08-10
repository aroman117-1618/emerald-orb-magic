import React, { useEffect, useMemo, useRef } from "react";

// Clean baseline: oversized video with a soft radial mask. No SVG morphing.
// - Overscans video to avoid edge seams
// - Uses radial CSS mask for soft falloff
// - Optional brand tint overlay (masked as well) without harsh blend edges
// - Plays/pauses based on viewport visibility and respects reduced motion

const VIDEO_SRC = "https://backend.morpho.org/uploads/2024/11/home-intro-web-2k-60-2.mp4?v=2";

const MorphoOrbBaseline: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    const vid = videoRef.current;
    const wrapper = wrapperRef.current;
    if (!vid || !wrapper || prefersReducedMotion) return;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        const isIn = entry.isIntersecting;
        console.log("[MorphoOrb] intersecting:", isIn);
        if (isIn) {
          const p = vid.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          vid.pause();
        }
      }
    };

    const observer = new IntersectionObserver(onIntersect, { root: null, threshold: 0 });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [prefersReducedMotion]);

  // Reduced motion: only a subtle vignette to keep page calm
  if (prefersReducedMotion) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_30%,hsl(var(--foreground)/0.08)_70%,hsl(var(--foreground)/0.14)_100%)]" />
      </div>
    );
  }

  // Clip to a perfect circle (no mask) to avoid GPU sampling seams; feather is handled by a separate overlay
  const clipStyle: React.CSSProperties = {
    borderRadius: '9999px',
    overflow: 'hidden',
    clipPath: 'circle(50% at 50% 50%)',
    isolation: 'isolate',
    contain: 'paint',
    willChange: 'transform',
  };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        ref={wrapperRef}
        className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 w-[110vw] sm:w-[100vw] md:w-[110vw] lg:w-[120vw]"
        style={clipStyle}
      >
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            loop
            preload="auto"
            autoPlay
            onLoadedData={() => console.log('[MorphoOrb] loadeddata')}
            onPlay={() => console.log('[MorphoOrb] play')}
            onPause={() => console.log('[MorphoOrb] pause')}
            style={{
              width: '180%',
              height: '180%',
              objectFit: 'cover',
              position: 'absolute',
              left: '-40%',
              top: '-40%',
              transform: 'translateZ(0) scale(1.005)',
              backfaceVisibility: 'hidden',
              filter: 'hue-rotate(4deg) saturate(1.12) contrast(1.04)',
            }}
          />

          {/* Simple brand tint without blend-modes to avoid artifacts */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'hsl(var(--brand) / 0.14)' }}
          />

          {/* Edge feather: visually fade to page background near the boundary */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(75% 75% at 50% 50%, transparent 64%, hsl(var(--background) / 0.55) 82%, hsl(var(--background) / 0.95) 98%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MorphoOrbBaseline;
