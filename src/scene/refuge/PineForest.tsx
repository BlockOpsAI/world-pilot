import React, { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PINE_TREES, heightAt } from './refugeMath';

/**
 * Procedural alpine pine tree geometry:
 * Realistic tapered wood trunk + tiered drooping needle foliage layers.
 */
function createPineTreeGeometry(variant: number): { trunkGeo: THREE.BufferGeometry; foliageGeo: THREE.BufferGeometry } {
  const trunkGeo = new THREE.CylinderGeometry(0.08, 0.28, 9.5, 8);
  trunkGeo.translate(0, 4.75, 0);

  // Grouped tiered foliage cones for realistic drooping pine silhouette
  const foliageGeos: THREE.BufferGeometry[] = [];
  const tiers = 7;
  for (let i = 0; i < tiers; i++) {
    const t = i / tiers;
    const y = 2.0 + t * 7.2;
    const radius = (1.0 - t * 0.85) * (1.8 + variant * 0.2);
    const height = 1.9 - t * 0.4;
    const cone = new THREE.ConeGeometry(radius, height, 7);
    cone.translate(0, y, 0);
    foliageGeos.push(cone);
  }

  // Merge foliage cones into single geometry
  const foliageGeo = mergeBufferGeometries(foliageGeos);
  return { trunkGeo, foliageGeo };
}

function mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = new THREE.BufferGeometry();
  const posArr: number[] = [];
  const normArr: number[] = [];

  for (const g of geometries) {
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    if (!p) continue;
    const idx = g.getIndex();
    if (idx) {
      for (let i = 0; i < idx.count; i++) {
        const v = idx.getX(i);
        posArr.push(p.getX(v), p.getY(v), p.getZ(v));
        if (n) normArr.push(n.getX(v), n.getY(v), n.getZ(v));
      }
    } else {
      for (let i = 0; i < p.count; i++) {
        posArr.push(p.getX(i), p.getY(i), p.getZ(i));
        if (n) normArr.push(n.getX(i), n.getY(i), n.getZ(i));
      }
    }
  }

  merged.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
  if (normArr.length) merged.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3));
  merged.computeVertexNormals();
  return merged;
}

export const PineForest: React.FC = () => {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const foliageRef = useRef<THREE.InstancedMesh>(null);

  const { trunkGeo, foliageGeo } = useMemo(() => createPineTreeGeometry(0), []);

  useEffect(() => {
    if (!trunkRef.current || !foliageRef.current) return;

    const dummy = new THREE.Object3D();
    PINE_TREES.forEach((tree, idx) => {
      const y = heightAt(tree.x, tree.z);
      dummy.position.set(tree.x, y - 0.1, tree.z);
      dummy.rotation.set(0, tree.rotation, 0);
      dummy.scale.set(tree.scale, tree.scale, tree.scale);
      dummy.updateMatrix();

      trunkRef.current!.setMatrixAt(idx, dummy.matrix);
      foliageRef.current!.setMatrixAt(idx, dummy.matrix);
    });

    trunkRef.current.instanceMatrix.needsUpdate = true;
    foliageRef.current.instanceMatrix.needsUpdate = true;
  }, []);

  return (
    <group>
      {/* Wood trunks */}
      <instancedMesh
        ref={trunkRef}
        args={[trunkGeo, undefined, PINE_TREES.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#2d2218" roughness={0.92} metalness={0.04} />
      </instancedMesh>

      {/* Pine needle crowns */}
      <instancedMesh
        ref={foliageRef}
        args={[foliageGeo, undefined, PINE_TREES.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#1f3827" roughness={0.78} metalness={0.02} />
      </instancedMesh>
    </group>
  );
};
