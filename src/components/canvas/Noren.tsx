'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

export const Noren = () => {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Gentle swaying motion - complex wave
      const t = state.clock.getElapsedTime();
      meshRef.current.rotation.x = Math.sin(t * 0.5) * 0.05;
    }
  });

  return (
    <group ref={meshRef} position={[0, 1.2, 0]}>
        {/* Rod (Pole) */}
        <mesh position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, 3.5, 32]} />
          <meshStandardMaterial color="#5D4037" roughness={0.6} />
        </mesh>

        {/* Noren Panels */}
        {[-1.1, 0, 1.1].map((x, i) => (
            <group key={i} position={[x, 0, 0]}>
                {/* Panel Geometry (Thinner, Plane-like) */}
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 2.5, 0.02]} />
                    {/* Shinise Indigo (Katsu-iro) or Dark Brown based on theme */}
                    <meshStandardMaterial 
                        color="#3E2723" 
                        roughness={0.9} // Fabric-like
                        opacity={1}
                        transparent={false}
                    />
                </mesh>
            </group>
        ))}
        
        {/* Text on center panel - Stamped look */}
        <Text
            position={[0, 0, 0.03]} // Slightly in front
            fontSize={0.8}
            color="#EFEFEF" // Slightly off-white
            fontWeight="bold"
            letterSpacing={0.1}
            anchorX="center"
            anchorY="middle"
        >
            老舗
        </Text>
    </group>
  );
};
