import React, { useMemo } from 'react';
import * as THREE from 'three';
import { heightAt, groundColor, mix } from './refugeMath';

function buildTerrainGeometry(nx: number, nz: number, bounds: [number, number, number, number]): THREE.BufferGeometry {
  const [minX, maxX, minZ, maxZ] = bounds;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = mix(minX, maxX, i / nx);
      const z = mix(minZ, maxZ, j / nz);
      const y = heightAt(x, z);

      const slope = Math.hypot(
        heightAt(x + 0.5, z) - heightAt(x - 0.5, z),
        heightAt(x, z + 0.5) - heightAt(x, z - 0.5)
      );

      positions.push(x, y, z);
      const [cr, cg, cb] = groundColor(x, y, z, slope);
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

export const AlpineTerrain: React.FC = () => {
  const terrainGeo = useMemo(() => buildTerrainGeometry(120, 120, [-125, 125, -125, 125]), []);

  React.useEffect(() => () => {
    terrainGeo.dispose();
  }, [terrainGeo]);

  return (
    <mesh geometry={terrainGeo} receiveShadow castShadow>
      <meshStandardMaterial vertexColors roughness={0.94} metalness={0.03} />
    </mesh>
  );
};
