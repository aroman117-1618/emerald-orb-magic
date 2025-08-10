import React, { useEffect, useMemo, useRef, useState } from "react";

// Decorative, masked background video inspired by Morpho's intro orb
// - Uses SVG mask with a morphing blob (same silhouette as EmeraldOrb)
// - Applies brand-tinted overlay via mix-blend for a green palette
// - Handles autoplay hygiene, offscreen pause/resume, and reduced motion

const MorphoOrbVideo: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [canPlay, setCanPlay] = useState(false);

  const prefersReducedMotion = useMemo(() =>
    typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  []);

  useEffect(() => {
    if (!videoRef.current || prefersReducedMotion) return;

    const vid = videoRef.current;
    let observer: IntersectionObserver | null = null;

    const onIntersect: IntersectionObserverCallback = (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          // Attempt to play when visible
          const p = vid.play();
          if (p && typeof p.catch === "function") {
            p.catch(() => {});
          }
        } else {
          vid.pause();
        }
      }
    };

    observer = new IntersectionObserver(onIntersect, { root: null, threshold: 0.15 });
    observer.observe(vid);

    return () => {
      observer?.disconnect();
    };
  }, [prefersReducedMotion]);

  // If user prefers reduced motion, render only a soft vignette
  if (prefersReducedMotion) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_30%,hsl(var(--foreground)/0.1)_70%,hsl(var(--foreground)/0.16)_100%)]" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* SVG container with mask. We place the HTML video inside a foreignObject to clip it by the blob silhouette. */}
      <svg
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[140vw] sm:w-[110vw] md:w-[80vw] lg:w-[960px] aspect-square"
        viewBox="0 0 1000 1000"
        aria-hidden
      >
        <defs>
          {/* Multi-lobed blob silhouette mask (mirrors EmeraldOrb for continuity) */}
          <mask id="morphMask" x="0" y="0" width="1000" height="1000" maskUnits="userSpaceOnUse">
            <path
              id="morphingBlobVideo"
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
        </defs>

        {/* Masked group containing the video and the color overlay */}
        <g mask="url(#morphMask)">
          {/* Place HTML content via foreignObject, scaled to cover */}
          <foreignObject x="0" y="0" width="1000" height="1000">
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <video
                ref={videoRef}
                src="/video/morpho-intro-2k.mp4"
                muted
                playsInline
                loop
                preload="none"
                autoPlay={canPlay}
                onCanPlay={() => setCanPlay(true)}
                // Make sure it fully covers the mask area
                style={{ width: "140%", height: "140%", objectFit: "cover", position: "absolute", left: "-20%", top: "-20%" }}
              />

              {/* Brand colorization overlay using semantic tokens; screen blend for luminous green tint */}
              <div
                className="absolute inset-0 mix-blend-screen"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--brand)/0.60) 0%, hsl(var(--brand-glow)/0.70) 45%, hsl(var(--brand)/0.45) 100%)",
                }}
              />

              {/* Subtle grain via radial fade to help seat the orb */}
              <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_35%,hsl(var(--foreground)/0.06)_75%,hsl(var(--foreground)/0.12)_100%)]" />
            </div>
          </foreignObject>
        </g>
      </svg>

      {/* Global vignette to integrate with the page background */}
      <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_50%,transparent_30%,hsl(var(--foreground)/0.1)_70%,hsl(var(--foreground)/0.16)_100%)]" />
    </div>
  );
};

export default MorphoOrbVideo;
