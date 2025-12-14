'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const GoldParticles = ({ count = 500 }) => {
  const mesh = useRef<THREE.Points>(null);
  
  // Create random positions and speeds for particles
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      const speed = Math.random() * 0.002;
      temp.push({ x, y, z, speed, initialY: y });
    }
    return temp;
  }, [count]);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    particles.forEach((p, i) => {
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
    });
    return pos;
  }, [count, particles]);

  useFrame((state) => {
    if (mesh.current) {
        // Rotate the entire cloud slowly
        mesh.current.rotation.y += 0.0005;
        
        // Update individual y positions for a "rising" or "floating" effect
        const positions = mesh.current.geometry.attributes.position.array as Float32Array;
        for(let i = 0; i < count; i++) {
             let y = positions[i * 3 + 1];
             y += particles[i].speed;
             
             // Reset if too high
             if (y > 5) {
                 y = -5;
             }
             positions[i * 3 + 1] = y;
        }
        mesh.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#FFD700" // Gold
        transparent
        opacity={0.8}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
