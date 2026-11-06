import React from 'react';
import { AlpineSky } from './AlpineSky';
import { AlpineMountains } from './AlpineMountains';
import { AlpineLake } from './AlpineLake';
import { PineForest } from './PineForest';
import { AlpineTerrain } from './AlpineTerrain';
import { Campfire } from './Campfire';
import { SanctuaryRock } from './SanctuaryRock';
import { AuroraBorealis } from './AuroraBorealis';
import { useRenderBudget } from '../renderQuality';

export const AlpineRefugeEnvironment: React.FC = () => {
  const renderBudget = useRenderBudget();
  return (
    <group>
      {/* 1. Procedural Twilight Sky Dome with sun halo, cirrus clouds and stars */}
      <AlpineSky night={0.06} />

      {/* Aurora Borealis flowing ribbons in northern sky */}
      <AuroraBorealis visibility={0.75} />

      {/* 2. Alpine Mountain Range with snow peaks and rock strata */}
      <AlpineMountains />

      {/* 3. Calm Reflective Mountain Lake */}
      <AlpineLake night={0.06} />

      {/* 4. Lush Procedural Pine Tree Forest */}
      <PineForest />

      {/* 5. Natural Mossy Ground Terrain */}
      <AlpineTerrain />

      {/* 6. Cozy Foreground Campfire with animated flames and embers */}
      <Campfire />

      {/* 7. Foreground Sanctuary Rock */}
      <SanctuaryRock />

      {/* Warm Sunset Directional Sun */}
      <directionalLight
        key={renderBudget.shadowMapSize}
        position={[-40, 60, 120]}
        color="#ffa866"
        intensity={2.2}
        castShadow
        shadow-mapSize={[renderBudget.shadowMapSize, renderBudget.shadowMapSize]}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-camera-near={0.5}
        shadow-camera-far={250}
        shadow-bias={-0.0003}
      />

      {/* Soft Ambient Mountain Fill */}
      <hemisphereLight
        args={['#7d93ad', '#2a3328', 0.85]}
      />
    </group>
  );
};
