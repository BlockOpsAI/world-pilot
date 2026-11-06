# Feuille de route — rendre les scènes 3D de WorldPilot plus réalistes

> **État au 4 octobre 2026.** Trois étapes sur cinq sont livrées (1, 4, 5). Deux étapes (HDRI global, SSAO) ont été écartées après analyse : leur bénéfice est marginal ou mal ciblé pour ce projet, et leur coût (dépendance asset externe, coût GPU, risque XR) n'est pas justifié par une capture démontrant un défaut réel. Ce document conserve l'historique des décisions pour traçabilité.

## Objectif visuel

Donner aux scènes terrestres et aux objets proches une apparence plus crédible : échelle cohérente, éclairage et reflets plausibles, ombres de contact, matériaux qui répondent correctement à la lumière, modèles avec une silhouette et des détails réels. Le réalisme doit venir principalement de l’éclairage, des assets et de matériaux crédibles. Ajouter du bloom, du grain, du contraste ou des lumières colorées ne rend pas à lui seul une scène photoréaliste.

Garder les styles de science-fiction et de fantaisie quand le thème le demande. La première scène de référence doit être `earth-atelier`, avec une table, une chaise, un petit objet et un sol montrés dans des conditions reproductibles. Ne pas modifier la logique WorldIR, les interactions, les colliders Rapier ou les données de scène pour obtenir un résultat visuel.

## Décisions techniques à respecter

1. Conserver Three.js 0.165.0, React Three Fiber v8 et l’intégration XR existante. N’effectuer aucune mise à niveau de dépendances sans traiter séparément les compatibilités Rapier, XR et post-traitement.
2. Conserver **un seul** propriétaire du rendu de frame. Il existe déjà un composer manuel dont le rendu est déclenché par `useFrame(..., 1)`. Ne pas monter par-dessus un second `EffectComposer` R3F qui prendrait lui aussi le contrôle du rendu.
3. Le mode XR doit continuer à passer par `gl.render(scene, camera)` et ne doit pas recevoir de post-effets caméra coûteux ou déformants (aberration chromatique, vignette marquée, profondeur de champ forte).
4. Garder les ressources externes avec une licence vérifiable et enregistrer leur source/licence dans un inventaire si de nouveaux assets sont ajoutés.

## Plan d’implémentation

### Étape 1 — stabiliser la chaîne couleur et le tone mapping — ✅ LIVRÉE

La chaîne linéaire vers l’écran est en place : `RenderPass → UnrealBloomPass → ShaderPass de grade léger → OutputPass` dans [`src/scene/CinematicPostProcessing.tsx`](src/scene/CinematicPostProcessing.tsx).

- Le `ShaderPass` personnalisé (`CinematicColorGradingShader`) ne refait **pas** de tone mapping ACES ni de conversion sRGB. Il préserve les highlights > 1.0 pour le tone mapper final et délègue la conversion de sortie à `OutputPass`.
- `OutputPass` est en dernière position et lit les réglages `toneMapping` et `outputColorSpace` du renderer.
- Le mode XR bypass le composer : `gl.xr.isPresenting → gl.render(scene, camera)`.
- Les presets neutres existent : [`src/scene/renderingPolicy.ts`](src/scene/renderingPolicy.ts) définit `studio_neutral` et `standard` avec `useComposer: false`, aberration chromatique = 0, grain = 0, vignette = 0, bloom = 0. Le rendu direct (notamment XR) conserve la même conversion de sortie.
- `preserveDrawingBuffer: true` est conservé pour la capture d’écran.
- Les presets artistiques (`cinematic`, `golden_hour`, `cyberpunk_neon`) gardent leurs effets plus prononcés.

Aucune action restante sur cette étape.

### Étape 2 — reflets d’environnement HDR — ⛔ ÉCARTÉE

**Décision : ne pas ajouter d’HDRI global.**

Motivation :
- Le projet dispose déjà d’un environnement IBL procédural via `Environment` + `Lightformers` Drei ([`src/scene/ArchitecturalStage.tsx`](src/scene/ArchitecturalStage.tsx)), qui s’adapte par thème.
- Un HDRI « atelier softbox » ne conviendrait qu’à `earth-atelier`. Pour Mars, la Lune, l’orbital, le cyberpunk — la majorité du catalogue — il serait inadapté. Le document original reconnaissait lui-même qu’il faudrait « prévoir plus tard un profil par famille de thèmes », ce qui revient à réinventer le système thématique déjà en place.
- Ajouter un asset HDR externe réintroduirait une dépendance licence/poids/téléchargement que le système actuel évite.

Si un HDRI est un jour voulu, le borner strictement à `earth-atelier` et mesurer le gain visuel réel vs les Lightformers actuels avant tout déploiement.

Réglages d’éclairage déjà en place :
- Lumière directionnelle principale conservée comme lumière-clé.
- Lumière hémisphérique réduite (0.38–0.42) pour garder des zones d’ombre visibles.
- `shadow-normalBias={0.035}` et `shadow-bias={-0.00015}` pour éliminer l’acné d’ombre sans décoller les ombres.
- `FireFlickerLight` n’a pas de `castShadow` (le risque de shadow-map cubique coûteux est évité).

### Étape 3 — occlusion ambiante (SSAO) — ⛔ ÉCARTÉE

