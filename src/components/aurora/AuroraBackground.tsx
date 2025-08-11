import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";

// AuroraBackground
// - Fullscreen, fixed WebGL canvas rendering a procedurally animated aurora using a shader
// - Organic, non-repeating motion via domain-warped fbm and time warping
// - Interactivity: hover flow influence and click/tap pulses that radiate and blend naturally
// - Performance: single fullscreen quad, adaptive DPR
// - Accessibility: respects prefers-reduced-motion and falls back to static gradient if no WebGL

export type AuroraColors = {
  base?: string;   // deep emerald/green
  accent?: string; // teal/turquoise highlight
  cold?: string;   // icy blue for cool accents
};

export type AuroraBackgroundProps = {
  colors?: AuroraColors;
  intensity?: number;     // 0.0 - 2.0 overall brightness/contrast
  speed?: number;         // 0.2 - 2.0 base motion speed
  shimmer?: number;       // 0.0 - 1.0 subtle sparkle
  centerBias?: number;    // 0.0 - 2.0 strength of center glow bias
  pulseStrength?: number; // 0.2 - 2.0 click pulse brightness
  pulseDecay?: number;    // 0.2 - 2.0 click pulse fade rate
};

const DEFAULT_PROPS: Required<AuroraBackgroundProps> = {
  colors: {
    base: "#0b7a4b",   // deep emerald
    accent: "#1ec6a3", // turquoise
    cold: "#80d0ff",   // icy blue
  },
  intensity: 1.0,
  speed: 0.7,
  shimmer: 0.2,
  centerBias: 0.9,
  pulseStrength: 0.9,
  pulseDecay: 0.9,
};

// Utility: detect WebGL support
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

