
import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Simple vertex shader focused on smooth animation
const vertexShader = `
  uniform float u_time;
  uniform float u_frequency;
  uniform float u_amplitude;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Simple wave animation
    float wave = sin(pos.x * u_frequency + u_time) * u_amplitude;
    pos.z += wave;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

// Simple fragment shader with time-based color animation
const fragmentShader = `
  uniform float u_time;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform float u_opacity;
  varying vec2 vUv;
  
  void main() {
    float timeFactor = sin(u_time * 0.5) * 0.5 + 0.5;
    vec3 color = mix(u_color1, u_color2, timeFactor);
    gl_FragColor = vec4(color, u_opacity);
  }
`;

interface FlurryPlaneProps {
  color1: THREE.Color;
  color2: THREE.Color;
  opacity: number;
  frequency: number;
  amplitude: number;
  position: [number, number, number];
}

const FlurryPlane: React.FC<FlurryPlaneProps> = ({
  color1,
  color2,
  opacity,
  frequency,
  amplitude,
  position,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = React.useMemo(
    () => ({
      u_time: { value: 0 },
      u_color1: { value: color1 },
      u_color2: { value: color2 },
      u_opacity: { value: opacity },
      u_frequency: { value: frequency },
      u_amplitude: { value: amplitude },
    }),
    [color1, color2, opacity, frequency, amplitude]
  );

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.u_time.value = state.clock.elapsedTime;
    }
  });

  return (
    <mesh position={position}>
      <planeGeometry args={[20, 20, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
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

  // Define colors
  const colors = [
    new THREE.Color(0x3d8b73), // Teal-green
    new THREE.Color(0x4a90e2), // Bright blue
    new THREE.Color(0x87ceeb), // Sky blue
    new THREE.Color(0xffffff), // White
    new THREE.Color(0x2d6a5a), // Darker teal
    new THREE.Color(0x4ea085), // Lighter teal
  ];

  if (reducedMotion) {
    return (
      <div
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, 
            rgba(61, 139, 115, 0.1) 0%, 
            rgba(74, 144, 226, 0.1) 50%, 
            rgba(255, 255, 255, 0.05) 100%
          )`,
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 -z-10" style={{ background: "rgba(0, 0, 0, 0.95)" }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 75 }}
        gl={{ alpha: true, antialias: true }}
      >
        <FlurryPlane
          color1={colors[0]}
          color2={colors[3]}
          opacity={0.3}
          frequency={0.5}
          amplitude={1.0}
          position={[0, 0, -2]}
        />
        <FlurryPlane
          color1={colors[1]}
          color2={colors[2]}
          opacity={0.4}
          frequency={0.3}
          amplitude={0.8}
          position={[1, -1, -3]}
        />
        <FlurryPlane
          color1={colors[4]}
          color2={colors[5]}
          opacity={0.25}
          frequency={0.7}
          amplitude={1.2}
          position={[-1, 1, -4]}
        />
      </Canvas>
    </div>
  );
};

export default FlurryBackground;
