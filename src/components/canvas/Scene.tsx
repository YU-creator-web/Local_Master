'use client';

import { Canvas } from '@react-three/fiber';
import { View } from '@react-three/drei';

export const Scene = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`relative ${className}`}>
      <Canvas
        className="pointer-events-none"
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        dpr={[1, 2]}
      >
        <View.Port />
      </Canvas>
      {children}
    </div>
  );
};

export const ThreeCanvas = ({ children }: { children: React.ReactNode }) => {
    return (
        <Canvas
            className="w-full h-full"
            camera={{ position: [0, 0, 5], fov: 50 }}
            dpr={[1, 2]}
            gl={{ alpha: true, antialias: true }}
        >
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            {children}
        </Canvas>
    )
}
