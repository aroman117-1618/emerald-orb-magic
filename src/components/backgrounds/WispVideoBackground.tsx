import React, { useEffect, useRef, useState } from "react";

export type WispVideoBackgroundProps = {
  src?: string;
  poster?: string;
  playbackRate?: number;
  overlay?: boolean;
  opacity?: number; // 0..1 for subtlety control
};

/**
 * Fullscreen, fixed video background using public/wisp.mp4
 * - Autoplays muted, loops, plays inline
 * - Respects prefers-reduced-motion
 * - Optional gradient overlay for readability
 */
const WispVideoBackground: React.FC<WispVideoBackgroundProps> = ({
  src = "/wisp.mp4",
  poster = "/placeholder.svg",
  playbackRate = 1,
  overlay = true,
  opacity = 1,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    // Support older browsers
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = playbackRate;
    if (reducedMotion) {
      v.pause();
    } else {
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  }, [playbackRate, reducedMotion]);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden" aria-hidden="true" role="presentation">
      {!reducedMotion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          src={src}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{ opacity }}
        />
      )}
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      )}
    </div>
  );
};

export default WispVideoBackground;
