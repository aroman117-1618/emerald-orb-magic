import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useState, useEffect } from 'react';
import * as THREE from 'three';

// Custom shader for the nebula orb effect
const vertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform float u_mouseInfluence;
  uniform vec3 u_nebulaDeep;
  uniform vec3 u_nebulaOcean;
  uniform vec3 u_nebulaForest;
  uniform vec3 u_nebulaLime;
  uniform vec3 u_nebulaLight;
  
  varying vec2 vUv;
  
  // Noise functions
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
  }
  
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 6; i++) {
      value += amplitude * noise(st);
      st *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }
  
  // Orb generation function
  float orb(vec2 p, vec2 center, float radius, float time) {
    vec2 offset = p - center;
    float dist = length(offset);
    
    // Add breathing and morphing
    float breathing = sin(time * 0.8) * 0.1 + 1.0;
    float morphing = fbm(offset * 3.0 + time * 0.2) * 0.3;
    
    radius *= breathing;
    radius += morphing;
    
    // Soft falloff
    float orb = smoothstep(radius + 0.2, radius - 0.1, dist);
    
    // Add internal texture
    float texture = fbm(p * 4.0 + time * 0.1) * 0.5 + 0.5;
    
    return orb * texture;
  }
  
  void main() {
    vec2 st = vUv;
    vec2 center = vec2(0.5);
    
    // Mouse influence
    vec2 mouseOffset = (u_mouse - 0.5) * u_mouseInfluence;
    center += mouseOffset * 0.3;
    
    // Create multiple orbs with different properties
    float time = u_time * 0.5;
    
    // Main orb
    float mainOrb = orb(st, center, 0.25, time);
    
    // Secondary orbs for complexity
    vec2 drift1 = center + vec2(sin(time * 0.3) * 0.2, cos(time * 0.4) * 0.15);
    vec2 drift2 = center + vec2(sin(time * 0.5 + 3.14) * 0.15, cos(time * 0.3 + 1.57) * 0.2);
    
    float orb1 = orb(st, drift1, 0.15, time + 1.0) * 0.6;
    float orb2 = orb(st, drift2, 0.12, time + 2.0) * 0.4;
    
    // Combine orbs
    float totalOrb = mainOrb + orb1 + orb2;
    totalOrb = clamp(totalOrb, 0.0, 1.0);
    
    // Create nebula background
    float nebulaNoise = fbm(st * 2.0 + time * 0.05) * 0.3;
    float starField = random(st * 100.0) > 0.998 ? 1.0 : 0.0;
    
    // Color mixing based on orb intensity and position
    vec3 deepSpace = mix(u_nebulaDeep, u_nebulaOcean, nebulaNoise);
    vec3 orbCore = mix(u_nebulaForest, u_nebulaLime, totalOrb);
    vec3 orbGlow = mix(u_nebulaLime, u_nebulaLight, pow(totalOrb, 0.5));
    
    // Final color composition
    vec3 color = deepSpace;
    color = mix(color, orbCore, totalOrb * 0.8);
    color = mix(color, orbGlow, pow(totalOrb, 2.0) * 0.6);
    color += starField * u_nebulaLight * 0.5;
    
    // Add subtle glow around orbs
    float glow = smoothstep(0.4, 0.0, distance(st, center)) * 0.2;
    color += glow * u_nebulaLime;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

interface NebulaOrbPlaneProps {
  mousePosition: { x: number; y: number };
  mouseInfluence: number;
}

function NebulaOrbPlane({ mousePosition, mouseInfluence }: NebulaOrbPlaneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport } = useThree();

  // Convert hex colors to RGB
  const nebulaColors = useMemo(() => ({
    deep: new THREE.Color('#013026'),
    ocean: new THREE.Color('#014760'),
    forest: new THREE.Color('#107e57'),
    lime: new THREE.Color('#a1ce3f'),
    light: new THREE.Color('#cbe58e'),
  }), []);

  const uniforms = useMemo(() => ({
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    u_mouse: { value: new THREE.Vector2(0.5, 0.5) },
    u_mouseInfluence: { value: 0 },
    u_nebulaDeep: { value: nebulaColors.deep },
    u_nebulaOcean: { value: nebulaColors.ocean },
    u_nebulaForest: { value: nebulaColors.forest },
    u_nebulaLime: { value: nebulaColors.lime },
    u_nebulaLight: { value: nebulaColors.light },
  }), [viewport, nebulaColors]);

  useFrame((state) => {
    if (meshRef.current && meshRef.current.material) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.u_time.value = state.clock.elapsedTime;
      material.uniforms.u_mouse.value.set(mousePosition.x, mousePosition.y);
      material.uniforms.u_mouseInfluence.value = THREE.MathUtils.lerp(
        material.uniforms.u_mouseInfluence.value,
        mouseInfluence,
        0.05
      );
      material.uniforms.u_resolution.value.set(viewport.width, viewport.height);
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]} position={[0, 0, -1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent={false}
      />
    </mesh>
  );
}

export default function NebulaOrbBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [mouseInfluence, setMouseInfluence] = useState(0);
  
  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = 1 - (event.clientY / window.innerHeight); // Flip Y coordinate
      setMousePosition({ x, y });
      setMouseInfluence(1);
    };

    const handleMouseLeave = () => {
      setMouseInfluence(0);
    };

    const handleClick = (event: MouseEvent) => {
      const x = event.clientX / window.innerWidth;
      const y = 1 - (event.clientY / window.innerHeight);
      setMousePosition({ x, y });
      
      // Create a pulse effect on click
      setMouseInfluence(2);
      setTimeout(() => setMouseInfluence(1), 200);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, [prefersReducedMotion]);

  // Fallback for reduced motion
  if (prefersReducedMotion) {
    return (
      <div className="fixed inset-0 -z-10">
        <div 
          className="w-full h-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, 
              #107e57 0%, 
              #014760 35%, 
              #013026 70%)`
          }}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        style={{ width: '100%', height: '100%' }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <NebulaOrbPlane 
          mousePosition={mousePosition} 
          mouseInfluence={mouseInfluence} 
        />
      </Canvas>
    </div>
  );
}