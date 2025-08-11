import React, { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { AdaptiveDpr, PerformanceMonitor, OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";

// AuroraBackground
// - Fullscreen, fixed WebGL canvas rendering a procedurally animated aurora using a shader
// - Organic, non-repeating motion via domain-warped fbm and time warping
// - Non-interactive: free-floating, smoke-like motion with subtle stars
// - Performance: single fullscreen quad, adaptive DPR
// - Accessibility: respects prefers-reduced-motion and falls back to static gradient if no WebGL

export type AuroraColors = {
  base?: string;   // deep emerald/green
  accent?: string; // teal/turquoise highlight
  cold?: string;   // icy blue for cool accents
  purple?: string; // aurora violet
  indigo?: string; // deep blue-indigo
};

export type AuroraBackgroundProps = {
  colors?: AuroraColors;
  intensity?: number;     // 0.0 - 2.0 overall brightness/contrast
  speed?: number;         // 0.2 - 2.0 base motion speed
  shimmer?: number;       // 0.0 - 1.0 subtle sparkle
  backgroundColor?: string; // deep night-sky base
  starIntensity?: number;   // 0.0 - 1.0 star brightness
  starDensity?: number;     // 0.0 - 1.0 star density
  overlayAmount?: number;   // 0.0 - 1.0 aurora overlay strength
  // Band/ribbon controls
  bandAngle?: number;       // radians, orientation of the aurora band
  bandWidthMin?: number;    // min normalized half-width of band
  bandWidthMax?: number;    // max normalized half-width of band
  bandDriftSpeed?: number;  // band width/offset modulation speed
  bandCurvature?: number;   // subtle curvature amount
  // Branch controls
  branchCount?: number;         // 0-5 number of connected branches
  branchSpread?: number;        // radians: max angular deviation from main band
  branchStrength?: number;      // 0..1 intensity of branches vs main band
  branchWidthFactor?: number;   // width multiplier for branches
  branchAttach?: number;        // 0..1 additional offset amplitude from main band
  branchJitter?: number;        // 0..1 random wobble amount
  branchSeed?: number;          // randomization seed
  // Look controls
  saturation?: number;      // 0..1 (1 = full saturation)
  gamma?: number;           // >0, tone response
};

const DEFAULT_PROPS: Required<AuroraBackgroundProps> = {
  colors: {
    base: "#88F79E",    // green highlight
    accent: "#4EE3C1",  // turquoise
    cold: "#6FC6FF",    // cool blue
    purple: "#6B5AE8",  // restrained violet
    indigo: "#0E1B2E",  // deep indigo/blue
  },
  intensity: 0.75,
  speed: 17.28, // ~40% slower than 28.8 for smoother motion
  shimmer: 0.08,
  backgroundColor: "#02050A",
  starIntensity: 0.28,
  starDensity: 0.25,
  overlayAmount: 0.75,
  bandAngle: -0.45,
  bandWidthMin: 0.15, // half-width => ~30% full coverage at min
  bandWidthMax: 0.30, // half-width => ~60% full coverage at max
  bandDriftSpeed: 1.44, // keep fast band modulation
  bandCurvature: 0.15,
  // Branch defaults
  branchCount: 4,
  branchSpread: 0.7,
  branchStrength: 0.8,
  branchWidthFactor: 0.6,
  branchAttach: 0.35,
  branchJitter: 0.25,
  branchSeed: 12.34,
  saturation: 0.9,
  gamma: 1.1,
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



const FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;

  uniform vec2 u_resolution;
  uniform float u_time;

  uniform float u_speed;
  uniform float u_intensity;
  uniform float u_shimmer;

  uniform vec3 u_baseColor;
  uniform vec3 u_accentColor;
  uniform vec3 u_coldColor;
  uniform vec3 u_purpleColor;
  uniform vec3 u_indigoColor;
  uniform vec3 u_bgColor;

  uniform float u_starIntensity;
  uniform float u_starDensity;
  uniform float u_overlayAmount;

  // Band/ribbon uniforms
  uniform float u_bandAngle;
  uniform float u_bandWidthMin;
  uniform float u_bandWidthMax;
  uniform float u_bandDriftSpeed;
  uniform float u_bandCurvature;

  // Branch uniforms
  uniform float u_branchCount;
  uniform float u_branchSpread;
  uniform float u_branchStrength;
  uniform float u_branchWidthFactor;
  uniform float u_branchAttach;
  uniform float u_branchJitter;
  uniform float u_branchSeed;

  // Look controls
  uniform float u_saturation;
  uniform float u_gamma;

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

  mat2 rot(float a){ return mat2(cos(a), -sin(a), sin(a), cos(a)); }

  float bandMaskAt(vec2 p, float angle, float offset, float width, float curvature, float timePhase){
    vec2 rp = rot(angle) * (p + vec2(0.0, offset));
    float curve = curvature * sin(rp.x * 2.2 + timePhase);
    float dist = abs(rp.y - curve);
    return 1.0 - smoothstep(0.0, width, dist);
  }

  void main(){
    vec2 uv = vUv; // 0..1

    // Aspect-corrected coordinates around center
    vec2 res = u_resolution;
    float ar = res.x / res.y;
    vec2 p = (uv - 0.5) * vec2(ar, 1.0);

    // Even slower global time
    float t = u_time * (0.25 + u_speed*0.75) * 0.25;

    // Domain-warped coordinates for organic motion
    vec2 q = vec2(
      fbm(p*1.35 + vec2(0.0, t*0.10)),
      fbm(p*1.35 + vec2(5.2, -t*0.08))
    );
    vec2 r = vec2(
      fbm(p*2.1 + 3.3*q + vec2(1.7, 9.2)),
      fbm(p*2.1 + 3.3*q + vec2(8.3, 2.8))
    );

    // Ridged/turbulent fbm to get smoke-like wisps
    float nA = fbm(p*1.15 + r*0.5 + vec2(0.0, t*0.045));
    float nB = fbm((p + q*0.7)*1.9 - vec2(t*0.02, t*0.014));
    float ridged = 1.0 - abs(2.0*nA - 1.0);
    float flow    = 1.0 - abs(2.0*nB - 1.0);
    float smoke = clamp(0.6*ridged + 0.4*flow, 0.0, 1.0);

    // Additional wisping along a curl-like direction
    vec2 dir = normalize(vec2(r.y, -r.x) + 1e-3);
    float wisp = fbm(p + dir*(t*0.035) + q*0.28);
    smoke = mix(smoke, wisp, 0.3);

    // Subtle sparkle kept minimal
    float spark = u_shimmer * (0.2 + 0.8*noise(p*8.0 + r*1.5 + t*0.25));

    // Brightness from smoke, with intensity mapping
    float brightness = clamp(smoothstep(0.28, 0.95, smoke) + spark*0.35, 0.0, 1.0);
    brightness = pow(brightness, 1.0 + 0.5*(1.0/u_intensity - 1.0));

    // Band/ribbon mask to constrain coverage 30-60%
    float bandOffset = 0.15 * sin(u_time * u_bandDriftSpeed);
    float width = mix(u_bandWidthMin, u_bandWidthMax, 0.5 + 0.5 * sin(u_time * u_bandDriftSpeed * 0.8));

    // Main band
    float mainBandMask = bandMaskAt(p, u_bandAngle, bandOffset, width, u_bandCurvature, u_time * 0.05);

    // Branches: 0-5 connected ribbons with irregular motion
    float branches = 0.0;
    int count = int(min(max(u_branchCount, 0.0), 5.0));
    for(int i=0;i<5;i++){
      if(i >= count) break;
      float fi = float(i);
      float denom = max(float(count - 1), 1.0);
      float frac = fi / denom;          // 0..1
      float signed = frac * 2.0 - 1.0;  // -1..1 across branch set

      float seed = u_branchSeed + fi * 23.17;
      float phase = 0.6 + 0.4 * fract(sin(seed) * 43758.5453);
      float jitter = (noise(vec2(seed, t*0.2)) - 0.5) * 2.0 * u_branchJitter;

      float angle = u_bandAngle + signed * u_branchSpread + jitter * 0.3;

      float attach = u_branchAttach * (0.5 + 0.5 * sin(t * phase + seed));
      float offset = bandOffset + attach * (0.5 + 0.5 * sin(t * u_bandDriftSpeed * 0.7 + seed));

      float bWidth = max(1e-3, width * u_branchWidthFactor);
      float bCurve = u_bandCurvature * (0.7 + 0.4 * sin(seed));

      float mask = bandMaskAt(p, angle, offset, bWidth, bCurve, u_time * 0.05 + seed);
      branches = max(branches, mask);
    }

    float bandMask = max(mainBandMask, branches * u_branchStrength);

    // Final aurora mask including band and branches
    float auroraMask = brightness * bandMask;
    auroraMask = pow(clamp(auroraMask, 0.0, 1.0), 1.15);

    // Palette: indigo -> purple -> blue -> teal -> green (only at highlights)
    float h = auroraMask;
    vec3 c0 = u_indigoColor;
    vec3 c1 = u_purpleColor;
    vec3 c2 = u_coldColor;
    vec3 c3 = u_accentColor;
    vec3 c4 = u_baseColor;

    vec3 aur = mix(c0, c1, smoothstep(0.15, 0.28, h));
    aur = mix(aur, c2, smoothstep(0.30, 0.55, h));
    aur = mix(aur, c3, smoothstep(0.60, 0.78, h));
    aur = mix(aur, c4, smoothstep(0.80, 0.98, h));

    // Desaturate slightly for elegance
    float luma = dot(aur, vec3(0.299, 0.587, 0.114));
    aur = mix(vec3(luma), aur, clamp(u_saturation, 0.0, 1.0));

    // Sparse starfield behind aurora, slower twinkle
    vec2 grid = floor(uv * res * 1.25);
    float starSeed = hash(grid);
    float twinkle = 0.5 + 0.5*sin(u_time*1.2 + starSeed*50.0);
    float density = mix(0.9995, 0.997, clamp(u_starDensity, 0.0, 1.0));
    float star = step(density, starSeed) * twinkle * u_starIntensity;
    star *= (1.0 - auroraMask*0.85); // subdued under bright smoke

    // Compose deep night background + subtle stars
    vec3 bg = u_bgColor + star * c2 * 0.6;

    // Composite aurora over the background
    vec3 col = mix(bg, aur, auroraMask * u_overlayAmount);

    // Filmic tone tweak and gamma
    col = 1.0 - exp(-col * 1.05);
    col = pow(max(col, 0.0), vec3(1.0 / max(u_gamma, 0.001)));

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
    u_speed: { value: number };
    u_intensity: { value: number };
    u_shimmer: { value: number };
    u_baseColor: { value: THREE.Vector3 };
    u_accentColor: { value: THREE.Vector3 };
    u_coldColor: { value: THREE.Vector3 };
    u_purpleColor: { value: THREE.Vector3 };
    u_indigoColor: { value: THREE.Vector3 };
    u_bgColor: { value: THREE.Vector3 };
    u_starIntensity: { value: number };
    u_starDensity: { value: number };
    u_overlayAmount: { value: number };
    u_bandAngle: { value: number };
    u_bandWidthMin: { value: number };
    u_bandWidthMax: { value: number };
    u_bandDriftSpeed: { value: number };
    u_bandCurvature: { value: number };
    u_branchCount: { value: number };
    u_branchSpread: { value: number };
    u_branchStrength: { value: number };
    u_branchWidthFactor: { value: number };
    u_branchAttach: { value: number };
    u_branchJitter: { value: number };
    u_branchSeed: { value: number };
    u_saturation: { value: number };
    u_gamma: { value: number };
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

  // Colors as linear RGB vectors
  const base = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.base)), [cfg.colors.base]);
  const accent = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.accent)), [cfg.colors.accent]);
  const cold = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.cold)), [cfg.colors.cold]);
  const purple = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.purple)), [cfg.colors.purple]);
  const indigo = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.colors.indigo)), [cfg.colors.indigo]);
  const bgNight = useMemo(() => new THREE.Vector3(...hexToRGB(cfg.backgroundColor)), [cfg.backgroundColor]);

  // Uniform objects kept stable between renders
  const uniforms = useRef({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(1, 1) },
    u_speed: { value: cfg.speed },
    u_intensity: { value: cfg.intensity },
    u_shimmer: { value: cfg.shimmer },
    u_baseColor: { value: base },
    u_accentColor: { value: accent },
    u_coldColor: { value: cold },
    u_purpleColor: { value: purple },
    u_indigoColor: { value: indigo },
    u_bgColor: { value: bgNight },
    u_starIntensity: { value: cfg.starIntensity },
    u_starDensity: { value: cfg.starDensity },
    u_overlayAmount: { value: cfg.overlayAmount },
    u_bandAngle: { value: cfg.bandAngle },
    u_bandWidthMin: { value: cfg.bandWidthMin },
    u_bandWidthMax: { value: cfg.bandWidthMax },
    u_bandDriftSpeed: { value: cfg.bandDriftSpeed },
    u_bandCurvature: { value: cfg.bandCurvature },
    u_branchCount: { value: cfg.branchCount },
    u_branchSpread: { value: cfg.branchSpread },
    u_branchStrength: { value: cfg.branchStrength },
    u_branchWidthFactor: { value: cfg.branchWidthFactor },
    u_branchAttach: { value: cfg.branchAttach },
    u_branchJitter: { value: cfg.branchJitter },
    u_branchSeed: { value: cfg.branchSeed },
    u_saturation: { value: cfg.saturation },
    u_gamma: { value: cfg.gamma },
  }).current;


  // Reduced motion or no WebGL: static gradient fallback
  if (prefersReducedMotion || !webglSupported) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_30%_at_50%_55%,hsl(var(--primary)/0.12),transparent_60%)]" />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
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
