'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Individual Particle Group Component
const ParticleGroup = ({ count, size, speedFactor, opacity }: { count: number, size: number, speedFactor: number, opacity: number }) => {
  const mesh = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 15; // Spread wider
        pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        
        spd[i] = (Math.random() * 0.005 + 0.002) * speedFactor; // Random speed
    }
    return { positions: pos, speeds: spd };
  }, [count, speedFactor]);

  useFrame((state) => {
    if (mesh.current) {
        // Gentle rotation
        mesh.current.rotation.y += 0.0003 * speedFactor;
        mesh.current.rotation.x += 0.0001 * speedFactor;

        // Access the position attribute
        // In newer three.js/R3F, attributes might be accessed differently or need explicit typing
        const geometry = mesh.current.geometry;
        const positionAttribute = geometry.attributes.position as THREE.BufferAttribute;
        
        if (positionAttribute) {
             const positions = positionAttribute.array as Float32Array;
             
             for(let i = 0; i < count; i++) {
                  let y = positions[i * 3 + 1];
                  // Float upward
                  y += speeds[i];
                  
                  // Wrap around
                  if (y > 7) {
                      y = -7;
                      // Randomize x/z slightly on reset to avoid patterns
                      positions[i * 3] = (Math.random() - 0.5) * 15;
                      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
                  }
                  positions[i * 3 + 1] = y;
             }
             positionAttribute.needsUpdate = true;
        }
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={size}
        color="#D4AF37" // Standard Gold
        transparent
        opacity={opacity}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const GoldParticles = () => {
  return (
    <group>
        {/* Small Dust */}
        <ParticleGroup count={400} size={0.03} speedFactor={0.8} opacity={0.6} />
        {/* Medium Squares */}
        <ParticleGroup count={150} size={0.08} speedFactor={1.0} opacity={0.8} />
        {/* Large Foil */}
        <ParticleGroup count={40} size={0.18} speedFactor={1.2} opacity={0.9} />
    </group>
  );
};
