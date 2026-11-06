/**
 * Procedural mathematical equations for Le Refuge:
 * Terrain elevation, Alpine mountain ridges, slope coloring, noise synthesis, and tree placement.
 */

export const LAKE = { x: 0, z: 35, radiusX: 32, radiusZ: 42, level: 0 } as const;
export const FIRE_POSITION = { x: 0, y: 0.12, z: -20 } as const;
export const ROCK_POSITION = { x: 3.2, y: 0.2, z: -19.5 } as const;

export function randomAt(x: number, z: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

export const smooth = (t: number) => t * t * (3 - 2 * t);
export const clamp = (t: number) => Math.max(0, Math.min(1, t));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export function noise(x: number, z: number): number {
  const ix = Math.floor(x), iz = Math.floor(z);
  const u = smooth(x - ix), v = smooth(z - iz);
  const a = randomAt(ix, iz), b = randomAt(ix + 1, iz);
  const c = randomAt(ix, iz + 1), d = randomAt(ix + 1, iz + 1);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

export function lakeDistance(x: number, z: number): number {
  return Math.hypot((x - LAKE.x) / LAKE.radiusX, (z - LAKE.z) / LAKE.radiusZ);
}

export function heightAt(x: number, z: number): number {
  const distance = lakeDistance(x, z);
  const angle = Math.atan2((z - LAKE.z) / LAKE.radiusZ, x / LAKE.radiusX);
  const headlands = smooth(clamp((Math.abs(x) - 4) / 9))
    * (0.025 + Math.max(0, Math.sin(angle * 3 + 0.7)) ** 2 * 0.18
      + noise(x * 0.09 + 17, z * 0.09) * 0.055)
    * Math.exp(-(((distance - 1) / 0.38) ** 2));
  const shore = (distance - 1 + headlands) * 32;
  if (shore < 0) return Math.max(-5.5, shore * 0.65);
  const shoreBlend = smooth(clamp(shore / 18));
  const foothill = 15 * Math.exp(-((x - 67) ** 2 / 1600 + (z + 36) ** 2 / 2400));
  const rim = 17 * smooth(clamp((Math.max(Math.abs(x), Math.abs(z)) - 88) / 37));
  const detail = noise(x * 0.055, z * 0.055) * 2.4
    + noise(x * 0.19, z * 0.19) * 0.4 + noise(x * 0.7, z * 0.7) * 0.065
    + noise(x * 0.36 + 71, z * 0.36) * 0.22;
  return shoreBlend * (1.2 + foothill + rim + detail) + Math.min(shore, 3) * 0.12;
}

export function groundColor(x: number, y: number, z: number, slope: number): [number, number, number] {
  const grain = noise(x * 0.16, z * 0.16);
  const snow = clamp((y - 12 - noise(x * 0.12, z * 0.12) * 4) * 0.7) * clamp(1.4 - slope);
  const shore = clamp(y / (1.2 + noise(x * 0.11, z * 0.11) * 1.4));
  const patches = noise(x * 0.09 + 11, z * 0.09);
  const moss = [
    mix(0.49 + grain * 0.12, 0.19 + patches * 0.19, shore),
    mix(0.40 + grain * 0.10, 0.24 + patches * 0.11, shore),
    mix(0.27 + grain * 0.09, 0.10 + patches * 0.09, shore)
  ];
  const scree = clamp((slope - 0.42) * 1.3);
  return [
    mix(mix(moss[0], 0.38, scree), 0.91, snow),
    mix(mix(moss[1], 0.32, scree), 0.94, snow),
    mix(mix(moss[2], 0.25, scree), 0.96, snow)
  ];
}

export function mountainHeight(x: number, z: number, distant: boolean): number {
  const peaks = distant
    ? [[-700, 790, 210, 310], [-380, 740, 285, 310], [10, 810, 310, 370], [410, 780, 265, 340], [740, 820, 240, 300]]
    : [[-500, 350, 165, 270], [-245, 310, 175, 205], [-65, 420, 230, 230], [150, 370, 190, 200], [380, 380, 220, 240], [610, 400, 170, 250]];
  let height = -16;
  for (const [px, pz, peak, radius] of peaks) {
    const dx = x - px + (noise(x * 0.012, z * 0.012) - 0.5) * 34;
    const dz = (z - pz) * 1.18;
    const angle = Math.atan2(dz, dx);
    const distance = Math.hypot(dx, dz);
    const folds = 1 + Math.sin(angle * 5 + px) * 0.13 + Math.sin(angle * 9 + distance * 0.012) * 0.045;
    const profile = Math.max(0, 1 - distance / (radius * folds));
    height = Math.max(height, profile ** 1.08 * peak - 14);

    const spurX = px + radius * 0.32, spurZ = pz - radius * 0.18;
    const spur = Math.max(0, 1 - Math.hypot((x - spurX) * 0.85, (z - spurZ) * 1.8) / (radius * 0.64));
    height = Math.max(height, spur ** 0.92 * peak * 0.77 - 14);
  }
  const envelope = clamp((height + 14) / 45);
  const warp = noise(x * 0.016, z * 0.016) * 40;
  const ridge = 1 - Math.abs(noise((x + warp) * 0.035, z * 0.019) * 2 - 1);
  const gully = Math.abs(Math.sin(x * 0.072 + z * 0.029 + warp * 0.15));
  return height + envelope * (ridge ** 2 * 19 - gully ** 4 * 6
    + noise(x * 0.09, z * 0.075) * 6 + noise(x * 0.22, z * 0.22) * 2.6);
}

export function mountainColor(x: number, y: number, z: number, slope: number): [number, number, number] {
  const strata = noise(x * 0.07, z * 0.07) * 0.10 + Math.sin(y * 0.33 + x * 0.08) * 0.035;
  const snowline = 62 + noise(x * 0.025, z * 0.025) * 39;
  const snow = clamp((y - snowline) / 12) * clamp((2.1 - slope) * 2.2);
  return [
    mix(0.28 + strata, 0.96, snow),
    mix(0.255 + strata, 0.975, snow),
    mix(0.23 + strata, 1.0, snow)
  ];
}

export interface TreeInstance {
  x: number;
  z: number;
  scale: number;
  rotation: number;
  variant: number;
}

export const PINE_TREES: TreeInstance[] = (() => {
  const list: TreeInstance[] = [];
  for (let x = -110; x < 110; x += 6.5) {
    for (let z = -110; z < 110; z += 6.5) {
      const px = x + randomAt(x, z) * 5.0;
      const pz = z + randomAt(z, x + 7) * 5.0;
      if (lakeDistance(px, pz) < 1.13) continue;
      // Open campsite meadow
      if (Math.abs(px) < 18 && pz > -36 && pz < 35) continue;
      const stand = noise(px * 0.026 + 8, pz * 0.026);
      if (randomAt(x + 81, z) < 0.08 + smooth(stand) * 0.65) continue;
      list.push({
        x: px,
        z: pz,
        scale: 0.55 + randomAt(x + 4, z) ** 0.8 * 1.05,
        variant: Math.floor(randomAt(x, z + 91) * 3),
        rotation: randomAt(z, x) * Math.PI * 2
      });
    }
  }
  return list;
})();