// Convert hex string to linear RGB vec3 (0-1)
function hexToRGB(hex?: string): [number, number, number] {
  if (!hex) return [0, 0, 0];
  const c = hex.replace("#", "");
  const bigint = parseInt(c.length === 3 ? c.split("").map((x) => x + x).join("") : c, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return [r, g, b];
}

// GLSL shaders
const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const MAX_PULSES = 6;

const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_pointer; // 0..1

  uniform float u_speed;
  uniform float u_intensity;
  uniform float u_shimmer;
  uniform float u_centerBias;

  uniform vec3 u_baseColor;
  uniform vec3 u_accentColor;
  uniform vec3 u_coldColor;

  uniform int u_pulseCount;
  uniform vec2 u_pulsePos[${MAX_PULSES}];
  uniform float u_pulseTime[${MAX_PULSES}];

  // Hash / Noise Utilities (iq style)
  float hash(vec2 p){
    p = fract(p*vec2(123.34, 345.45));
    p += dot(p, p+34.345);
    return fract(p.x*p.y);
  }
  float noise(vec2 p){
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f*f*(3.0 - 2.0*f);
    return mix(a, b, u.x) + (c - a)*u.y*(1.0 - u.x) + (d - b)*u.x*u.y;
  }

  mat2 m2 = mat2(1.6, 1.2, -1.2, 1.6);
  float fbm(vec2 p){
    float v = 0.0;
    float a = 0.5;
    for(int i=0;i<5;i++){
      v += a * noise(p);
      p = m2 * p;
      a *= 0.5;
    }
    return v;
  }

  vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d){
    return a + b*cos(6.28318*(c*t + d));
  }

  void main(){
    vec2 uv = vUv; // 0..1

    // Aspect-corrected coordinates around center
    vec2 res = u_resolution;
    float ar = res.x / res.y;
    vec2 p = (uv - 0.5) * vec2(ar, 1.0);

    // Breathing and slow drift
    float breath = 0.35 + 0.25 * sin(u_time * 0.3);
    float drift = 0.15 * sin(u_time * 0.07);

    // Pointer influence (slight pull towards pointer)
    vec2 pt = (u_pointer - 0.5) * vec2(ar, 1.0);
    vec2 influenceDir = normalize(pt - p + 1e-4);

    // Domain-warped fbm flow field
    float t = u_time * (0.25 + u_speed*0.75) * (0.8 + 0.2*sin(u_time*0.11));
    vec2 q = vec2(
      fbm(p*1.5 + vec2(0.0, t*0.15 + drift)),
      fbm(p*1.5 + vec2(5.2, -t*0.12 + drift))
    );
    vec2 r = vec2(
      fbm(p*2.3 + 4.0*q + vec2(1.7, 9.2)),
      fbm(p*2.3 + 4.0*q + vec2(8.3, 2.8))
    );

    // Flow direction biased to center and pointer
    vec2 centerDir = normalize(-p + 1e-4);
    vec2 flow = normalize(0.6*centerDir + 0.4*influenceDir);

    // Sample the field along flow for soft banding
    float bands = 0.0;
    float steps = 6.0;
    float amp = 0.6;
    vec2 sp = p;
    for(int i=0;i<12;i++){
      if(float(i) >= steps) break;
      float ff = fbm(sp + r*0.7 + flow*(t*0.08));
      bands += amp * smoothstep(0.35, 1.0, ff);
      sp += (r*0.25 + flow*0.08) * (1.0 + 0.5*sin(t*0.3 + float(i)));
      amp *= 0.7;
    }

    // Shimmer (high frequency)
    float spark = u_shimmer * (0.3 + 0.7*noise(p*10.0 + r*2.0 + t*0.5));

    // Center bias glow
    float cdist = length(p);
    float centerGlow = exp(-3.0 * cdist) * (0.6 + 0.4*breath) * u_centerBias;

    // Pulses from clicks
    float pulse = 0.0;
    for(int i=0;i<${MAX_PULSES}; i++){
      if(i >= u_pulseCount) break;
      vec2 pos = u_pulsePos[i];
      float age = max(0.0, u_time - u_pulseTime[i]);
      float r0 = 0.02 + age*0.35; // expanding radius
      float d = distance(uv, pos);
      float g = exp(-8.0 * pow(d/(r0+1e-4), 2.0)) * exp(-1.2*age);
      pulse += g;
    }

    float brightness = clamp(bands + centerGlow + pulse*0.9 + spark*0.5, 0.0, 1.6);
    brightness = pow(brightness, 1.0 + 0.5*(1.0/u_intensity - 1.0));

    // Color mapping
    vec3 col = mix(u_coldColor, u_baseColor, smoothstep(0.0, 1.0, brightness));
    col = mix(col, u_accentColor, smoothstep(0.6, 1.2, brightness));

    // Gentle vignette
    float vig = smoothstep(1.2, 0.2, length(p));
    col *= mix(0.85, 1.05, vig);

    // Final tone tweak
    col = 1.0 - exp(-col * 1.2);

    gl_FragColor = vec4(col, 1.0);
  }
