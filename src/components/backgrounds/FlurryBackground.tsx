
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Simplified and more reliable vertex shader
const vertexShader = `
  uniform float u_time;
  uniform float u_frequency;
  uniform float u_amplitude;
  uniform vec2 u_mouse;
  uniform float u_mouseInfluence;
  uniform vec3 u_ripples[10];
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    
    vec3 pos = position;
    
    // Simple sine wave animation that should definitely be visible
    float waveX = sin(pos.x * u_frequency + u_time * 2.0) * u_amplitude;
    float waveY = cos(pos.y * u_frequency + u_time * 1.5) * u_amplitude;
    float waveTime = sin(u_time) * u_amplitude * 0.5;
    
    // Mouse interaction - create drag effect
    vec2 worldPos = vec2(pos.x, pos.y);
    float mouseDistance = distance(worldPos, u_mouse);
    float mouseEffect = exp(-mouseDistance * 2.0) * u_mouseInfluence * 2.0;
    
    // Ripple effects from clicks
    float rippleEffect = 0.0;
    for(int i = 0; i < 10; i++) {
      vec3 ripple = u_ripples[i];
      if(ripple.z > 0.0) {
        float rippleDistance = distance(worldPos, ripple.xy);
        float rippleTime = u_time - ripple.z;
        if(rippleTime > 0.0 && rippleTime < 3.0) {
          float rippleRadius = rippleTime * 3.0;
          float rippleStrength = exp(-rippleTime * 1.0) * 2.0;
          if(abs(rippleDistance - rippleRadius) < 1.0) {
            rippleEffect += sin(rippleDistance * 10.0 - rippleTime * 15.0) * rippleStrength;
          }
        }
      }
    }
    
    // Apply all effects
    pos.z += waveX + waveY + waveTime + mouseEffect + rippleEffect;
    pos.x += sin(u_time + pos.y * 2.0) * u_amplitude * 0.3 + mouseEffect * 0.5;
    pos.y += cos(u_time + pos.x * 2.0) * u_amplitude * 0.3 + mouseEffect * 0.5;
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    
    // Debug: log if time is updating
    // This won't actually log, but helps verify the shader is running
  }
`;

// Simplified fragment shader with more visible color changes
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
  
  void main() {
    vec2 uv = vUv;
    
    // Simple time-based color mixing that should be very visible
    float timeFactor = sin(u_time * 0.5) * 0.5 + 0.5;
    float positionFactor = sin(uv.x * 10.0) * cos(uv.y * 10.0) * 0.5 + 0.5;
    
    // Mouse interaction effects
    vec2 mouseUv = (u_mouse + 1.0) * 0.5;
    float mouseDistance = distance(uv, mouseUv);
    float mouseColorEffect = exp(-mouseDistance * 5.0) * u_mouseInfluence;
    
    // Create color mixing
    vec3 color = mix(
      mix(u_color1, u_color2, timeFactor),
      u_color3,
      positionFactor + mouseColorEffect
    );
    
    // Add brightness variation
    float brightness = 0.7 + timeFactor * 0.6 + mouseColorEffect * 0.8;
    color *= brightness;
    
    // Dynamic alpha
    float alpha = (0.5 + timeFactor * 0.3 + mouseColorEffect * 0.5) * u_opacity;
    
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
    if (materialRef.current) {
      // Limit updates to avoid performance issues
      const time = state.clock.elapsedTime;
      materialRef.current.uniforms.u_time.value = time;
      materialRef.current.uniforms.u_mouse.value = mousePosition;
      materialRef.current.uniforms.u_mouseInfluence.value = mouseInfluence;
      
      // Update ripples more efficiently
      const rippleArray = ripples.slice(0, 10).map(ripple => 
        new THREE.Vector3(ripple.x, ripple.y, ripple.time)
      );
      // Fill remaining slots
      while (rippleArray.length < 10) {
        rippleArray.push(new THREE.Vector3(0, 0, -1));
      }
      materialRef.current.uniforms.u_ripples.value = rippleArray;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[20, 20, 32, 32]} />
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
  // Optimize mouse tracking with useRef to avoid re-renders
  const mousePosition = useRef(new THREE.Vector2(0, 0));
  const [mouseInfluence, setMouseInfluence] = useState(0);
  // Simplify ripples to avoid complex state updates
  const ripples = useRef<Array<{ x: number; y: number; time: number }>>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(mq.matches);
    };
    update();
    if (mq.addEventListener) mq.addEventListener("change", update);
    else mq.addListener(update);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", update);
      else mq.removeListener(update);
    };
  }, []);

  // Mouse interaction handlers - optimized to avoid re-renders
  useEffect(() => {
    let animationFrame: number;
    
    const handleMouseMove = (event: MouseEvent) => {
      // Throttle mouse updates
      if (animationFrame) return;
      
      animationFrame = requestAnimationFrame(() => {
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = -(event.clientY / window.innerHeight) * 2 + 1;
        mousePosition.current.set(x, y);
        setMouseInfluence(1.0);
        animationFrame = 0;
      });
    };

    const handleMouseLeave = () => {
      setMouseInfluence(0);
    };

    const handleClick = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = -(event.clientY / window.innerHeight) * 2 + 1;
      const currentTime = Date.now() / 1000;
      
      // Update ripples directly in ref to avoid state updates
      ripples.current = [
        ...ripples.current.filter(ripple => currentTime - ripple.time < 3),
        { x, y, time: currentTime }
      ].slice(-10);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('click', handleClick);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  // Removed separate ripple cleanup - now handled in useFrame for better performance

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

  return (
    <div className="fixed inset-0 -z-10" style={{ background: "rgba(0, 0, 0, 0.95)" }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Fewer planes with much higher amplitude for testing */}
        <FlurryPlane
          color1={colors[0]}
          color2={colors[8]}
          color3={colors[2]}
          opacity={0.4}
          frequency={1.0}
          amplitude={2.0}
          position={[0, 0, -2]}
          rotation={[0, 0, 0]}
          scale={[1.2, 1.2, 1]}
          mousePosition={mousePosition.current}
          mouseInfluence={mouseInfluence}
          ripples={ripples.current}
        />
        <FlurryPlane
          color1={colors[1]}
          color2={colors[6]}
          color3={colors[9]}
          opacity={0.3}
          frequency={0.8}
          amplitude={1.5}
          position={[2, -1, -4]}
          rotation={[0.1, 0.2, 0.05]}
          scale={[1.5, 1.5, 1]}
          mousePosition={mousePosition.current}
          mouseInfluence={mouseInfluence}
          ripples={ripples.current}
        />
      </Canvas>
    </div>
  );
};

export default FlurryBackground;