**Décision : ne pas intégrer `SSAOPass`.**

Motivation :
- La scène est majoritairement un sol plat 160×160. L’AO ne révèle rien sur une surface plane infinie.
- Le contact objet/sol est déjà géré par la lumière directionnelle + `normalBias`.
- Le document original prévoyait lui-même de le couper en XR et de le retirer si le coût GPU était trop élevé — signal que ce n’est pas essentiel.
- Aucune capture n’a démontré de défaut de contact visible justifiant cet ajout.

Si un défaut de contact apparaît sur un asset héros, traiter d’abord par une ombre de contact locale ou un `normalBias` ajusté avant d’envisager le SSAO.

### Étape 4 — protéger les matériaux GLB — ✅ LIVRÉE

[`src/scene/materialOverrides.ts`](src/scene/materialOverrides.ts) implémente `applyMaterialOverrides` qui :

- clone les matériaux au lieu d’écraser les matériaux PBR importés par `useGLTF`/glTF ;
- préserve `map`, `normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `emissiveMap` et les groupes de matériaux ;
- ne modifie que les propriétés demandées (rugosité, couleur, clearcoat, repeat) ;
- prend en charge `material` comme tableau et évite de partager une instance mutable entre objets ;
- protège verre/transmission, surfaces transparentes, alphaTest, emissive et ne multiplie pas la couleur par un tint quand une map existe.

`PBRMaterial` et [`src/scene/pbrMaterials.tsx`](src/scene/pbrMaterials.tsx) restent disponibles comme matériaux de secours stylisés (CanvasTexture 512×512). La priorité visuelle reste un petit lot d’assets GLB propres avec leurs maps.

Espaces couleur respectés : albedo/emissive en `THREE.SRGBColorSpace` ; normal, roughness, metallic, occlusion en données linéaires. Le GLB glTF est la source de vérité.

Aucune action restante sur cette étape.

### Étape 5 — corriger la mise en scène — ✅ LIVRÉE (thèmes riches) / `earth-atelier` gardé neutre par choix

[`src/scene/ArchitecturalStage.tsx`](src/scene/ArchitecturalStage.tsx) propose déjà 6 `stageStyle` architecturaux cohérents avec plinthes, colonnades, halo luminaire, etc. :

- `pavilion` (travertine, louvers chêne, halo)
- `luxury_gallery` (Calacatta Gold, colonnade travertine, bronze)
- `supercar_studio` (obsidienne, skyline, softbox)
- `high_tech_cleanroom` (micro-ciment, basalt slats, coffer)
- `contemporary_gallery` (béton poli, joints laiton, louvers chêne)
- `culinary_studio` (terrazzo, chêne fumé, cuivre, laiton)

`earth-atelier` reste volontairement neutre (grande dalle + disque circulaire) : c’est le thème de **référence** pour les tests reproductibles, pas une scène de démonstration héros. Le transformer en pièce meublée le rendrait moins utile comme repère.

Les thèmes spatiaux/fantaisie (Mars, Lune, orbital, cyberpunk, céleste) gardent leur décor propre et ne sont pas soumis aux exigences d’intérieur réaliste.

`CAMERA_PRESETS` existe dans [`src/scene/R3FWorldAdapter.tsx`](src/scene/R3FWorldAdapter.tsx) avec un FOV de 42°. Un cadrage rapproché optionnel peut être ajouté plus tard si besoin de gros plan sur les matériaux, mais le contrôle orbit actuel le permet déjà.

Aucune action restante sur cette étape.

## Contrôle visuel et performance attendus

Capturer des images avant/après avec même navigateur, taille de fenêtre, scène, caméra, exposition et preset. Comparer le preset neutre de `earth-atelier`, une scène avec plusieurs objets, un thème non terrestre et le mode XR si un casque est disponible. La scène doit montrer :

- des reflets d’environnement lisibles sur métal/verre, sans que les surfaces non métalliques deviennent chromées ;
- un contact crédible entre objet et table/sol, sans halo noir ni ombre flottante ;
- des hautes lumières qui ne deviennent pas des plaques blanches et des ombres qui gardent des détails ;
- des textures sans répétition évidente à la taille de la scène, avec une netteté suffisante en gros plan ;
- aucune régression de sélection, drag/drop, physique, chargement GLB, capture d’écran, thèmes ni XR.

Cible de départ : garder un mouvement fluide proche de 60 FPS sur desktop avec qualité haute ; pour XR, ne pas accepter une baisse perceptible par rapport au renderer actuel.

## Références techniques

- [Three.js — gestion des couleurs](https://threejs.org/manual/pages/color-management.html) : calcul en Linear-sRGB ; textures de couleur en sRGB ; maps non colorées sans conversion sRGB ; convertir vers l’espace écran à la sortie.
- [Three.js — OutputPass](https://threejs.org/docs/pages/OutputPass.html) : le pass de sortie termine la chaîne et récupère les réglages de tone mapping/espace couleur du renderer.
- [Three.js — PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html) : préfiltrage de l’environnement pour les réflexions PBR dépendantes de la rugosité.
- [Drei — Environment](https://github.com/pmndrs/drei#environment) : chargement d’un environnement pour React Three Fiber.
- [Khronos — glTF](https://github.com/KhronosGroup/glTF) : format runtime PBR adapté à l’échange d’assets 3D.