`;

// React Three Fiber node rendering the shader on a full-screen quad
function AuroraQuad({
  uniforms,
}: {
  uniforms: {
    u_time: { value: number };
    u_resolution: { value: THREE.Vector2 };
    u_pointer: { value: THREE.Vector2 };
    u_speed: { value: number };
    u_intensity: { value: number };
    u_shimmer: { value: number };
    u_centerBias: { value: number };
    u_baseColor: { value: THREE.Vector3 };
    u_accentColor: { value: THREE.Vector3 };
    u_coldColor: { value: THREE.Vector3 };
    u_pulseCount: { value: number };
    u_pulsePos: { value: THREE.Vector2[] };
    u_pulseTime: { value: number[] };
  };
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  useFrame(({ clock, size }) => {
    matRef.current.uniforms.u_time.value = clock.getElapsedTime();
    matRef.current.uniforms.u_resolution.value.set(size.width, size.height);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2]} />
      
      <shaderMaterial
        ref={matRef}
        vertexShader={VERT}
        fragmentShader={FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export default function AuroraBackground(props: AuroraBackgroundProps = {}) {
  const cfg = { ...DEFAULT_PROPS, ...props, colors: { ...DEFAULT_PROPS.colors, ...(props.colors || {}) } };

  const prefersReducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  const webglSupported = useMemo(() => (typeof window !== "undefined" ? hasWebGL() : false), []);

  // Interactive state (stored in uniforms via refs)
  const pointer = useRef(new THREE.Vector2(0.5, 0.5));
  const pulsePos = useRef<THREE.Vector2[]>(Array(MAX_PULSES).fill(0).map(() => new THREE.Vector2(0.5, 0.5)));
  const pulseTime = useRef<number[]>(new Array(MAX_PULSES).fill(-1000)); // negative ages => inactive
  const pulseCount = useRef(0);

  // Colors as linear RGB vectors
  const base = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.base)), [cfg.colors.base]);
  const accent = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.accent)), [cfg.colors.accent]);
  const cold = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.cold)), [cfg.colors.cold]);

  // Uniform objects kept stable between renders
  const uniforms = useRef({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(1, 1) },
    u_pointer: { value: pointer.current },
    u_speed: { value: cfg.speed },
    u_intensity: { value: cfg.intensity },
    u_shimmer: { value: cfg.shimmer },
    u_centerBias: { value: cfg.centerBias },
    u_baseColor: { value: base },
    u_accentColor: { value: accent },
    u_coldColor: { value: cold },
    u_pulseCount: { value: 0 },
    u_pulsePos: { value: pulsePos.current },
    u_pulseTime: { value: pulseTime.current },
  }).current;

  // Global mouse/touch listeners controlling uniforms (works even with pointer-events none)
  useEffect(() => {
    function setPointer(x: number, y: number) {
      pointer.current.set(x, y);
    }
    function handleMove(e: MouseEvent) {
      const x = e.clientX / window.innerWidth;
      const y = e.clientY / window.innerHeight;
      setPointer(x, y);
    }
    function handleTouchMove(e: TouchEvent) {
      if (!e.touches[0]) return;
      const t = e.touches[0];
      const x = t.clientX / window.innerWidth;
      const y = t.clientY / window.innerHeight;
      setPointer(x, y);
    }
    function handlePulse(eX: number, eY: number) {
      const i = pulseCount.current % MAX_PULSES;
      pulsePos.current[i] = new THREE.Vector2(eX, eY);
      pulseTime.current[i] = performance.now() / 1000.0; // seconds
      pulseCount.current += 1;
      uniforms.u_pulseCount.value = Math.min(pulseCount.current, MAX_PULSES);
    }
    function handleClick(e: MouseEvent) {
      handlePulse(e.clientX / window.innerWidth, e.clientY / window.innerHeight);
    }
    function handleTouchStart(e: TouchEvent) {
      if (!e.touches[0]) return;
      const t = e.touches[0];
      handlePulse(t.clientX / window.innerWidth, t.clientY / window.innerHeight);
    }

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("mousedown", handleClick, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove as any);
      window.removeEventListener("touchmove", handleTouchMove as any);
      window.removeEventListener("mousedown", handleClick as any);
      window.removeEventListener("touchstart", handleTouchStart as any);
    };
  }, [uniforms]);

  // Reduced motion or no WebGL: static gradient fallback
  if (prefersReducedMotion || !webglSupported) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_45%,hsl(var(--primary)/0.25),transparent_60%)]" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Canvas
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0); // transparent
        }}
        style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh" }}
      >
        <PerformanceMonitor>
          <AdaptiveDpr pixelated={false} />
        </PerformanceMonitor>
        <OrthographicCamera makeDefault position={[0, 0, 1]} />
        <AuroraQuad uniforms={uniforms} />
      </Canvas>
    </div>
  );
}
