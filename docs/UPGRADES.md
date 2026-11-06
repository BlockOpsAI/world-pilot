# WorldPilot — plan d’amélioration critique

> **État au 4 octobre 2026.** Audit initial du 4 octobre 2026, puis revérification. La majorité des préoccupations P0 (crédibilité, faux succès, sceau cryptographique, contrôle IP codé en dur, contradictions de provenance) sont **livrées**. Trois points sont **écartés** comme sur-engineering pour un hackathon (proxy backend LLM, allowlist webhook, refactor du parseur). Restent quatre points actionnables : corriger `PITCH_MANIFESTO.md`, retirer `mint_nft` du parcours démo, remplir les placeholders de remise, et valider visuellement l’UI de première impression. Ce document conserve l’historique des décisions pour traçabilité.

## 1. Diagnostic et choix de produit

WorldPilot a une idée défendable : aller au-delà de la génération d’une scène et vérifier si l’expérience obtenue fonctionne, puis proposer une correction. Le fil narratif à tester est **intention → scène et logique → interaction → diagnostic → correction minimale → nouvelle vérification**.

**Positionnement recommandé :** faire de WorldPilot un copilote de création et de contrôle qualité pour expériences 3D interactives. Le créateur garde la main ; WorldPilot construit ou modifie une petite expérience, vérifie des propriétés limitées et explique clairement ses résultats. Ne pas vendre un second AI Builder généraliste : la page publique de Victoria VR présente déjà la génération de scènes et d’assets à partir de prompts, l’édition visuelle, la logique sans code et la publication multiplateforme. Le différenciateur doit être visible et complémentaire, pas seulement affirmé.

