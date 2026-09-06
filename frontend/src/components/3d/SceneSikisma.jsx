import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Cylinder, Text } from '@react-three/drei';

export default function SceneSikisma() {
  const pressRef = useRef();

  useFrame((state) => {
    // Pres makinesinin yukarı aşağı hareketi
    const t = state.clock.getElapsedTime();
    if (pressRef.current) {
      pressRef.current.position.y = 2 + Math.sin(t * 2) * 1.5;
    }
  });

  return (
    <group>
      {/* Zemin/Alt Kalıp */}
      <Box args={[4, 0.5, 3]} position={[0, -0.25, 0]}>
        <meshStandardMaterial color="#333333" />
      </Box>

      {/* Tehlike Bölgesi (Danger Zone) */}
      <Box args={[3.8, 0.1, 2.8]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} transparent opacity={0.5} />
      </Box>

      {/* Hareketli Üst Pres */}
      <Box ref={pressRef} args={[3.5, 1, 2.5]} position={[0, 3, 0]}>
        <meshStandardMaterial color="#555555" />
      </Box>

      {/* Sütunlar */}
      <Cylinder args={[0.2, 0.2, 5]} position={[-1.8, 2.5, -1.2]}>
        <meshStandardMaterial color="#888888" />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 5]} position={[1.8, 2.5, -1.2]}>
        <meshStandardMaterial color="#888888" />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 5]} position={[-1.8, 2.5, 1.2]}>
        <meshStandardMaterial color="#888888" />
      </Cylinder>
      <Cylinder args={[0.2, 0.2, 5]} position={[1.8, 2.5, 1.2]}>
        <meshStandardMaterial color="#888888" />
      </Cylinder>

      {/* Uyarı Metni */}
      <Text position={[0, 4.5, 0]} fontSize={0.4} color="#ff3333" anchorX="center" anchorY="middle">
        TEHLİKE: SIKIŞMA RİSKİ
      </Text>
    </group>
  );
}
