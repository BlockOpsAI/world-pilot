import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ROCK_POSITION } from './refugeMath';

export const SanctuaryRock: React.FC = () => {
  const rockGeometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1.6, 2);
    const pos = geo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Organic distortion
      const dist = 0.85 + Math.sin(x * 3.5 + y * 2.0) * 0.12 + Math.cos(z * 4.0) * 0.08;
      pos.setXYZ(i, x * dist * 1.2, y * dist * 0.85, z * dist * 1.05);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  React.useEffect(() => () => {
    rockGeometry.dispose();
  }, [rockGeometry]);

  return (
    <group position={[ROCK_POSITION.x, ROCK_POSITION.y + 0.65, ROCK_POSITION.z]}>
      <mesh geometry={rockGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#383d3a"
          roughness={0.92}
          metalness={0.04}
        />
      </mesh>
    </group>
  );
};
