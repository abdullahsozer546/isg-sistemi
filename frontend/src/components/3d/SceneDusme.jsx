import React from 'react';
import { Box, Cylinder, Text } from '@react-three/drei';

export default function SceneDusme() {
  return (
    <group>
      {/* İskele / Platform */}
      <Box args={[4, 0.2, 4]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#8B4513" />
      </Box>

      {/* İskele Ayakları */}
      <Cylinder args={[0.1, 0.1, 4]} position={[-1.8, 0, -1.8]}>
        <meshStandardMaterial color="#666666" />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 4]} position={[1.8, 0, -1.8]}>
        <meshStandardMaterial color="#666666" />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 4]} position={[-1.8, 0, 1.8]}>
        <meshStandardMaterial color="#666666" />
      </Cylinder>
      <Cylinder args={[0.1, 0.1, 4]} position={[1.8, 0, 1.8]}>
        <meshStandardMaterial color="#666666" />
      </Cylinder>

      {/* Korkuluk (Sadece 3 tarafta var, 1 taraf açık tehlike!) */}
      <Box args={[4, 0.1, 0.1]} position={[0, 3, -1.9]}>
        <meshStandardMaterial color="#ffff00" />
      </Box>
      <Box args={[0.1, 0.1, 4]} position={[-1.9, 3, 0]}>
        <meshStandardMaterial color="#ffff00" />
      </Box>
      <Box args={[0.1, 0.1, 4]} position={[1.9, 3, 0]}>
        <meshStandardMaterial color="#ffff00" />
      </Box>

      {/* Eksik Korkuluk Uyarı Alanı */}
      <Box args={[4, 0.1, 0.1]} position={[0, 2.5, 1.9]}>
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} transparent opacity={0.5} />
      </Box>

      {/* Uyarı Metni */}
      <Text position={[0, 4, 0]} fontSize={0.4} color="#ff3333" anchorX="center" anchorY="middle">
        TEHLİKE: DÜŞME RİSKİ (Eksik Korkuluk)
      </Text>
    </group>
  );
}
