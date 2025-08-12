import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";

export type WispShaderBackgroundProps = {
  overlay?: boolean;
  opacity?: number; // 0..1
  speed?: number; // motion speed
  density?: number; // wisp thickness/intensity
  scale?: number; // noise scale
  contrast?: number; // contrast of wisps
  saturation?: number; // color saturation
  gamma?: number; // gamma correction
  dpr?: number | [number, number];
  // Optional color overrides; if omitted we'll read from CSS variables
  primaryHex?: string; // e.g. "#10B981"
  secondaryHex?: string; // e.g. "#22D3EE"
  backgroundHex?: string; // e.g. "#0B1020"
};

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl") ||
      // Some very old browsers
      (window as any).WebGLRenderingContext
    );
  } catch {
    return false;
  }
}

function hexToRgbNorm(hex: string): [number, number, number] {
  const c = hex.replace("#", "");
  const bigint = parseInt(c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r / 255, g / 255, b / 255];
}

function hslToRgbNorm(h: number, s: number, l: number): [number, number, number] {
  // h in [0..360], s/l in [0..1]
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hh = h / 60;
  const x = c * (1 - Math.abs((hh % 2) - 1));
  let r = 0, g = 0, b = 0;
  if (0 <= hh && hh < 1) [r, g, b] = [c, x, 0];
  else if (1 <= hh && hh < 2) [r, g, b] = [x, c, 0];
  else if (2 <= hh && hh < 3) [r, g, b] = [0, c, x];
  else if (3 <= hh && hh < 4) [r, g, b] = [0, x, c];
  else if (4 <= hh && hh < 5) [r, g, b] = [x, 0, c];
  else if (5 <= hh && hh < 6) [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  return [r + m, g + m, b + m];
}

function readDesignTokenHslToRgbNorm(tokenName: string, fallbackHex: string): [number, number, number] {
  // Expects CSS like: --primary: 161 94% 30%; used by tailwind as hsl(var(--primary))
  const root = document.documentElement;
  const raw = getComputedStyle(root).getPropertyValue(`--${tokenName}`).trim();
  if (raw) {
    // Try to parse patterns like "161 94% 30%" or "161, 94%, 30%"
    const cleaned = raw.replace(/%/g, "").replace(/,/g, " ").split(/\s+/).filter(Boolean);
    if (cleaned.length >= 3) {
      const h = parseFloat(cleaned[0]);
      const s = parseFloat(cleaned[1]) / 100;
      const l = parseFloat(cleaned[2]) / 100;
      if (!Number.isNaN(h) && !Number.isNaN(s) && !Number.isNaN(l)) {
        return hslToRgbNorm(h, s, l);
      }
    }
  }
  return hexToRgbNorm(fallbackHex);
}

const fragmentShader = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_bg;
uniform float u_density;
uniform float u_scale;
uniform float u_contrast;
uniform float u_saturation;
uniform float u_gamma;
uniform float u_opacity;

// Hash and noise utilities
float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(in vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  for(int i=0; i<5; i++){
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

vec3 sat(vec3 c, float s){
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  return mix(vec3(l), c, s);
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_resolution.xy; // 0..1
  // Keep aspect-correct flow by remapping to -1..1 with aspect ratio
  vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

  // Domain-warped fbm to create wispy flows
  float t = u_time * 0.15;
  float sc = u_scale * 1.5;
  vec2 q = vec2(fbm(p * sc + t), fbm(p * sc - t));
  vec2 r = vec2(
    fbm(p * sc * 1.75 + q + 1.2 * t),
    fbm(p * sc * 1.75 + q - 1.2 * t)
  );

  float mask = fbm(p * sc * 2.0 + r * 2.0);
  mask = pow(smoothstep(0.2, 0.9, mask), u_contrast) * u_density;

  // Subtle color variation across UV
  float hueMix = smoothstep(0.0, 1.0, uv.y + 0.15 * fbm(uv * 3.0 + t));
  vec3 wispColor = mix(u_color1, u_color2, hueMix);

  // Blend wisps over background
  vec3 col = mix(u_bg, wispColor, clamp(mask, 0.0, 1.0));
  col = sat(col, u_saturation);
  col = pow(col, vec3(u_gamma));

  gl_FragColor = vec4(col, u_opacity);
}
`;

function WispPlane({
  reducedMotion,
  speed,
  density,
  scale,
  contrast,
  saturation,
  gamma,
  opacity,
  color1,
  color2,
  bg,
}: {
  reducedMotion: boolean;
  speed: number;
  density: number;
  scale: number;
  contrast: number;
  saturation: number;
  gamma: number;
  opacity: number;
  color1: [number, number, number];
  color2: [number, number, number];
  bg: [number, number, number];
}) {
  const materialRef = useRef<any>(null);
  const { size, viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: [size.width, size.height] },
      u_color1: { value: color1 },
      u_color2: { value: color2 },
      u_bg: { value: bg },
      u_density: { value: density },
      u_scale: { value: scale },
      u_contrast: { value: contrast },
      u_saturation: { value: saturation },
      u_gamma: { value: gamma },
      u_opacity: { value: opacity },
    }),
    [size.width, size.height, color1, color2, bg, density, scale, contrast, saturation, gamma, opacity]
  );

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_resolution.value = [size.width, size.height];
    }
  }, [size.width, size.height]);

  useFrame((_, delta) => {
    if (!materialRef.current) return;
    if (!reducedMotion) {
      materialRef.current.uniforms.u_time.value += delta * speed;
    }
  });

  // Fullscreen plane sized to viewport
  const planeScale = [viewport.width, viewport.height, 1];

  return (
    <mesh scale={planeScale} position={[0, 0, 0]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      {/* @ts-ignore */}
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        fragmentShader={fragmentShader}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

const WispShaderBackground: React.FC<WispShaderBackgroundProps> = ({
  overlay = true,
  opacity = 1,
  speed = 0.6,
  density = 0.7,
  scale = 1.1,
  contrast = 1.15,
  saturation = 0.95,
  gamma = 1.05,
  dpr = [1, 2],
  primaryHex,
  secondaryHex,
  backgroundHex,
}) => {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setWebgl(supportsWebGL());
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  // Colors from design tokens if available, fallback to emerald/cyan/deep-navy
  const c1 = useMemo(() => {
    if (primaryHex) return hexToRgbNorm(primaryHex);
    try {
      return readDesignTokenHslToRgbNorm("primary", "#10B981");
    } catch {
      return hexToRgbNorm("#10B981");
    }
  }, [primaryHex]);
  const c2 = useMemo(() => {
    if (secondaryHex) return hexToRgbNorm(secondaryHex);
    try {
      return readDesignTokenHslToRgbNorm("secondary", "#22D3EE");
    } catch {
      return hexToRgbNorm("#22D3EE");
    }
  }, [secondaryHex]);
  const cbg = useMemo(() => {
    if (backgroundHex) return hexToRgbNorm(backgroundHex);
    try {
      // Use background token if available, fallback to a deep navy that works in dark mode
      return readDesignTokenHslToRgbNorm("background", "#0B1020");
    } catch {
      return hexToRgbNorm("#0B1020");
    }
  }, [backgroundHex]);

  if (!webgl) {
    // Graceful fallback: static gradient background using semantic tokens
    return (
      <div className="fixed inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10" aria-hidden>
      <Canvas
        dpr={dpr as any}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        orthographic
        camera={{ position: [0, 0, 1], zoom: 100 }}
      >
        <OrthographicCamera makeDefault position={[0, 0, 1]} />
        <WispPlane
          reducedMotion={reducedMotion}
          speed={speed}
          density={density}
          scale={scale}
          contrast={contrast}
          saturation={saturation}
          gamma={gamma}
          opacity={opacity}
          color1={c1}
          color2={c2}
          bg={cbg}
        />
      </Canvas>
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
      )}
    </div>
  );
};

export default WispShaderBackground;
