# Rendu réaliste léger : plan d'implémentation

**Objectif :** améliorer le rendu local de WorldPilot sans service GPU, sans modifier WorldIR ni les collisions.

**Architecture :** conserver Three.js r165, React 18 et R3F 8. Isoler les réglages de post-traitement, les budgets de qualité et les modifications de matériaux dans des fonctions testables. Conserver un seul propriétaire de frame et le rendu direct en XR.

**Stack :** Three.js, React Three Fiber, Drei, Rapier compatible React 18, tests Node exécutés avec tsx.

## 1. Contrats de rendu

- [ ] Ajouter `src/tests/rendering.test.ts` avec `node:test` et `node:assert/strict`.
- [ ] Vérifier en échec l'absence d'écrêtage HDR, la neutralité du studio, la désactivation effective du bloom nul et le budget des profils.
- [ ] Extraire les réglages dans `src/scene/renderingPolicy.ts`, les appliquer dans `CinematicPostProcessing.tsx`.
- [ ] Exécuter `node --import tsx --test src/tests/rendering.test.ts`.

## 2. Matériaux

- [ ] Tester un modèle Three.js avec plusieurs matériaux, textures couleur/données, transparence et lightmap.
- [ ] Ajouter `src/scene/materialOverrides.ts` : cloner les matériaux modifiés, conserver leurs maps, protéger les surfaces transparentes et émissives des presets globaux.
- [ ] Intégrer dans `GLTFModel` et `LibraryModel`, avec nettoyage limité aux ressources possédées et mise à jour réactive des propriétés.
- [ ] Tester la répétition des textures sans mutation des textures partagées ; ne jamais répéter la lightmap.

## 3. Budget local

- [ ] Ajouter des profils haute qualité, économique et XR avec budget de DPR, MSAA et ombres.
- [ ] Exposer le choix dans les réglages visuels ; appliquer le profil XR pendant une session.
- [ ] Supprimer les ombres cubiques des flammes décoratives.
- [ ] Ne générer que la texture de sol active.
- [ ] Garder les captures existantes et `preserveDrawingBuffer`.

## 4. Dépendances

- [ ] Utiliser Rapier 1.5.0, compatible avec React 18/R3F 8.
- [ ] Retirer les dépendances inutilisées `@react-three/postprocessing` et `postprocessing`.
- [ ] Vérifier `npm ls` et `npm run build`.

## 5. Validation et documentation

- [ ] Exécuter les nouveaux tests, les tests golden, d'audit, de bibliothèque et de causalité spatiale.
- [ ] Vérifier les profils, les presets, une scène chargée et la capture dans le navigateur.
- [ ] Actualiser `UPGRADE_3D.md`, sans présenter comme livrés les assets ou lightmaps absents.

## Limites explicites

Le dépôt ne contient pas de décor avec lightmaps ni de nouveaux assets photoréalistes préparés. Leur production hors ligne, la compression KTX2 du catalogue et les LOD demandent un chantier d'assets distinct. Aucun AO écran ni migration WebGPU n'est ajouté dans ce lot. Les profils sont des budgets explicites, pas une promesse de FPS.

## État initial

- `npm run build` : réussi.
- `npm run test:library` : échec préexistant ligne 3139, « Acte 1 FR doit énoncer la thèse centrale ».
- Nombreuses modifications préexistantes dans le dépôt : ne pas les annuler.
