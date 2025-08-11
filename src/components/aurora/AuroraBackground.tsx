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
  intensity: 0.68,
  speed: 0.25, // calmer base motion; shader time also reduced
  shimmer: 0.04,
  backgroundColor: "#02050A",
  starIntensity: 0.2,
  starDensity: 0.15,
  overlayAmount: 0.6,
  bandAngle: -0.45,
  bandWidthMin: 0.12,
  bandWidthMax: 0.28,
  bandDriftSpeed: 0.03,
  bandCurvature: 0.15,
  saturation: 0.7,
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

  void main(){
    vec2 uv = vUv; // 0..1

    // Aspect-corrected coordinates around center
    vec2 res = u_resolution;
    float ar = res.x / res.y;
    vec2 p = (uv - 0.5) * vec2(ar, 1.0);

    // Even slower global time
    float t = u_time * (0.25 + u_speed*0.75) * 0.18;

    // Global free-floating drift (subtle meander)
    p += vec2(0.035 * sin(t * 0.15), 0.028 * cos(t * 0.11));

    // Domain-warped coordinates for organic motion (calmer)
    vec2 q = vec2(
      fbm(p*1.35 + vec2(0.0, t*0.06)),
      fbm(p*1.35 + vec2(5.2, -t*0.05))
    );
    vec2 r = vec2(
      fbm(p*2.1 + 3.3*q + vec2(1.7, 9.2)),
      fbm(p*2.1 + 3.3*q + vec2(8.3, 2.8))
    );

    // Ridged/turbulent fbm to get smoke-like wisps
    float nA = fbm(p*1.15 + r*0.5 + vec2(0.0, t*0.030));
    float nB = fbm((p + q*0.7)*1.9 - vec2(t*0.012, t*0.009));
    float ridged = 1.0 - abs(2.0*nA - 1.0);
    float flow    = 1.0 - abs(2.0*nB - 1.0);
    float smoke = clamp(0.7*ridged + 0.3*flow, 0.0, 1.0);

    // Additional wisping along a curl-like direction
    vec2 dir = normalize(vec2(r.y, -r.x) + 1e-3);
    float wisp = fbm(p + dir*(t*0.022) + q*0.28);
    smoke = mix(smoke, wisp, 0.3);

    // Subtle sparkle kept minimal
    float spark = u_shimmer * (0.2 + 0.8*noise(p*8.0 + r*1.5 + t*0.15));

    // Brightness from smoke, with intensity mapping
    float brightness = clamp(smoothstep(0.32, 0.95, smoke) + spark*0.35, 0.0, 1.0);
    brightness = pow(brightness, 1.0 + 0.5*(1.0/u_intensity - 1.0));

    // Band/ribbon mask to constrain coverage 30-60%
    float bandOffset = 0.08 * sin(u_time * u_bandDriftSpeed);
    float bandXDrift = 0.04 * sin(u_time * u_bandDriftSpeed * 0.6);
    vec2 rp = rot(u_bandAngle) * (p + vec2(bandXDrift, bandOffset));
    float width = mix(u_bandWidthMin, u_bandWidthMax, 0.5 + 0.5 * sin(u_time * u_bandDriftSpeed * 0.8));
    float curve = u_bandCurvature * sin(rp.x * 2.2 + u_time * 0.05);
    float bandDist = abs(rp.y - curve);
    float bandMask = 1.0 - smoothstep(0.0, width*0.92, bandDist);

    // Final aurora mask including band
    float auroraMask = brightness * bandMask;
    auroraMask = pow(clamp(auroraMask, 0.0, 1.0), 1.25);

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
    vec2 grid = floor(uv * res * 0.9);
    float starSeed = hash(grid);
    float twinkle = 0.5 + 0.5*sin(u_time*0.6 + starSeed*50.0);
    float density = mix(0.99985, 0.9985, clamp(u_starDensity, 0.0, 1.0));
    float star = step(density, starSeed) * twinkle * u_starIntensity;
    star *= (1.0 - auroraMask*0.9); // subdued under bright smoke

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
