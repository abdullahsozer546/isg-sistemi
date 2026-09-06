import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Box, Text } from '@react-three/drei';

export default function SceneGenel() {
  const gear1 = useRef();
  const gear2 = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (gear1.current && gear2.current) {
      gear1.current.rotation.z = t;
      gear2.current.rotation.z = -t;
    }
  });

  return (
    <group>
      {/* Zemin */}
      <Box args={[5, 0.2, 5]} position={[0, -0.1, 0]}>
        <meshStandardMaterial color="#444444" />
      </Box>

      {/* Temsili Dişli/Makine 1 */}
      <Box ref={gear1} args={[1.5, 1.5, 0.5]} position={[-1, 1, 0]}>
        <meshStandardMaterial color="#555555" />
      </Box>

      {/* Temsili Dişli/Makine 2 */}
      <Box ref={gear2} args={[1.5, 1.5, 0.5]} position={[1, 1, 0]}>
        <meshStandardMaterial color="#555555" />
      </Box>

      {/* Temsili Korumasız Bölge (Kırmızı) */}
      <Box args={[3, 0.1, 1]} position={[0, 0.1, 1]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} transparent opacity={0.5} />
      </Box>

      {/* Uyarı Metni */}
      <Text position={[0, 3, 0]} fontSize={0.4} color="#ff3333" anchorX="center" anchorY="middle">
        TEHLİKE: GENEL İSG İHLALİ
      </Text>
    </group>
  );
}
