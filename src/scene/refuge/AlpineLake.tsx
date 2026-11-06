import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LAKE } from './refugeMath';
import { sunsetDirection } from './AlpineSky';

const waterVertexShader = `
varying vec3 vWorld;
varying vec3 vNormal;
void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorld = worldPos.xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const waterFragmentShader = `
precision highp float;
varying vec3 vWorld;
varying vec3 vNormal;
uniform float time;
uniform float night;
uniform vec3 sunDirection;

void main() {
  vec2 p = vWorld.xz;
  float a = p.x * 1.6 + p.y * 0.75 + time * 0.52;
  float b = p.x * -0.72 + p.y * 2.2 - time * 0.37;
  float c = p.x * 3.4 + p.y * 2.8 + time * 0.65;
  vec2 slope = vec2(cos(a) * 0.016 + cos(c) * 0.007, cos(b) * 0.018 + cos(c) * 0.006);
  vec3 normal = normalize(vec3(-slope.x, 1.0, -slope.y));

  vec3 viewDirection = normalize(cameraPosition - vWorld);
  float fresnel = 0.08 + 0.92 * pow(1.0 - max(dot(viewDirection, normal), 0.0), 4.0);

  // Shore depth gradient
  float shore = clamp(length(vec2(vWorld.x / 32.0, (vWorld.z - 35.0) / 42.0)), 0.0, 1.0);
  vec3 deep = mix(vec3(0.035, 0.13, 0.15), vec3(0.008, 0.033, 0.055), night);
  deep += vec3(0.025, 0.045, 0.035) * pow(shore, 8.0) * (1.0 - night * 0.6);

  // Reflected sky & mountain ambient
  vec3 reflection = mix(vec3(0.96, 0.62, 0.28) * 0.38, vec3(0.16, 0.28, 0.43) * 0.62, smoothstep(0.0, 0.8, fresnel));
  vec3 color = mix(deep, reflection, 0.34 + fresnel * 0.61);

  // Sunset specular glint
  vec3 halfDirection = normalize(viewDirection + sunDirection);
  float glint = pow(max(dot(normal, halfDirection), 0.0), 160.0);
  color += vec3(0.95, 0.68, 0.32) * glint * (1.0 - night) * 0.35;

  // Atmospheric shoreline mist
  float dist = length(cameraPosition - vWorld);
  float mist = 1.0 - exp(-pow(dist * 0.002, 2.0));
  vec3 fogCol = mix(vec3(0.48, 0.36, 0.23), vec3(0.038, 0.065, 0.10), night);
  color = mix(color, fogCol, mist);

  gl_FragColor = vec4(color, 0.94);
}
`;

export const AlpineLake: React.FC<{ night?: number }> = ({ night = 0.05 }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const lakeGeometry = useMemo(() => {
    // Generate smooth elliptical disc
    const geom = new THREE.BufferGeometry();
    const positions: number[] = [0, 0, 0];
    const normals: number[] = [0, 1, 0];
    const indices: number[] = [];
    const segments = 96;

    for (let i = 0; i <= segments; i++) {
      const angle = (i * Math.PI * 2) / segments;
      positions.push(Math.cos(angle) * LAKE.radiusX, 0, Math.sin(angle) * LAKE.radiusZ);
      normals.push(0, 1, 0);
      if (i < segments) {
        indices.push(0, i + 2, i + 1);
      }
    }

    geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    geom.setIndex(indices);
    return geom;
  }, []);

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    night: { value: night },
    sunDirection: { value: sunsetDirection.clone() }
  }), [night]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
      materialRef.current.uniforms.night.value = night;
    }
  });

  return (
    <mesh position={[LAKE.x, 0.02, LAKE.z]} geometry={lakeGeometry} receiveShadow>
      <shaderMaterial
        ref={materialRef}
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite
      />
    </mesh>
  );
};
