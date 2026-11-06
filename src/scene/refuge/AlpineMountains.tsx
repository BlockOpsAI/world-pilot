import React, { useMemo } from 'react';
import * as THREE from 'three';
import { mountainHeight, mountainColor, mix } from './refugeMath';

function buildMountainGeometry(
  nx: number,
  nz: number,
  bounds: [number, number, number, number],
  distant: boolean
): THREE.BufferGeometry {
  const [minX, maxX, minZ, maxZ] = bounds;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = mix(minX, maxX, i / nx);
      const z = mix(minZ, maxZ, j / nz);
      const y = mountainHeight(x, z, distant);

      const slope = Math.hypot(
        mountainHeight(x + 1.0, z, distant) - mountainHeight(x - 1.0, z, distant),
        mountainHeight(x, z + 1.0, distant) - mountainHeight(x, z - 1.0, distant)
      );

      positions.push(x, y, z);
      const [cr, cg, cb] = mountainColor(x, y, z, slope);
      colors.push(cr, cg, cb);

      if (i < nx && j < nz) {
        const a = j * (nx + 1) + i;
        const b = a + nx + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export const AlpineMountains: React.FC = () => {
  const ridgeGeo = useMemo(() => buildMountainGeometry(150, 75, [-850, 850, 100, 680], false), []);
  const distantGeo = useMemo(() => buildMountainGeometry(100, 50, [-1100, 1100, 480, 1150], true), []);

  React.useEffect(() => () => {
    ridgeGeo.dispose();
    distantGeo.dispose();
  }, [ridgeGeo, distantGeo]);

  return (
    <group>
      {/* Front mountain ridge */}
      <mesh geometry={ridgeGeo} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.88} metalness={0.06} />
      </mesh>

      {/* Distant mountain peaks */}
      <mesh geometry={distantGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.92} metalness={0.04} />
      </mesh>
    </group>
  );
};
