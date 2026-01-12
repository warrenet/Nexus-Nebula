import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";

interface NebulaBackgroundProps {
  isActive: boolean;
  particleCount?: number;
}

function NebulaParticles({
  isActive,
  particleCount = 5000,
}: NebulaBackgroundProps) {
  const ref = useRef<THREE.Points>(null);
  const [opacity, setOpacity] = useState(0);

  // Generate random particle positions in a sphere
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 5;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, [particleCount]);

  // Lazy GPU spin-up: fade in when active, fade out when inactive
  useEffect(() => {
    if (isActive) {
      const fadeIn = setInterval(() => {
        setOpacity((prev) => {
          if (prev >= 0.6) {
            clearInterval(fadeIn);
            return 0.6;
          }
          return prev + 0.05;
        });
      }, 50);
      return () => clearInterval(fadeIn);
    } else {
      const fadeOut = setInterval(() => {
        setOpacity((prev) => {
          if (prev <= 0) {
            clearInterval(fadeOut);
            return 0;
          }
          return prev - 0.05;
        });
      }, 50);
      return () => clearInterval(fadeOut);
    }
  }, [isActive]);

  // Only animate when active to save battery
  useFrame((state, delta) => {
    if (ref.current && isActive && opacity > 0) {
      ref.current.rotation.x += delta * 0.02;
      ref.current.rotation.y += delta * 0.03;
    }
  });

  if (opacity <= 0 && !isActive) {
    return null; // Completely unmount when not visible
  }

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#8B5CF6"
        size={0.02}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={opacity}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

function InnerNebula({ isActive }: { isActive: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const positions = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1 + Math.random() * 2;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    return positions;
  }, []);

  useFrame((state, delta) => {
    if (ref.current && isActive) {
      ref.current.rotation.x -= delta * 0.05;
      ref.current.rotation.y -= delta * 0.04;
    }
  });

  return (
    <Points ref={ref} positions={particles} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#06B6D4"
        size={0.03}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={isActive ? 0.8 : 0}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

/**
 * NebulaBackground - GPU-accelerated nebula with Dynamic Viewport Loading
 * Per 2026 Sovereign Spec: Only spins up when Mission tab is active
 */
export function NebulaBackground({ isActive }: { isActive: boolean }) {
  // Don't render Canvas at all when inactive for maximum battery savings
  if (!isActive) {
    return null;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
      gl={{
        antialias: false, // Save GPU
        powerPreference: "low-power",
      }}
    >
      {/* eslint-disable-next-line react/no-unknown-property */}
      <color attach="background" args={["#0A0A0F"]} />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <ambientLight intensity={0.5} />
      <NebulaParticles isActive={isActive} particleCount={3000} />
      <InnerNebula isActive={isActive} />
    </Canvas>
  );
}

export default NebulaBackground;
