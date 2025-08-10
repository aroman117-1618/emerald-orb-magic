import React, { useEffect, useMemo, useRef } from "react";

// Clean baseline: oversized video with a soft radial mask. No SVG morphing.
// - Overscans video to avoid edge seams
// - Uses radial CSS mask for soft falloff
// - Optional brand tint overlay (masked as well) without harsh blend edges
// - Plays/pauses based on viewport visibility and respects reduced motion

const VIDEO_SRC = "https://backend.morpho.org/uploads/2024/11/home-intro-web-2k-60-2.mp4";

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

  // Shared masked wrapper style (radial soft circle)
  const maskStyle: React.CSSProperties = {
    WebkitMaskImage:
      "radial-gradient(farthest-side, rgba(0,0,0,1) 65%, rgba(0,0,0,0.69) 82%, rgba(0,0,0,0.35) 92%, rgba(0,0,0,0) 100%)",
    maskImage:
      "radial-gradient(farthest-side, rgba(0,0,0,1) 65%, rgba(0,0,0,0.69) 82%, rgba(0,0,0,0.35) 92%, rgba(0,0,0,0) 100%)",
    isolation: "isolate",
    contain: "paint",
    transform: "translate(-50%, -50%) translateZ(0)",
  };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        ref={wrapperRef}
        className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 w-[160vw] sm:w-[120vw] md:w-[140vw] lg:w-[160vw]"
        style={maskStyle}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(75% 75% at 50% 50%, hsl(var(--brand-glow) / 0.35) 0%, transparent 70%)",
            }}
          />
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
            // Overscan to eliminate any hard video frame edges
            style={{
              width: "150%",
              height: "150%",
              objectFit: "cover",
              position: "absolute",
              left: "-25%",
              top: "-25%",
              filter: "hue-rotate(4deg) saturate(1.18) contrast(1.07)",
            }}
          />

          {/* Intensified emerald overlays */}
          <div
            className="absolute inset-0"
            style={{
              background: "hsl(var(--brand) / 0.80)",
              mixBlendMode: "color",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "hsl(var(--brand-glow) / 0.70)",
              mixBlendMode: "saturation",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(58% 58% at 45% 38%, hsl(var(--brand-glow) / 0.42) 0%, transparent 58%)",
              mixBlendMode: "soft-light",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(90% 90% at 50% 55%, hsl(var(--brand-deep) / 0.50) 50%, transparent 92%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MorphoOrbBaseline;
