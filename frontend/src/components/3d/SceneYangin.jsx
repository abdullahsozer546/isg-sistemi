import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Sphere, Text } from '@react-three/drei';

export default function SceneYangin() {
  const fireRef = useRef();

  useFrame((state) => {
    // Ateş efekti (Büyüyüp küçülme ve titreme)
    const t = state.clock.getElapsedTime();
    if (fireRef.current) {
      fireRef.current.scale.setScalar(1 + Math.sin(t * 10) * 0.1);
      fireRef.current.position.y = 1 + Math.sin(t * 5) * 0.2;
    }
  });

  return (
    <group>
      {/* Zemin */}
      <Box args={[5, 0.2, 5]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#444444" />
      </Box>

      {/* Yanıcı Madde Varili / Tüp */}
      <Cylinder args={[0.5, 0.5, 1.5]} position={[-1, 0.75, 0]}>
        <meshStandardMaterial color="#8b0000" />
      </Cylinder>
      <Cylinder args={[0.5, 0.5, 1.5]} position={[1, 0.75, 0]}>
        <meshStandardMaterial color="#8b0000" />
      </Cylinder>

      {/* Ateş Küresi */}
      <Sphere ref={fireRef} args={[0.8, 16, 16]} position={[0, 1, 0]}>
        <meshStandardMaterial color="#ff4500" emissive="#ff4500" emissiveIntensity={2} transparent opacity={0.8} wireframe />
      </Sphere>

      {/* Işık */}
      <pointLight position={[0, 2, 0]} color="#ff4500" intensity={5} distance={10} />

      {/* Uyarı Metni */}
      <Text position={[0, 3, 0]} fontSize={0.4} color="#ff3333" anchorX="center" anchorY="middle">
        TEHLİKE: YANGIN / PATLAMA RİSKİ
      </Text>
    </group>
  );
}
