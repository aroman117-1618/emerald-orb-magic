import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Vertex shader for the flowing ribbons with water interactions
const vertexShader = `
  uniform float u_time;
  uniform float u_frequency;
  uniform float u_amplitude;
  uniform vec2 u_mouse;
  uniform float u_mouseInfluence;
  uniform vec3 u_ripples[10];
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
    
    // Mouse interaction - create drag effect
    vec2 worldPos = vec2(pos.x, pos.y);
    float mouseDistance = distance(worldPos, u_mouse);
    float mouseEffect = exp(-mouseDistance * 0.5) * u_mouseInfluence;
    
    // Ripple effects from clicks
    float rippleEffect = 0.0;
    for(int i = 0; i < 10; i++) {
      vec3 ripple = u_ripples[i];
      if(ripple.z > 0.0) {
        float rippleDistance = distance(worldPos, ripple.xy);
        float rippleTime = u_time - ripple.z;
        if(rippleTime > 0.0 && rippleTime < 3.0) {
          float rippleRadius = rippleTime * 5.0;
          float rippleStrength = exp(-rippleTime * 2.0);
          float rippleWave = sin(rippleDistance * 3.14159 - rippleTime * 8.0) * rippleStrength;
          if(abs(rippleDistance - rippleRadius) < 0.5) {
            rippleEffect += rippleWave * 0.5;
          }
        }
      }
    }
    
    // Create flowing displacement with water effects
    pos.z += (combinedNoise + mouseEffect + rippleEffect) * u_amplitude;
    pos.x += (sin(pos.y * u_frequency + u_time) * u_amplitude * 0.3) + (mouseEffect * 0.2);
    pos.y += (cos(pos.x * u_frequency + u_time) * u_amplitude * 0.2) + (mouseEffect * 0.15);
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Fragment shader for ethereal, flowing colors with water interactions
const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform vec3 u_color3;
  uniform float u_opacity;
  uniform vec2 u_mouse;
  uniform float u_mouseInfluence;
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
    
    // Mouse interaction effects
    vec2 mouseUv = (u_mouse + 1.0) * 0.5; // Convert from -1,1 to 0,1
    float mouseDistance = distance(uv, mouseUv);
    float mouseColorEffect = exp(-mouseDistance * 3.0) * u_mouseInfluence;
    
    // Create color mixing based on position, noise, and mouse
    float colorMix1 = sin(pattern + u_time * 0.5 + mouseColorEffect) * 0.5 + 0.5;
    float colorMix2 = cos(pattern * 2.0 + u_time * 0.3 + mouseColorEffect * 2.0) * 0.5 + 0.5;
    
    // Blend between three colors for rich variation
    vec3 color = mix(
      mix(u_color1, u_color2, colorMix1),
      u_color3,
      colorMix2 * 0.6
    );
    
    // Add mouse-influenced brightness
    float brightness = 0.8 + pattern * 0.4 + mouseColorEffect * 0.3;
    color *= brightness;
    
    // Create flowing alpha for ethereal effect
    float alpha = smoothstep(0.0, 1.0, pattern * 0.8 + 0.4 + mouseColorEffect * 0.2) * u_opacity;
    
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
  mousePosition: THREE.Vector2;
  mouseInfluence: number;
  ripples: Array<{ x: number; y: number; time: number }>;
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
  mousePosition,
  mouseInfluence,
  ripples,
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
      u_mouse: { value: mousePosition },
      u_mouseInfluence: { value: mouseInfluence },
      u_ripples: { value: new Array(10).fill(new THREE.Vector3(0, 0, -1)) },
    }),
    [color1, color2, color3, opacity, frequency, amplitude, mousePosition, mouseInfluence]
  );

  useFrame((state) => {
    console.log("useFrame running, time:", state.clock.elapsedTime);
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
      materialRef.current.uniforms.u_mouse.value = mousePosition;
      materialRef.current.uniforms.u_mouseInfluence.value = mouseInfluence;
      
      // Update ripples
      const rippleArray = ripples.map(ripple => 
        new THREE.Vector3(ripple.x, ripple.y, ripple.time)
      );
      while (rippleArray.length < 10) {
        rippleArray.push(new THREE.Vector3(0, 0, -1));
      }
      materialRef.current.uniforms.u_ripples.value = rippleArray.slice(0, 10);
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
  const [mousePosition, setMousePosition] = useState(new THREE.Vector2(0, 0));
  const [mouseInfluence, setMouseInfluence] = useState(0);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; time: number }>>([]);

  console.log("FlurryBackground component rendering", { reducedMotion });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      console.log("Motion preference changed:", mq.matches);
      // Temporarily force animations to be enabled for debugging
      setReducedMotion(false);
    };
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  // Mouse interaction handlers
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      setMousePosition(new THREE.Vector2(x, y));
      setMouseInfluence(1.0);
    };

    const handleMouseLeave = () => {
      setMouseInfluence(0);
    };

    const handleClick = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      const currentTime = Date.now() / 1000;
      
      setRipples(prev => [
        ...prev.filter(ripple => currentTime - ripple.time < 3), // Keep ripples for 3 seconds
        { x, y, time: currentTime }
      ].slice(-10)); // Keep max 10 ripples
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  // Clean up old ripples
  useEffect(() => {
    const interval = setInterval(() => {
      const currentTime = Date.now() / 1000;
      setRipples(prev => prev.filter(ripple => currentTime - ripple.time < 3));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Define colors with your logo's teal-green and more blues/whites
  const colors = [
    new THREE.Color(0x3d8b73), // Your logo's teal-green
    new THREE.Color(0x2d6a5a), // Darker teal
    new THREE.Color(0x4ea085), // Lighter teal
    new THREE.Color(0x107e57), // Medium green
    new THREE.Color(0xa1ce3f), // Bright lime
    new THREE.Color(0xcbe58e), // Light green
    new THREE.Color(0x4a90e2), // Bright blue
    new THREE.Color(0x87ceeb), // Sky blue
    new THREE.Color(0xffffff), // Pure white
    new THREE.Color(0xe6f3ff), // Light blue-white
    new THREE.Color(0x1e3a8a), // Royal blue
    new THREE.Color(0x3b82f6), // Medium blue
    new THREE.Color(0xdbeafe), // Pale blue
  ];

  if (reducedMotion) {
    console.log("Reduced motion enabled, showing static background");
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, 
            rgba(61, 139, 115, 0.1) 0%, 
            rgba(45, 106, 90, 0.1) 25%, 
            rgba(78, 160, 133, 0.1) 50%, 
            rgba(74, 144, 226, 0.1) 75%, 
            rgba(255, 255, 255, 0.05) 100%
          )`,
        }}
      />
    );
  }

  console.log("Rendering Canvas with colors:", colors.map(c => c.getHexString()));

  return (
    <div className="fixed inset-0 -z-10" style={{ background: "rgba(0, 0, 0, 0.95)" }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Multiple flowing planes at different depths and orientations */}
        <FlurryPlane
          color1={colors[0]}
          color2={colors[8]}
          color3={colors[2]}
          opacity={0.3}
          frequency={0.5}
          amplitude={1.5}
          position={[0, 0, -2]}
          rotation={[0, 0, 0]}
          scale={[1.2, 1.2, 1]}
          mousePosition={mousePosition}
          mouseInfluence={mouseInfluence}
          ripples={ripples}
        />
        <FlurryPlane
          color1={colors[1]}
          color2={colors[6]}
          color3={colors[9]}
          opacity={0.25}
          frequency={0.3}
          amplitude={2.0}
          position={[3, -2, -4]}
          rotation={[0.2, 0.3, 0.1]}
          scale={[1.5, 1.8, 1]}
          mousePosition={mousePosition}
          mouseInfluence={mouseInfluence}
          ripples={ripples}
        />
        <FlurryPlane
          color1={colors[3]}
          color2={colors[7]}
          color3={colors[10]}
          opacity={0.2}
          frequency={0.8}
          amplitude={1.2}
          position={[-4, 3, -6]}
          rotation={[-0.1, -0.2, 0.15]}
          scale={[1.8, 1.4, 1]}
          mousePosition={mousePosition}
          mouseInfluence={mouseInfluence}
          ripples={ripples}
        />
        <FlurryPlane
          color1={colors[5]}
          color2={colors[11]}
          color3={colors[0]}
          opacity={0.15}
          frequency={0.4}
          amplitude={2.5}
          position={[2, 4, -8]}
          rotation={[0.3, -0.1, -0.2]}
          scale={[2.0, 1.6, 1]}
          mousePosition={mousePosition}
          mouseInfluence={mouseInfluence}
          ripples={ripples}
        />
        <FlurryPlane
          color1={colors[12]}
          color2={colors[4]}
          color3={colors[7]}
          opacity={0.1}
          frequency={0.6}
          amplitude={1.8}
          position={[-3, -4, -10]}
          rotation={[-0.2, 0.4, 0.1]}
          scale={[1.6, 2.2, 1]}
          mousePosition={mousePosition}
          mouseInfluence={mouseInfluence}
          ripples={ripples}
        />
      </Canvas>
    </div>
  );
};

export default FlurryBackground;