La consigne du hackathon reste centrale : une personne doit pouvoir décrire quelque chose en langage naturel, obtenir une scène 3D et une logique fonctionnelle dans le navigateur, puis l’explorer ou la modifier. L’IA doit jouer un rôle réel ; les juges peuvent essayer leurs propres prompts. La qualité visuelle, l’usage, la technique, l’originalité et la fonctionnalité comptent également. Voir [l’article officiel sur la période de construction](https://www.victoriavr.com/news/ai-builder-hackathon-2026-the-building-period-2042daf3), les [conditions du hackathon](https://www.victoriavr.com/hackathon/2026/terms) et la page officielle de [VR AI Builder](https://www.victoriavr.com/builder). À la date de cet audit, la date de soumission affichée est le **11 novembre 2026 à 16 h 30 CEST** ; vérifier la page officielle avant de s’y fier.

## 2. Principes d’implémentation

2. **Conserver le cœur du défi.** Ne pas transformer WorldPilot en simple outil de QA : le parcours évalué doit inclure une vraie entrée en langage naturel qui produit/modifie une scène 3D et sa logique.
3. **Faire une expérience verticale avant d’élargir le catalogue.** Un cas complet, compréhensible et reproductible est plus convaincant que de nombreux onglets et démos à moitié autonomes.
4. **Donner une preuve visible à chaque affirmation.** Montrer l’entrée, le résultat, l’action dans la scène, le contrôle appliqué, ses limites et le résultat après correction.
5. **Ne pas lancer de réécriture générale.** Garder Three.js/R3F et l’architecture utiles au cas de démonstration. Reporter les fonctionnalités sans lien direct avec ce parcours.
6. **Ne pas modifier les interactions et les collisions pour gagner uniquement en apparence.** Pour le rendu, suivre [la fiche 3D existante](../UPGRADE_3D.md), désormais close : chaîne colorimétrique, éclairage, ombres, matériaux GLB, échelle et contrôles visuels y sont livrés ou écartés avec motivation.

## 3. Priorité P0 — assainir la crédibilité avant d’ajouter des fonctionnalités

### 3.1 Créer une carte de vérité produit — ✅ LIVRÉE (sauf PITCH_MANIFESTO.md)

Les documents principaux sont déjà honnêtes :
- [`README.md`](../README.md) précise qu’il s’agit d’un prototype et que les résultats doivent être décrits selon ce qu’ils mesurent réellement.
- [`SUBMISSION.md`](../SUBMISSION.md) décrit les résultats du playtest comme heuristiques.
- [`METRICS.md`](../METRICS.md) pose « Never publish an unmeasured number » et sépare signaux d’observation et métriques de publication.
- Aucun score auto-attribué « 10/10 » n’existe dans ces trois documents.

**Point restant :** [`PITCH_MANIFESTO.md`](../PITCH_MANIFESTO.md) contient encore des sur-affirmations en contradiction directe avec le code :
- « il prouve mathématiquement que les règles de votre univers ne peuvent pas être enfreintes » — contredit par [`src/engine/deterministicGuarantor.ts`](../src/engine/deterministicGuarantor.ts) qui indique explicitement « sans preuve formelle de jouabilité ».
- Quatre blocs `✅ Concrétisé :` pour Data-to-3D, Physical Minting, Audio, Agents spatiaux, présentés comme achevés sans procédure de mesure.
- « hachage cryptographique et validation de possession » pour le NFT — contredit par [`src/engine/evaluator.ts`](../src/engine/evaluator.ts) qui fabrique un hash aléatoire sans contrat réel.

**Action restante :** corriger `PITCH_MANIFESTO.md` pour aligner le wording sur l’état réel du code. Pas besoin d’une « carte de vérité » exhaustive : les docs principaux sont déjà propres, seul le pitch pose problème.

### 3.2 Clarifier chaque fonction IA — ✅ LIVRÉE (comportement) / UI à valider

[`src/authoring/parser.ts`](../src/authoring/parser.ts) `parseInstructionAsync` appelle d’abord le parseur déterministe et ne va au LLM que si l’intention reste `unknown`. Le résultat porte désormais un champ `source` : `'local_rules'`, `'llm'` ou `'unresolved'` avec notice explicite.

Recommandations déjà satisfaites côté code :
- distinction commande reconnue par règles locales vs patch proposé par le modèle (champ `source`) ;
- état compréhensible quand le fournisseur LLM est absent ou refuse (`'unresolved'` avec notice).

**Action restante :** vérifier dans l’interface que le `source` est bien affiché à l’utilisateur (point d’UI, non vérifiable depuis le seul fichier). Si un parcours de démo utilise une consigne reconnue par règles locales, l’indiquer explicitement plutôt que de la présenter comme une génération IA.

### 3.3 Ne pas appeler « playtester autonome » une approximation sans le dire — ✅ LIVRÉE

[`src/engine/syntheticPlaytester.ts`](../src/engine/syntheticPlaytester.ts) :
- La branche « aucune cible » retourne désormais `success: false`, `verificationStatus: 'unverifiable'`, `completionRate: 0` (plus de faux positif).
- La nature heuristique est explicitement étiquetée : `method: 'geometric_heuristic'`, `confidence: 'limited'`, et un tableau `limitations` qui indique que le vrai moteur physique Rapier n’est pas piloté et que les obstacles sont approximés géométriquement.

Le playtester reste une heuristique géométrique, pas un avatar Rapier — mais c’est désormais dit honnêtement dans le code et le rapport. C’est ce que demandait cette section.

Aucune action restante sur cette étape.

### 3.4 Borner la portée du garant déterministe — ✅ LIVRÉE

[`src/engine/deterministicGuarantor.ts`](../src/engine/deterministicGuarantor.ts) ne contient aucune occurrence de « Q.E.D. », « preuve 100 % » ou de sceau de validation absolu. Le code est volontairement modeste :
- docstring : « Ce n’est pas une preuve formelle. »
- summary : « Résultat limité aux règles listées, sans preuve formelle de jouabilité. »
- limitations énumérées : vérification spatiale limitée aux coordonnées verticales, pas une preuve exhaustive.

**Note :** `PITCH_MANIFESTO.md` continue d’affirmer « prouve mathématiquement » — voir §3.1 ci-dessus pour l’action restante sur ce fichier.

Aucune action restante dans le guarantor lui-même.

### 3.5 Supprimer le faux sceau cryptographique — ✅ LIVRÉE

[`src/engine/publishReadiness.ts`](../src/engine/publishReadiness.ts) :
- `computeManifestHash` (mélangeur maison 32 bits, préfixe `0xVVR-`) a été **supprimé**. Remplacé par `createLocalReportId` qui produit un identifiant lisible `wp-report-...` explicitement décrit comme « not a digest or signature ».
- Le mot « cryptographique » ne subsiste que dans un disclaimer négatif : « Not an official Victoria VR certification, publication approval, cryptographic signature, or blockchain record. » — ce qui est correct.
- Le panneau n’est pas présenté comme conformité officielle Victoria VR.

Aucune action restante sur cette étape.

### 3.6 Sécuriser les appels LLM et les actions de règles — ⚔️ PARTIELLEMENT VALIDÉ / 2 POINTS ÉCARTÉS

**Toujours valide — `mint_nft` :**
[`src/engine/evaluator.ts`](../src/engine/evaluator.ts) fabrique toujours un hash aléatoire 64 char, un payload avec fausse adresse de contrat, faux réseau, faux gas fee, et positionne `nft_minted` à `true`. Le warning affiche « 💎 Victoria VR Smart Contract : NFT … Minté ! ».

**Recommandation :** retirer purement et simplement `mint_nft` du parcours de démo plutôt que de le polir. Pour un hackathon, cette fonctionnalité simulée apporte du risque crédibilité et peu de valeur. Si elle doit rester, l’étiqueter « simulation locale » et supprimer les faux détails de réseau/gas/adresse.

**Écarté — proxy backend pour LLM :**
[`src/authoring/llm.ts`](../src/authoring/llm.ts) lit toujours `VITE_GEMINI_API_KEY` et `VITE_DEEPSEEK_API_KEY` côté client. Construire un proxy backend minimal pour un hackathon est disproportionné.

**Recommandation pragmatique :** ne pas définir les clés `VITE_*` dans l’env de build public (elles ne sont bundlées que si elles sont définies). Pour la démo publique, soit désactiver l’appel distant et ne garder que le parseur déterministe, soit utiliser une clé à quota limité rotative. Un proxy backend complet est reporté après le hackathon.

**Écarté — allowlist webhook :**
[`src/engine/evaluator.ts`](../src/engine/evaluator.ts) `fire_webhook` fait toujours un `fetch` vers une URL arbitraire sans allowlist. Construire une allowlist de domaines est de l’over-engineering si le webhook n’est pas dans le parcours de démo.

**Recommandation :** si `fire_webhook` n’est pas dans le parcours de démo, le retirer du chemin critique (désactiver l’action ou la rejeter par défaut) plutôt que de construire une allowlist. Ne pas accepter d’URL arbitraire issue du modèle dans la démo publique.

## 4. Priorité P1 — une seule démo complète et facile à juger

### 4.1 Réduire la première impression — ⚠️ À ÉVALUER VISUELLEMENT

L’interface expose de nombreuses zones et commandes concurrentes. Le panneau de pitch/procédure peut recouvrir une part importante de la scène sur petit écran. Ce point est subjectif et non vérifiable sans inspection visuelle de l’UI actuelle.

**Action :** ouvrir l’application dans un navigateur propre à ~640 px et ~1280 px, vérifier que la scène et le résultat restent visibles sans panneau qui masque l’action principale. Si ce n’est pas le cas, réorganiser autour de trois zones (entrée, scène, résultat) et mettre le reste derrière des onglets secondaires.

### 4.2 Construire une démo de 2–3 minutes — ⚠️ À ÉVALUER VISUELLEMENT

Choisir un cas d’usage unique et visuellement lisible. Ordre de la démonstration :

1. Un prompt en langage naturel crée/modifie la scène et une règle observable.
2. Le juge déclenche lui-même l’interaction principale.
3. Une anomalie concrète est présentée ou introduite (par exemple cible hors d’atteinte ou interaction manquante).
4. Le test produit un diagnostic relié à la scène, avec la limite de son analyse.
5. L’utilisateur accepte un patch minimal ; le test est relancé avec le même critère et son résultat change.

Si l’exemple est un preset préconstruit, l’indiquer : ne pas le présenter comme une scène nouvellement générée par l’IA.

### 4.3 Établir le caractère complémentaire de WorldPilot — conseil produit

Le pitch recommandé est « création d’un monde interactif, puis vérification explicable de ses interactions et corrections minimales ». Ce positionnement est une hypothèse produit à valider, pas un fait de marché. Ne pas construire davantage de cartes, catégories, tokens, avatars, métriques ou écrans d’observabilité tant que le cas vertical n’est pas convaincant.

## 5. États de rendu et de publication

### 5.1 Garder le chemin de démonstration sur le rendu réellement disponible — ✅ LIVRÉE

Le prototype livré utilise son renderer WebGL dans le navigateur. Les commandes qui basculaient vers un runtime séparé et l’interface de diffusion associée ont été retirées du parcours principal. N’annoncer une intégration de rendu externe que lorsqu’un runtime réel, un protocole fonctionnel et une télémétrie vérifiable sont présents.

### 5.2 Rendre les états de publication honnêtes — ✅ LIVRÉE

[`src/engine/publishReadiness.ts`](../src/engine/publishReadiness.ts) :
- Le contrôle IP (`compliance_ip_assets`) n’est plus un `PASS` codé en dur : il est en `WARN` avec message « Ce contrôle ne lit pas d’inventaire de provenance et ne peut pas confirmer les licences. »
- Le contrôle `compliance_web3_compatibility` est également en `WARN`.
- Le disclaimer d’export indique explicitement : « Local heuristic checks only. Not an official Victoria VR certification, publication approval, cryptographic signature, or blockchain record. »

Retirer du pitch les affirmations de land tiers, staking, compatibilité smart contract, certification ou schéma officiel tant que leurs dimensions, formats, API et sources officielles n’ont pas été confirmés. Voir §3.1 pour `PITCH_MANIFESTO.md`.

## 6. Priorité P1 — établir l’origine des assets — ✅ LIVRÉE

[`ASSET_PROVENANCE.md`](../ASSET_PROVENANCE.md) est désormais cohérent et borné :
- déclare que les GLB sont créés directement par WorldPilot ;
- précise que la provenance ne couvre pas les dépendances, polices, sons ni ressources Web tierces ;
- indique que les références à des marques ne constituent pas une autorisation ;
- décrit une procédure de vérification reproductible ;
- précise qu’il ne constitue pas une certification de droits.

Les contradictions internes signalées dans l’audit initial sont résolues. L’inventaire complet des ressources non-GLB (polices, sons, ressources Web) reste à compléter si la démo en charge par défaut — mais ce n’est pas un blocage P0.

## 7. Priorité P1 — améliorer la qualité visuelle — ✅ LIVRÉE (voir UPGRADE_3D.md)

Le plan détaillé de [`UPGRADE_3D.md`](../UPGRADE_3D.md) est clos : chaîne couleur/tone mapping livrée, matériaux GLB protégés, mise en scène architecturale livrée pour les thèmes riches. Les étapes HDRI global et SSAO ont été écartées avec motivation (bénéfice marginal, coût GPU/risque XR non justifié).

Garder un preset neutre crédible. Les modes cyberpunk/fantaisie restent stylisés et ne doivent pas être évalués comme photoréalisme. Ne pas promettre un rendu identique sur WebGL, XR et Unreal.

## 8. Priorité P2 — réduire la fragilité sans refactor massif — ⛔ ÉCARTÉ PENDANT LE HACKATHON

Le code central concentre beaucoup de cas : le parseur de commandes fait plusieurs milliers de lignes et [`src/scene/DetailedSimulationModel.tsx`](../src/scene/DetailedSimulationModel.tsx) est volumineux. Ce document recommandait lui-même de ne pas scinder ces fichiers intégralement pendant le sprint du hackathon.

**Décision : reporter tout refactor du parseur et de `DetailedSimulationModel.tsx` après le hackathon.** Le but de ce lot était la vérifiabilité du chemin démontré, pas une réarchitecture. Tant que le parcours vertical fonctionne, ne pas toucher à la structure de ces fichiers.

Ne pas annoncer « strict TypeScript », « suite complète » ou « production » sans commandes reproductibles et résultats correspondants.

## 9. Préparation de la remise — ⚠️ À COMPLÉTER AVANT REMISE

[`SUBMISSION.md`](../SUBMISSION.md) contient encore des emplacements à compléter :
- Dépôt : à renseigner
- Démo hébergée : à renseigner
- Vidéo (moins de 3 minutes) : à renseigner

La soumission officielle requiert un dépôt public, une démo navigateur hébergée accessible, une vidéo de moins de trois minutes, une description écrite et une catégorie. La date officielle affichée est le 11 novembre 2026 à 16 h 30 CEST ; vérifier la source officielle.

À préparer après avoir figé le parcours :
- remplacer chaque placeholder par le lien réel, vérifier les droits d’accès depuis une session non connectée ;
- garder un chemin de lancement documenté et une scène de départ déterministe ;
- enregistrer une vidéo de moins de trois minutes centrée sur le cycle prompt → interaction → diagnostic → patch → vérification ;
- écrire une description brève qui nomme précisément où l’IA intervient et ce qui est heuristique ;
- ajouter une liste d’assets/crédits exploitable et cohérente avec la démo ;
- vérifier le build et les parcours principaux dans un navigateur propre avant publication, puis contrôler à nouveau que les liens restent accessibles.

Ne pas prétendre que l’enregistrement, l’éligibilité ou la soumission ont été confirmés par le seul fait que les documents sont prêts.

## 10. Ordre de livraison proposé

### Lot A — crédibilité et sécurité — ✅ LIVRÉ (sauf mint_nft et PITCH_MANIFESTO)

1. ✅ Inventorier les claims, marquer chaque capacité comme réelle, heuristique, simulée ou future (README/SUBMISSION/METRICS propres).
2. ✅ Retirer les faux succès de playtest et corriger l’état « aucune cible ».
3. ✅ Retirer les bascules et commandes vers des rendus non disponibles.
4. ✅ Corriger le vocabulaire du hachage/manifeste.
5. ⚠️ Supprimer les secrets du bundle navigateur : ne pas définir les clés `VITE_*` dans le build public. Encadrer `mint_nft` (retirer du parcours démo).
6. ✅ Résoudre les contradictions d’assets et de licences.
7. ⚠️ Corriger `PITCH_MANIFESTO.md` (sur-affirmations).

### Lot B — parcours produit — ⚠️ À ÉVALUER VISUELLEMENT

1. Choisir un unique cas et une consigne naturelle qui ne soit pas seulement un raccourci de preset.
2. Faire produire une scène et une règle, puis laisser la personne déclencher l’interaction.
3. Créer un défaut observable, diagnostiquer, expliquer et appliquer un patch minimal.
4. Relancer la même vérification et montrer le changement de résultat.
5. Simplifier la première vue afin que la scène et le résultat restent visibles.

### Lot C — qualité visuelle — ✅ LIVRÉ (voir UPGRADE_3D.md)

Appliquer les étapes de `UPGRADE_3D.md` sur ce cas uniquement, avec captures comparables, assets licenciés et budget de performance observé. Clos.

### Lot D — remise — ⚠️ À COMPLÉTER AVANT REMISE

Valider la démo hébergée, le dépôt public, les crédits, la description, la catégorie et la vidéo auprès des exigences officielles. Ne pas passer du temps au polissage de fonctionnalités secondaires tant qu’un juge ne peut pas compléter le cas principal sans assistance.

## 11. Critères d’acceptation recommandés

Le travail d’amélioration peut être considéré comme prêt pour la démo lorsque :

- un évaluateur qui découvre le produit comprend en moins d’une minute quoi saisir et quoi observer ;
- un prompt en langage naturel produit bien une scène 3D et une logique fonctionnelle dans le navigateur ;
- un geste dans la scène provoque un effet causal visible ;
- ✅ une situation invalide n’est jamais rapportée comme réussite à 100 % (livré) ;
- ✅ le diagnostic désigne les données réellement inspectées et indique les limites de l’heuristique (livré) ;
- le patch est visible, minimal et suivi d’une nouvelle vérification sur le même critère ;
- aucune clé fournisseur secrète n’est livrée au navigateur et aucune règle ne peut effectuer un appel arbitraire sans validation ;
- ✅ les assets du parcours ont une provenance exploitable et les crédits requis sont présents (livré) ;
- la scène de démo est visuellement lisible, stable, accessible depuis un navigateur propre et sans panneau qui masque l’action principale ;
- les liens publics et la vidéo sont complets et respectent la remise officielle.

Ces critères sont des objectifs de qualité proposés, pas des poids officiels du jury. La documentation publique du hackathon ne publie pas de pondération numérique à reprendre.
