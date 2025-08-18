import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Vertex shader for the flowing ribbons
const vertexShader = `
  uniform float u_time;
  uniform float u_frequency;
  uniform float u_amplitude;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // Improved noise function
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));
           
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Create flowing wave motion with multiple octaves
    float noise1 = snoise(vec3(pos.x * 0.8 + u_time * 0.4, pos.y * 0.6 + u_time * 0.3, u_time * 0.2));
    float noise2 = snoise(vec3(pos.x * 1.2 - u_time * 0.2, pos.y * 1.4 + u_time * 0.5, u_time * 0.3));
    float noise3 = snoise(vec3(pos.x * 2.0 + u_time * 0.1, pos.y * 0.8 - u_time * 0.4, u_time * 0.4));
    
    // Combine noises for complex motion
    float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    
    // Create flowing displacement
    pos.z += combinedNoise * u_amplitude;
    pos.x += sin(pos.y * u_frequency + u_time) * u_amplitude * 0.3;
    pos.y += cos(pos.x * u_frequency + u_time) * u_amplitude * 0.2;
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader for ethereal, flowing colors
const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_opacity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod(i, 289.0);
    vec4 p = ((i.z + vec4(0.0, i1.z, i2.z, 1.0)) * 34.0 + 1.0) * (i.z + vec4(0.0, i1.z, i2.z, 1.0));
    p = mod(p, 289.0);
    p = ((i.y + vec4(0.0, i1.y, i2.y, 1.0)) * 34.0 + 1.0) * p;
    p = mod(p, 289.0);
    p = ((i.x + vec4(0.0, i1.x, i2.x, 1.0)) * 34.0 + 1.0) * p;
    p = mod(p, 289.0);
    
    vec4 j = p - 49.0 * floor(p * (1.0/49.0));
    
    vec4 x_ = floor(j * (1.0/7.0));
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ * (2.0/7.0) + (1.0/7.0) - 1.0;
    vec4 y = y_ * (2.0/7.0) + (1.0/7.0) - 1.0;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vec2 uv = vUv;
    
    // Create flowing patterns
    float noise1 = snoise(vec3(uv * 3.0 + u_time * 0.2, u_time * 0.1));
    float noise2 = snoise(vec3(uv * 5.0 - u_time * 0.15, u_time * 0.2));
    float noise3 = snoise(vec3(uv * 8.0 + u_time * 0.1, u_time * 0.3));
    
    // Combine noises for complex patterns
    float pattern = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
    
    // Create color mixing based on position and noise
    float colorMix1 = sin(pattern + u_time * 0.5) * 0.5 + 0.5;
    float colorMix2 = cos(pattern * 2.0 + u_time * 0.3) * 0.5 + 0.5;
    
    // Blend between three colors for rich variation
    vec3 color = mix(
      mix(u_color1, u_color2, colorMix1),
      u_color3,
      colorMix2 * 0.6
    );
    
    // Add subtle brightness variation
    float brightness = 0.8 + pattern * 0.4;
    color *= brightness;
    
    // Create flowing alpha for ethereal effect
    float alpha = smoothstep(0.0, 1.0, pattern * 0.8 + 0.4) * u_opacity;
    
    gl_FragColor = vec4(color, alpha);
  }
`;

interface FlurryPlaneProps {
  color1: THREE.Color;
  color2: THREE.Color;
  color3: THREE.Color;
  opacity: number;
  frequency: number;
  amplitude: number;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

const FlurryPlane: React.FC<FlurryPlaneProps> = ({
  color1,
  color2,
  color3,
  opacity,
  frequency,
  amplitude,
  position,
  rotation,
  scale,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = React.useMemo(
    () => ({
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_color1: { value: color1 },
      u_color2: { value: color2 },
      u_color3: { value: color3 },
      u_opacity: { value: opacity },
      u_frequency: { value: frequency },
      u_amplitude: { value: amplitude },
    }),
    [color1, color2, color3, opacity, frequency, amplitude]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

const FlurryBackground: React.FC = () => {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
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

  // Define colors inspired by the screenshots - ethereal greens and teals
  const colors = [
    new THREE.Color(0x013026), // Deep teal
    new THREE.Color(0x107e57), // Medium green
    new THREE.Color(0xa1ce3f), // Bright lime
    new THREE.Color(0x014760), // Deep blue
    new THREE.Color(0xcbe58e), // Light green
  ];

  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, 
            rgba(1, 48, 38, 0.1) 0%, 
            rgba(16, 126, 87, 0.1) 25%, 
            rgba(161, 206, 63, 0.1) 50%, 
            rgba(1, 71, 96, 0.1) 75%, 
            rgba(203, 229, 142, 0.1) 100%
          )`,
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10" style={{ background: "rgba(0, 0, 0, 0.95)" }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Multiple flowing planes at different depths and orientations */}
        <FlurryPlane
          color1={colors[0]}
          color2={colors[1]}
          color3={colors[2]}
          opacity={0.3}
          frequency={0.5}
          amplitude={1.5}
          position={[0, 0, -2]}
          rotation={[0, 0, 0]}
          scale={[1.2, 1.2, 1]}
        />
        <FlurryPlane
          color1={colors[1]}
          color2={colors[3]}
          color3={colors[4]}
          opacity={0.25}
          frequency={0.3}
          amplitude={2.0}
          position={[3, -2, -4]}
          rotation={[0.2, 0.3, 0.1]}
          scale={[1.5, 1.8, 1]}
        />
        <FlurryPlane
          color1={colors[2]}
          color2={colors[4]}
          color3={colors[0]}
          opacity={0.2}
          frequency={0.8}
          amplitude={1.2}
          position={[-4, 3, -6]}
          rotation={[-0.1, -0.2, 0.15]}
          scale={[1.8, 1.4, 1]}
        />
        <FlurryPlane
          color1={colors[3]}
          color2={colors[0]}
          color3={colors[1]}
          opacity={0.15}
          frequency={0.4}
          amplitude={2.5}
          position={[2, 4, -8]}
          rotation={[0.3, -0.1, -0.2]}
          scale={[2.0, 1.6, 1]}
        />
        <FlurryPlane
          color1={colors[4]}
          color2={colors[2]}
          color3={colors[3]}
          opacity={0.1}
          frequency={0.6}
          amplitude={1.8}
          position={[-3, -4, -10]}
          rotation={[-0.2, 0.4, 0.1]}
          scale={[1.6, 2.2, 1]}
        />
      </Canvas>
    </div>
  );
};

export default FlurryBackground;