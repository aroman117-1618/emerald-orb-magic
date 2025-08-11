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
};

const DEFAULT_PROPS: Required<AuroraBackgroundProps> = {
  colors: {
    base: "#0b7a4b",    // deep emerald
    accent: "#1ec6a3",  // turquoise
    cold: "#80d0ff",    // icy blue
    purple: "#7B5CF7",  // aurora violet
    indigo: "#1F3A8A",  // deep indigo
  },
  intensity: 0.9,
  speed: 0.65, // we also halve time in shader => overall ~50% slower
  shimmer: 0.12,
  backgroundColor: "#050B12",
  starIntensity: 0.35,
  starDensity: 0.35,
  overlayAmount: 0.9,
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

  void main(){
    vec2 uv = vUv; // 0..1

    // Aspect-corrected coordinates around center
    vec2 res = u_resolution;
    float ar = res.x / res.y;
    vec2 p = (uv - 0.5) * vec2(ar, 1.0);

    // Slow global time (50% slower overall)
    float t = u_time * (0.25 + u_speed*0.75) * 0.5;

    // Domain-warped coordinates for organic motion
    vec2 q = vec2(
      fbm(p*1.4 + vec2(0.0, t*0.12)),
      fbm(p*1.4 + vec2(5.2, -t*0.09))
    );
    vec2 r = vec2(
      fbm(p*2.2 + 3.5*q + vec2(1.7, 9.2)),
      fbm(p*2.2 + 3.5*q + vec2(8.3, 2.8))
    );

    // Ridged/turbulent fbm to get smoke-like wisps
    float nA = fbm(p*1.2 + r*0.5 + vec2(0.0, t*0.05));
    float nB = fbm((p + q*0.75)*2.0 - vec2(t*0.02, t*0.015));
    float ridged = 1.0 - abs(2.0*nA - 1.0);
    float flow    = 1.0 - abs(2.0*nB - 1.0);
    float smoke = clamp(0.6*ridged + 0.4*flow, 0.0, 1.0);

    // Additional wisping along a curl-like direction
    vec2 dir = normalize(vec2(r.y, -r.x) + 1e-3);
    float wisp = fbm(p + dir*(t*0.04) + q*0.3);
    smoke = mix(smoke, wisp, 0.3);

    // Subtle sparkle
    float spark = u_shimmer * (0.25 + 0.75*noise(p*8.0 + r*1.5 + t*0.3));

    // Brightness from smoke, with intensity mapping
    float brightness = clamp(smoothstep(0.25, 0.95, smoke) + spark*0.4, 0.0, 1.0);
    brightness = pow(brightness, 1.0 + 0.5*(1.0/u_intensity - 1.0));

    // Mask for compositing
    float auroraMask = brightness;

    // Multi-stop color palette: indigo -> purple -> blue -> teal -> green
    float h = auroraMask;
    vec3 c0 = u_indigoColor;
    vec3 c1 = u_purpleColor;
    vec3 c2 = u_coldColor;
    vec3 c3 = u_accentColor;
    vec3 c4 = u_baseColor;

    vec3 aur = mix(c0, c1, smoothstep(0.05, 0.30, h));
    aur = mix(aur, c2, smoothstep(0.20, 0.55, h));
    aur = mix(aur, c3, smoothstep(0.45, 0.80, h));
    aur = mix(aur, c4, smoothstep(0.70, 1.00, h));

    // Sparse starfield behind aurora
    vec2 grid = floor(uv * res * 1.25);
    float starSeed = hash(grid);
    float twinkle = 0.5 + 0.5*sin(u_time*3.0 + starSeed*50.0);
    float density = mix(0.9995, 0.997, clamp(u_starDensity, 0.0, 1.0));
    float star = step(density, starSeed) * twinkle * u_starIntensity;
    star *= (1.0 - auroraMask); // stars are subdued under bright smoke

    // Compose deep night background + subtle stars
    vec3 bg = u_bgColor + star * c2 * 0.6;

    // Gentle vignette to avoid hard edges (not a strong center bias)
    float vig = smoothstep(1.25, 0.25, length(p));

    // Composite aurora over the background
    vec3 col = mix(bg, aur, auroraMask * u_overlayAmount);
    col *= mix(0.85, 1.05, vig);

    // Filmic tone tweak
    col = 1.0 - exp(-col * 1.1);

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
  }).current;


  // Reduced motion or no WebGL: static gradient fallback
  if (prefersReducedMotion || !webglSupported) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/10 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_45%,hsl(var(--primary)/0.25),transparent_60%)]" />
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
