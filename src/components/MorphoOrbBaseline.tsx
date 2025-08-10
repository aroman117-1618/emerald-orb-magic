import React, { useEffect, useMemo, useRef, useState } from "react";

// Clean baseline: oversized video with a soft radial mask. No SVG morphing.
// - Overscans video to avoid edge seams
// - Uses radial CSS mask for soft falloff
// - Optional brand tint overlay (masked as well) without harsh blend edges
// - Plays/pauses based on viewport visibility and respects reduced motion

const VIDEO_SRC = "https://backend.morpho.org/uploads/2024/11/home-intro-web-2k-60-2.mp4";

const MorphoOrbBaseline: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canPlay, setCanPlay] = useState(false);

  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    if (!videoRef.current || prefersReducedMotion) return;
    const vid = videoRef.current;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const p = vid.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          vid.pause();
        }
      }
    };

    const observer = new IntersectionObserver(onIntersect, { root: null, threshold: 0.1 });
    observer.observe(vid);
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
      "radial-gradient(closest-side, rgba(0,0,0,1) 62%, rgba(0,0,0,0.7) 76%, rgba(0,0,0,0.35) 86%, rgba(0,0,0,0.0) 100%)",
    maskImage:
      "radial-gradient(closest-side, rgba(0,0,0,1) 62%, rgba(0,0,0,0.7) 76%, rgba(0,0,0,0.35) 86%, rgba(0,0,0,0.0) 100%)",
    isolation: "isolate",
  };

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div
        className="absolute left-1/2 top-1/2 aspect-square -translate-x-1/2 -translate-y-1/2 w-[140vw] sm:w-[110vw] md:w-[80vw] lg:w-[960px]"
        style={maskStyle}
      >
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <video
            ref={videoRef}
            src={VIDEO_SRC}
            muted
            playsInline
            loop
            preload="none"
            autoPlay={canPlay}
            onCanPlay={() => setCanPlay(true)}
            // Overscan to eliminate any hard video frame edges
            style={{
              width: "120%",
              height: "120%",
              objectFit: "cover",
              position: "absolute",
              left: "-10%",
              top: "-10%",
              filter: "saturate(1.06) contrast(1.01)",
            }}
          />

          {/* Color + depth overlays to match emerald palette while preserving detail */}
          <div
            className="absolute inset-0"
            style={{
              background: "hsl(var(--brand) / 0.30)",
              mixBlendMode: "color",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 60% at 45% 38%, hsl(var(--brand-glow) / 0.32) 0%, transparent 56%), linear-gradient(135deg, hsl(var(--brand) / 0.24) 0%, hsl(var(--brand-glow) / 0.26) 46%, hsl(var(--brand) / 0.22) 100%)",
              mixBlendMode: "soft-light",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background: "radial-gradient(85% 85% at 50% 55%, hsl(var(--brand-deep) / 0.35) 55%, transparent 90%)",
              mixBlendMode: "multiply",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MorphoOrbBaseline;
