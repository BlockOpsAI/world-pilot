import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

const auroraVertexShader = `
varying vec2 vUv;
uniform float time;
uniform float phase;

void main() {
  vUv = uv;
  vec3 p = position;
  p.x += sin(uv.x * 12.0 + time * 0.25 + phase) * (8.0 + uv.y * 14.0);
  p.z += sin(uv.x * 18.0 - time * 0.18 + phase) * 16.0;
  p.y += sin(uv.x * 8.0 + time * 0.22 + phase) * 10.0;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const auroraFragmentShader = `
precision highp float;
varying vec2 vUv;
uniform float time;
uniform float phase;
uniform float visibility;

void main() {
  float u = vUv.x;
  float v = vUv.y;
  float flow = u * 48.0 + sin(u * 13.0 + time * 0.2 + phase) * 2.2;
  float broad = 0.50 + 0.50 * sin(flow + time * 0.25 + phase);
  float filament = pow(0.5 + 0.5 * sin(flow * 5.3 + sin(u * 67.0 + phase)), 5.0);
  float lace = 0.64 + 0.36 * sin(u * 260.0 + time * 0.3 + sin(u * 73.0) * 2.0);
  float hem = 0.13 + 0.038 * sin(u * 23.0 + time * 0.15 + phase);
  float lowerEdge = smoothstep(hem - 0.035, hem + 0.06, v);
  float falloff = exp(-max(v - hem, 0.0) * 3.6) * (1.0 - smoothstep(0.65, 1.0, v));
  float ends = smoothstep(0.0, 0.12, u) * (1.0 - smoothstep(0.85, 1.0, u));
  float alpha = lowerEdge * falloff * ends * (0.27 + broad * 0.36 + filament * 0.25)
    * lace * visibility;

  vec3 green = vec3(0.18, 0.85, 0.52);
  vec3 turquoise = vec3(0.13, 0.62, 0.78);
  vec3 violet = vec3(0.48, 0.28, 0.72);

  vec3 color = mix(green, turquoise, smoothstep(0.20, 0.58, v));
  color = mix(color, violet, smoothstep(0.48, 0.88, v) * 0.75);
  color += vec3(0.2, 0.35, 0.15) * exp(-pow((v - hem - 0.05) * 20.0, 2.0));

  gl_FragColor = vec4(color, alpha);
}
`;

interface AuroraCurtainProps {
  layer: number;
  zOffset: number;
  yOffset: number;
  visibility: number;
}

const AuroraCurtain: React.FC<AuroraCurtainProps> = ({ layer, zOffset, yOffset, visibility }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const phase = layer * 1.85;

  const uniforms = useMemo(() => ({
    time: { value: 0 },
    phase: { value: phase },
    visibility: { value: visibility },
  }), [phase, visibility]);

  useFrame((state) => {
    if (matRef.current) {
      matRef.current.uniforms.time.value = state.clock.getElapsedTime();
      matRef.current.uniforms.visibility.value = visibility;
    }
  });

  return (
    <mesh position={[layer * 15, yOffset, zOffset]} renderOrder={-15 + layer}>
      <planeGeometry args={[540, 140, 96, 16]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={auroraVertexShader}
        fragmentShader={auroraFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};

export const AuroraBorealis: React.FC<{ visibility?: number }> = ({ visibility = 0.85 }) => {
  return (
    <group position={[0, 0, 0]}>
      {/* 3 Layered Curtains over Northern Alpine Ridge */}
      <AuroraCurtain layer={0} zOffset={260} yOffset={95} visibility={visibility} />
      <AuroraCurtain layer={1} zOffset={320} yOffset={110} visibility={visibility * 0.85} />
      <AuroraCurtain layer={2} zOffset={380} yOffset={125} visibility={visibility * 0.7} />
    </group>
  );
};
