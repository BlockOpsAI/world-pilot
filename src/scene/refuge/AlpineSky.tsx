import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const skyVertexShader = `
precision highp float;
varying vec3 vDirection;
void main() {
  vDirection = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const skyFragmentShader = `
precision highp float;
varying vec3 vDirection;
uniform float night;
uniform float time;
uniform vec3 sunDirection;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  vec3 d = normalize(vDirection);
  float height = max(d.y, 0.0);
  float dusk = pow(1.0 - height, 3.5);

  // Dusk gradient: warm golden peach at horizon fading to dusk slate blue
  vec3 day = mix(vec3(0.16, 0.28, 0.43), vec3(0.96, 0.62, 0.28), dusk);
  day = mix(day, vec3(0.88, 0.57, 0.32), exp(-pow((height - 0.30) * 4.5, 2.0)) * 0.42);
  vec3 dark = mix(vec3(0.009, 0.018, 0.046), vec3(0.055, 0.095, 0.14), dusk);
  vec3 color = mix(day, dark, night);

  // Setting sun glow & halo
  vec3 settingSun = normalize(sunDirection - vec3(0.0, night * 0.72, 0.0));
  float distanceToSun = length(d - settingSun);
  float halo = exp(-distanceToSun * 5.0) * 0.48;
  float disc = 1.0 - smoothstep(0.016, 0.021, distanceToSun);
  color += vec3(1.0, 0.70, 0.32) * (halo + disc * 0.95) * (1.0 - night);

  // Cirrus clouds with multi-octave FBM advection
  vec2 cloudUV = d.xz / max(d.y + 0.25, 0.12);
  cloudUV = cloudUV * vec2(3.0, 16.0) + vec2(time * 0.0015, time * 0.003);
  float cloudNoise = noise(cloudUV) * 0.57 + noise(cloudUV * 2.07) * 0.28 + noise(cloudUV * 4.13) * 0.15;
  float clouds = smoothstep(0.52, 0.76, cloudNoise) * smoothstep(0.08, 0.28, d.y) * (1.0 - smoothstep(0.72, 0.96, d.y));
  color = mix(color, mix(vec3(0.98, 0.75, 0.46), vec3(0.09, 0.13, 0.19), night), clouds * (0.20 - night * 0.12));

  // Procedural twinkling stars
  vec2 skyUV = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0)));
  vec2 grid = skyUV * vec2(180.0, 210.0);
  vec2 cell = floor(grid);
  float seed = hash(cell);
  vec2 offset = vec2(hash(cell + 17.0), hash(cell + 43.0));
  float star = (1.0 - smoothstep(0.015, 0.13, length(fract(grid) - offset))) * step(0.977, seed);
  float starsVisible = smoothstep(0.35, 0.95, night) * smoothstep(0.02, 0.22, d.y);
  color += mix(vec3(0.60, 0.76, 1.0), vec3(1.0, 0.90, 0.72), seed) * star * starsVisible * (0.65 + 0.12 * sin(time * 0.23 + seed * 90.0));

  // Milky Way band
  float band = exp(-pow((d.x * 0.5 + d.y * 0.25 - d.z * 0.18) * 9.0, 2.0));
  color += vec3(0.018, 0.024, 0.04) * band * starsVisible;
  color *= 1.0 - clouds * night * 0.16;
  color = mix(vec3(0.035, 0.05, 0.065), color, smoothstep(-0.12, 0.02, d.y));

  gl_FragColor = vec4(color, 1.0);
}
`;

export const sunsetDirection = new THREE.Vector3(0.20, 0.43, 0.94).normalize();

export const AlpineSky: React.FC<{ night?: number }> = ({ night = 0.05 }) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = React.useMemo(() => ({
    night: { value: night },
    time: { value: 0 },
    sunDirection: { value: sunsetDirection.clone() }
  }), []);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
      materialRef.current.uniforms.night.value = night;
    }
  });

  return (
    <mesh position={[0, 0, 0]}>
      <sphereGeometry args={[750, 36, 36]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={skyVertexShader}
        fragmentShader={skyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
};
