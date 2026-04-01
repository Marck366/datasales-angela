import { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import * as THREE from 'three';

// Colores corporativos Ângela Impact Economy
const COLORS = {
  navy: '#00507B',
  cerulean: '#00AEEF',
  lime: '#B2D235',
};

// Esfera orgánica simplificada (Optimización de polígonos)
const OrganicSphere = ({
  color,
  position,
  scale,
  distort = 0.4,
  speed = 2,
}: {
  color: string;
  position: [number, number, number];
  scale: number;
  distort?: number;
  speed?: number;
}) => {
  return (
    <Float speed={speed} rotationIntensity={1} floatIntensity={2} position={position}>
      <Sphere args={[1, 32, 32]} scale={scale}>
        <MeshDistortMaterial
          color={color}
          envMapIntensity={0.5}
          clearcoat={0.5}
          clearcoatRoughness={0.1}
          metalness={0.1}
          roughness={0.2}
          distort={distort}
          speed={speed}
          transparent
          opacity={0.8}
        />
      </Sphere>
      <pointLight color={color} intensity={1.5} distance={10} />
    </Float>
  );
};

// Escena ultra-ligera sin dependencias externas (Sin Environment)
const Scene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const mouseTarget = useRef({ x: 0, y: 0 });
  const mouseSmooth = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    // Capturamos el puntero (sin setState)
    mouseTarget.current.x = state.pointer.x * 0.25;
    mouseTarget.current.y = state.pointer.y * 0.15;

    // Suavizado manual (lerp)
    mouseSmooth.current.x += (mouseTarget.current.x - mouseSmooth.current.x) * 0.05;
    mouseSmooth.current.y += (mouseTarget.current.y - mouseSmooth.current.y) * 0.05;

    if (groupRef.current) {
      groupRef.current.rotation.y = mouseSmooth.current.x;
      groupRef.current.rotation.x = -mouseSmooth.current.y;
    }
  });

  return (
    <group ref={groupRef}>
      <ambientLight intensity={0.4} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
      <pointLight position={[-10, -10, -10]} intensity={1} color={COLORS.cerulean} />

      {/* Esferas corporativas con geometría optimizada */}
      <OrganicSphere color={COLORS.navy}     position={[-2.5, 1, -1]}    scale={2.2} distort={0.5} speed={1.5} />
      <OrganicSphere color={COLORS.cerulean}  position={[2.5, -1.5, 0.5]}  scale={2.5} distort={0.6} speed={1.2} />
      <OrganicSphere color={COLORS.lime}      position={[0, -2.8, 1.8]}    scale={1.4} distort={0.4} speed={2} />
      <OrganicSphere color={COLORS.cerulean}  position={[4, 2, -2]}       scale={1.8} distort={0.3} speed={2.2} />

      {/* Neblina para suavizar bordes sin Environment pesado */}
      <fog attach="fog" args={['#0F2552', 5, 20]} />
    </group>
  );
};

export const LoginBackground3D = () => {
  return (
    <div className="absolute inset-0 z-0 bg-[#0A1835]">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 40 }}
        dpr={Math.min(window.devicePixelRatio, 2)}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance" 
        }}
        style={{ pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default LoginBackground3D;
