import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FIRE_POSITION } from './refugeMath';

const flameVertexShader = `
varying vec2 vUV;
varying vec3 vWorld;
void main() {
  vUV = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorld = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const flameFragmentShader = `
precision highp float;
varying vec2 vUV;
varying vec3 vWorld;
uniform float time;
uniform float strength;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  return noise(p) * 0.53 + noise(p * 2.03 + 13.7) * 0.28
    + noise(p * 4.09 - 7.1) * 0.13 + noise(p * 8.17) * 0.06;
}

void main() {
  float y = vUV.y;
  float phase = vWorld.x * 1.7 + vWorld.z * 0.6;
  vec2 flow = vec2(vUV.x * 5.0 + phase, y * 5.5 - time * 2.2);
  float warp = fbm(flow * 0.7 + vec2(0.0, -time * 0.45));
  float turbulence = fbm(flow + vec2(warp * 2.1, 0.0));
  float sway = (warp - 0.5) * y * 0.30 + sin(y * 9.0 - time * 2.1 + phase) * y * 0.045;
  float width = pow(1.0 - y, 0.8) * 0.34 + (turbulence - 0.5) * 0.30;
  float body = 1.0 - smoothstep(width - 0.025, width + 0.025, abs(vUV.x - 0.5 + sway));
  float holes = mix(0.55, smoothstep(0.18 + y * 0.20, 0.48 + y * 0.18, turbulence), smoothstep(0.15, 0.85, y));
  float alpha = body * holes * smoothstep(0.0, 0.06, y) * (1.0 - smoothstep(0.78, 1.0, y));
  float core = clamp((1.0 - y) * 0.85 + turbulence * 0.65 - abs(vUV.x - 0.5 + sway) * 1.7, 0.0, 1.0);

  vec3 color = mix(vec3(0.70, 0.065, 0.008), vec3(1.0, 0.47, 0.055), smoothstep(0.2, 0.75, core));
  color = mix(color, vec3(1.0, 0.86, 0.42), pow(core, 4.5));
  gl_FragColor = vec4(color * (1.0 + strength * 0.18), alpha * 0.88);
}
`;

export const Campfire: React.FC = () => {
  const flameMatRef1 = useRef<THREE.ShaderMaterial>(null);
  const flameMatRef2 = useRef<THREE.ShaderMaterial>(null);
  const flameMatRef3 = useRef<THREE.ShaderMaterial>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const embersRef = useRef<THREE.Points>(null);

  const flameUniforms = useMemo(() => ({
    time: { value: 0 },
    strength: { value: 1.0 }
  }), []);

  // Embers particles
  const { emberPositions, emberSpeeds } = useMemo(() => {
    const count = 35;
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      pos[i3] = (Math.random() - 0.5) * 0.7;
      pos[i3 + 1] = Math.random() * 1.5 + 0.1;
      pos[i3 + 2] = (Math.random() - 0.5) * 0.7;

      spd[i3] = (Math.random() - 0.5) * 0.3;
      spd[i3 + 1] = Math.random() * 0.8 + 0.5;
      spd[i3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return { emberPositions: pos, emberSpeeds: spd };
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (flameMatRef1.current) flameMatRef1.current.uniforms.time.value = t;
    if (flameMatRef2.current) flameMatRef2.current.uniforms.time.value = t + 0.33;
    if (flameMatRef3.current) flameMatRef3.current.uniforms.time.value = t + 0.66;

    // Flickering fire light
    if (lightRef.current) {
      const flicker = 4.2 + Math.sin(t * 11.5) * 0.5 + Math.sin(t * 19.3) * 0.3 + (Math.random() - 0.5) * 0.4;
      lightRef.current.intensity = Math.max(2.5, flicker);
    }

    // Animate embers rising
    if (embersRef.current) {
      const geo = embersRef.current.geometry;
      const attr = geo.getAttribute('position') as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (let i = 0; i < emberPositions.length / 3; i++) {
        const i3 = i * 3;
        arr[i3 + 1] += emberSpeeds[i3 + 1] * 0.016;
        arr[i3] += Math.sin(t * 3.0 + i) * 0.005;
        arr[i3 + 2] += Math.cos(t * 2.5 + i) * 0.005;

        if (arr[i3 + 1] > 2.2) {
          arr[i3 + 1] = 0.1;
          arr[i3] = (Math.random() - 0.5) * 0.6;
          arr[i3 + 2] = (Math.random() - 0.5) * 0.6;
        }
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <group position={[FIRE_POSITION.x, FIRE_POSITION.y, FIRE_POSITION.z]}>
      {/* Stone fire ring */}
      {Array.from({ length: 9 }).map((_, i) => {
        const a = (i / 9) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.72, 0.08, Math.sin(a) * 0.72]}
            rotation={[0.2, a, 0]}
            castShadow
          >
            <dodecahedronGeometry args={[0.13, 0]} />
            <meshStandardMaterial color="#3c3835" roughness={0.88} />
          </mesh>
        );
      })}

      {/* Pine logs */}
      {[0, 1.05, 2.1, 3.14].map((rot, i) => (
        <mesh key={i} rotation={[0.25, rot, 0.2]} position={[0, 0.12, 0]} castShadow>
          <cylinderGeometry args={[0.07, 0.085, 0.85, 8]} />
          <meshStandardMaterial color="#2b1a11" roughness={0.9} />
        </mesh>
      ))}

      {/* Ash bed & glowing embers bed */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.04, 16]} />
        <meshStandardMaterial color="#1a120c" roughness={0.95} emissive="#ff4500" emissiveIntensity={0.6} />
      </mesh>

      {/* Crossed flame planes */}
      <mesh position={[0, 0.55, 0]}>
        <planeGeometry args={[0.8, 1.1]} />
        <shaderMaterial
          ref={flameMatRef1}
          vertexShader={flameVertexShader}
          fragmentShader={flameFragmentShader}
          uniforms={flameUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[0, Math.PI / 3, 0]}>
        <planeGeometry args={[0.8, 1.1]} />
        <shaderMaterial
          ref={flameMatRef2}
          vertexShader={flameVertexShader}
          fragmentShader={flameFragmentShader}
          uniforms={flameUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0.55, 0]} rotation={[0, (2 * Math.PI) / 3, 0]}>
        <planeGeometry args={[0.8, 1.1]} />
        <shaderMaterial
          ref={flameMatRef3}
          vertexShader={flameVertexShader}
          fragmentShader={flameFragmentShader}
          uniforms={flameUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rising Embers */}
      <points ref={embersRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[emberPositions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.05}
          color="#ffaa33"
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Warm flickering point light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.7, 0]}
        color="#ffa347"
        intensity={4.8}
        distance={14}
        castShadow
        shadow-bias={-0.001}
      />
    </group>
  );
};
