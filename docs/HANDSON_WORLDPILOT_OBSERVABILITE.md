# 🧭 Hands-On WorldPilot : Le Guide « Contrarien Raisonnable » pour le Hackathon Victoria VR

> **Le défi officiel du Hackathon Victoria VR :**  
> *« Turn plain language into interactive 3D scenes and working logic. »*
>
> **⚡ Comprendre WorldPilot en 10 secondes (L'Analogie Clé) :**  
> - Les outils *Text-to-3D* classiques (et le *VR AI Builder* d'Unreal Engine) génèrent **le décor 3D** (les maillages).  
> - **WorldPilot est le compilateur logique, le pare-feu de non-régression et l'observatoire comportemental** de ces mondes : il garantit que lorsqu'un créateur modifie sa scène au fil des prompts (**Prompt n°2, n°3… n°9**), **aucune règle existante n'est cassée**, aucun objet déplacé ne bloque la quête, et chaque action de l'utilisateur en 3D est comprise et mesurée.

---

## 🏛️ Les 4 Piliers d'Architecture (La Thèse « Contrarienne Raisonnable » face au Jury)

| Pilier | ❌ Ce que font 90 % des projets IA 3D | ✅ L'Architecture de WorldPilot | Référence Technique |
| :--- | :--- | :--- | :--- |
| **1. Édition Non-Destructive (`WorldPatch`)** | Chaque nouveau prompt écrase la scène ou casse silencieusement les règles créées 2 minutes plus tôt. | Compile le langage naturel en **opérations atomiques versionnées (`WorldPatch`)** avec préservation d'invariants ($W_{AB} \approx_\Omega W_{BA}$) et réparation minimale de Pareto (`< 8.4 ms`). | `src/core/types.ts`, `src/research/editOrder/` |
| **2. Zéro Code Généré & Zéro LLM au Runtime** | Le LLM génère du code arbitraire (`eval`) ou est appelé à chaque clic du joueur (1,5 s de latence + risque de sécurité). | **Le LLM ne touche jamais au runtime.** Il compile un graphe déclaratif (`WorldIR` / YAML), exécuté localement à **60 FPS hors-ligne** par un moteur déterministe. | `0002-deterministic-runtime.md`, `0003-no-generated-code.md` |
| **3. Industrialisation à 10 000 Mondes (`World CI`)** | Tester 10 mondes à la main en VR est possible ; tester **10 000 mondes générés par les utilisateurs** est impossible humainement. | **Pre-Publish Quality Gate (`World CI`)** : vérification formelle du graphe (`Cmd+K`), agent *Adversarial Playtester* (`Cmd+Y`), et certification *Spatial Lighthouse* (`100/100`, `Cmd+P`). | `VICTORIA_FIT.md`, `0006-world-ci.md` |
| **4. Portabilité Native vers Unreal (`WorldAdapter`)** | L'état logique du monde est mélangé aux maillages Three.js/WebGL (jetable et incompatible avec Unreal Engine). | **« Le Rendu 3D n'est pas le Monde » (`Objet Logique ≠ Mesh 3D`)** : `WorldIR` (YAML / W3C WoT `JSON-LD`) est découplé du rendu via `WorldAdapter` (WebGL aujourd'hui, Unreal Engine demain). | `0001-worldir.md`, `0004-world-adapter.md`, `src/scene/R3FWorldAdapter.tsx` |

> **✨ NOUVEAU — Mise en Évidence Visuelle Directe dans WorldPilot (`F2 > 🏛️ 4 Piliers`) :**
> Dès que vous ouvrez le moniteur **`⚡ Observabilité Réactive`** (en appuyant sur **`F2`** ou en cliquant sur le bouton flottant **`⚡ Observabilité & Causalité`** en bas à droite), un **Bandeau Permanent des 4 Preuves** et un onglet dédié **`🏛️ 4 Piliers`** mettent visuellement en évidence tous ces différenciateurs en 1 clic :
> - **Bandeau de preuve toujours visible en haut de `F2`** :
>   - `⚡ 60 FPS • 0 eval() • 0 ms LLM`
>   - `🛡️ Invariants (1)` (vert) $\to$ bascule en rouge `⚠️ Invariant VIOLÉ` lors d'une faille $\to$ bascule en vert `✅ Invariant VÉRIFIÉ` après verrouillage
>   - `🧪 AB≈BA : 100% vs 16.7%`
>   - `🔌 WebGL ⇄ Unreal`
> - **Bannières dynamiques en direct dans `F2`** :
>   - **Bannière Lignée Sémantique (`🔗 Lignée Sémantique (WorldPatch)`)** : s'affiche automatiquement dès que la batterie est remplacée par un générateur (`Batterie 12V ➔ generateur_de_secours...`, 100 % des règles re-câblées), avec un bouton direct **`Preuve AB/BA`**.
>   - **Bannière Blast Radius & Pareto Auto-Heal** : affiche l'alerte rouge **`💥 BLAST RADIUS (COLLIDER_DEADLOCK)`** avec le bouton **`✨ Auto-Guérir`** en 1 clic qui bascule en vert **`✅ PARETO AUTO-HEAL (< 8.4 ms)`** (`+0.85m`, 100 % sans régression).
> - **Laboratoire Visuel Commutativité AB/BA (`test ab ba` ou bouton `🧪 AB≈BA`)** : modale **`Laboratoire de Permutation AB / BA (Sensibilité à l'Ordre)`** avec barres comparatives visuelles **C0 Naive LLM (`16.7%`) vs C2 Full Replan (`43.3%`) vs C5 WorldPilot (`100.0%`)**, vecteur de divergence à 7 couches `[0.00 ... 0.00]` et bouton **`▶ Lancer le Test AB / BA`**.

> **💡 Munitions complémentaires pour les Q&A du Jury :**
> - **Thèse « Physics-over-Forms » & Coopération 2D/3D :** *« Si retirer la 3D ne fait perdre aucune information, la 3D est un gadget. »* WorldPilot réserve la 3D à la preuve volumétrique et physique (ex. test 1:1 d'un PC 15.6" dans un sac 42L, vue éclatée, 8 affordances physiques déterministes) et délègue la lecture dense à un **tiroir de fiche technique 2D hybride** et des artefacts dédiés (PDF, CAO, Web avec *audio ducking*).
> - **Traçabilité (« Git Blame » Sémantique) :** Chaque modification produit un `edit_id` versionné (`v1 → v2`) avec lignée sémantique (`car_battery_new → REPLACED_BY → generateur`) rejouable dans l'onglet **`📜 Historique`** (`Alt+H`).
> - **Boucle d'Auto-Amélioration Humain ⇄ IA :** Lorsque l'utilisateur hésite, **Victoria** intervient en direct, synthétise un **Clone Comportemental Humain** et propose des **Hot-Patches** soumis à arbitrage humain (`Observations & Arbitrage IA`).

---

## 🗺️ Vue d'ensemble du Parcours Hands-On (8 Démonstrations)

Chaque étape suit systématiquement la même mécanique en **3 temps** :
1. **❌ Le Problème** *(ce qui échoue dans 95 % des générateurs 3D actuels)*
2. **✅ La Force de WorldPilot** *(notre réponse d'ingénierie)*
3. **🛠️ La Mise en Scène Pas-à-Pas** *(les prompts exacts à taper et ce qu'il faut observer à l'écran)*

| # | Ce que vous allez prouver | Prompts utilisés (Champ « Votre intention ») |
| :-: | :--- | :--- |
| **1** | **Partir d'une page blanche & Ouvrir le capot logique (`3D ⇄ Logique` & `YAML`)** | Prompt `vider` $\to$ Prompt `Montrer comment changer une batterie dans une voiture` + Panneau `F2` |
| **2** | **Ajouter des règles, détecter une faille (`⚠️ VIOLÉ`) et la verrouiller (`✅ VÉRIFIÉ`)** | Prompt `Personne ne doit terminer cette formation sans inspecter la batterie` $\to$ `Essaie de casser cette expérience` $\to$ `Verrouille l'inspection de la batterie...` |
| **3** | **Modifier ou remplacer un objet sans casser les anciennes règles ($W_{AB} \approx_\Omega W_{BA}$)** | Prompt `Remplace la batterie par un générateur en gardant sa position` + Prompt `test ab ba` |
| **4** | **Quand un prompt crée une collision : Blast Radius & Auto-Guérison (< 8.4 ms)** | Prompt `Déplace l'établi juste devant le compartiment moteur` $\to$ Prompt `Corrige le conflit spatial sans annuler mon intention` |
| **5** | **Créer une règle sans clavier en VR : Geste Émergent In-Situ (`⚡ Impulsion physique`)** | Glisser-déposer 3D à la souris + Popin holographique 3D (`✨ Promouvoir en Règle Active`) |
| **6** | **Démasquer la réussite par hasard : Observatoire Bayésien & Boucle $E_1 \to E_2$** | `F3` (`🛰️ L'Observatoire`) > Onglet `1. Anti-Jetable (E1➔E2)` |
| **7** | **Industrialiser la QA à 10 000 Mondes : Playtester (`Cmd+Y`) & Lighthouse (`Cmd+P`)** | Prompt `playtest` (`Cmd+Y`) + Prompt `certifie le monde` (`Cmd+P`) |
| **8** | **Pourquoi la 3D plutôt qu'un site 2D ? « Physics-over-Forms » & Robotique LeRobot** | Scène `🎒 Sac 42L` + Prompt `exporte lerobot` (`F3` > `3. Robotique (LeRobot)`) |

> ### ⏱️ Mode « Speedrun Jury » (2 minutes chrono — La séquence des 8 Prompts)
> Si vous n'avez que **2 minutes** pour tester la non-régression causale de WorldPilot, ouvrez le panneau **`F2`** (`⚡ Observabilité Réactive`) pour observer les preuves en direct, et saisissez successivement les 8 prompts dans le champ **`Votre intention`** (volet droit `L’ATELIER SPATIAL` + `Entrée`) :
> 1. `vider` *(repart d'une page blanche : 0 entité, 0 règle, 0 flag)*
> 2. `Montrer comment changer une batterie dans une voiture` *(compile la scène 3D + règles + quête + invariant)*
> 3. `Personne ne doit terminer cette formation sans inspecter la batterie` *(ajoute le contrat formel never_state)*
> 4. `Essaie de casser cette expérience` *(détecte la faille BFS : badge rouge **`⚠️ VIOLÉ`**)*
> 5. `Verrouille l'inspection de la batterie avant de terminer la formation` *(verrouille la précondition : badge vert **`✅ VÉRIFIÉ`**)*
> 6. `Remplace la batterie par un générateur en gardant sa position` *(remplace l'objet et **re-câble automatiquement** les règles existantes)*
> 7. `Déplace l'établi juste devant le compartiment moteur` *(déclenche l'onde de choc rouge 3D et l'alerte **`💥 BLAST RADIUS (COLLIDER_DEADLOCK)`**)*
> 8. `Corrige le conflit spatial sans annuler mon intention` *(solveur de Pareto en `< 8.4 ms` $\to$ **`✅ PARETO AUTO-HEAL (< 8.4 ms)`** à `+0.85m`)*

---

## 🧪 Hands-On n°1 : Partir d'une Page Blanche & Ouvrir le Capot Logique (`Prompt n°1` + `F2`)

### ❌ Le Problème
Dans les générateurs *Text-to-3D* classiques, la scène générée est une boîte noire : soit c'est un décor inerte (« musée de cire »), soit la logique est enfouie dans des scripts illisibles et impossibles à auditer.

### ✅ La Force de WorldPilot
WorldPilot part d'une scène vierge et compile votre **Prompt n°1** en un **graphe causal formel (`WorldIR` sérialisé en YAML)**. La scène 3D et le moniteur **`⚡ Observabilité Réactive` (`F2`)** sont synchronisés en temps réel dans les deux sens (`3D ➔ Logique` et `Logique ➔ 3D`).

### 🛠️ Mise en Scène Pas-à-Pas
1. **Ouvrir le moniteur d'observabilité (`F2`) :**
   - Appuyez sur la touche **`F2`** (ou cliquez sur le bouton flottant **`⚡ Observabilité & Causalité`** en bas à droite).
   - La fenêtre **`⚡ Observabilité Réactive`** s'ouvre avec son badge vert **`LIVE`**. Déplacez-la par sa poignée **`⠿`** en haut à gauche vers le côté droit pour laisser la scène 3D bien dégagée.
2. **Prouver qu'on part d'une page blanche :**
   - Saisissez `vider` dans le champ **`Votre intention`** (volet droit `L’ATELIER SPATIAL`) et appuyez sur `Entrée` (ou cliquez sur le bouton bleu **`Donner vie à mon monde`**).
   - **Ce que vous observez :** La scène 3D est vide (`0 Entité`, `0 Règle`, `0 Flag` dans `F2`).
3. **Lancer le Prompt n°1 (Générer l'atelier mécanique et sa logique initiale) :**
   - Saisissez dans le champ **`Votre intention`** (volet droit) puis appuyez sur `Entrée` :
     ```text
     Montrer comment changer une batterie dans une voiture
     ```
   - **Ce qui apparaît immédiatement :**
     - **Dans la scène 3D :** la berline capot ouvert (`car_sedan_1` : *Voiture avec compartiment moteur ouvert*), l'établi (`car_workbench` : *Établi technique de préparation*), la batterie 12V AGM (`car_battery_new` : *Batterie Automobile 12V 70Ah AGM*) et le bac récepteur moteur (`battery_tray_zone` : *Bac à batterie (Compartiment moteur)*).
     - **Dans le panneau `F2` :**
       - Onglet **`🚩 Flags (X)`** : les drapeaux d'état `battery_inspected: FALSE`, `battery_installed: FALSE`, `car_running: FALSE` (boutons rouges `FALSE`).
       - Onglet **`⚡ Règles (2)`** : les cartes `rule_inspect_car_battery` (déclencheur `INTERACT`) et `rule_install_car_battery` (déclencheur `DROP`), avec leurs conditions et bouton **`⚡ Simuler l'exécution`**.
       - Onglet **`🛡️ Invariants (1)`** : l'invariant `INV_CAR_BATTERY_INSPECT_FIRST` avec badge vert **`✔ CONFORME`**.
       - Onglet **`📄 YAML`** : le substrat universel en direct avec les boutons **`📋 Copier`** et **`💾 Exporter`**.
       - En bas de `F2` : l'encadré **`🎯 DÉBOGUEUR DE QUÊTE : ÉTAPE 1/2`**, intitulé *« Inspecter la nouvelle batterie 12V »*, avec le bouton orange **`⏩ Forcer la validation de l'étape (2/2)`**.
     - **Dans le volet de guidage / procédure (à gauche) :** *« Procédure : Remplacement de Batterie Automobile 12V »*, étape 1/2 *« Inspecter la nouvelle batterie 12V »* avec le bouton vert contextuel.
4. **Démontrer la synchronisation bidirectionnelle `3D ⇄ Logique` :**
   - **Sens `3D ➔ Logique` (Déclencher l'action) :**
     1. Dans la scène 3D, cliquez sur la **Batterie 12V** posée sur l'établi : la carte 3D contextuelle simplifiée s'ouvre avec le bouton vert d'action prioritaire au sommet (ex. **« 🎯 Inspecter la nouve… »** ou **« ⚡ Inspecter… »**) — vous pouvez aussi cliquer directement sur le bouton vert **`⚡ Inspecter la nouvelle batterie 12V`** dans le volet de guidage à gauche.
     2. Cliquez sur ce bouton : l'étape 1 est immédiatement validée, le guidage passe à l'**Étape 2/2** (*« Installer la batterie dans le compartiment moteur »*), et un repère vert de zone de dépôt s'allume au-dessus du compartiment moteur.
     3. Regardez **`F2 > 🚩 Flags`** : le drapeau **`battery_inspected`** passe instantanément de **`FALSE`** (rouge) à **`TRUE`** (vert).
   - **Sens `Logique ➔ 3D` (Live Toggle & Forçage réactif) :**
     - Dans **`F2 > 🚩 Flags`**, chaque drapeau est un interrupteur interactif (*Live Toggle*).
     - Cliquez directement sur le bouton vert **`TRUE`** de `battery_inspected` : il bascule instantanément à **`FALSE`** (rouge), invalidant manuellement la précondition sans recompiler. Recliquez dessus pour le repasser à **`TRUE`**.
     - Dans **`F2 > ⚡ Règles`**, chaque carte dispose d'un bouton **`⚡ Simuler l'exécution`** :
       * Cliquez sur **`⚡ Simuler l'exécution`** sous **`rule_inspect_car_battery`** : cela simule l'interaction physique `INTERACT`, joue le son carillon, affiche la notification *« 🔋 Diagnostic batterie OK : Tension 12.6V, cellules AGM intactes... »* et allume `battery_inspected = TRUE`.
       * Cliquez sur **`⚡ Simuler l'exécution`** sous **`rule_install_car_battery`** : cela simule le dépôt `DROP` de la batterie dans `battery_tray_zone`, allume `battery_installed = TRUE` et démarre la voiture (`car_running = TRUE`) si `battery_inspected` est actif.
     - Dans le **`🎯 DÉBOGUEUR DE QUÊTE`** (en bas de `F2`) : vous pouvez aussi cliquer sur **`⏩ Forcer la validation de l'étape (2/2)`** pour franchir l'étape sans aucune manipulation physique dans la vue 3D.

---

## 🛡️ Hands-On n°2 : Du Prompt n°2 au Prompt n°4 — Poser un Invariant, Détecter une Faille (`⚠️ VIOLÉ`) et la Verrouiller (`✅ VÉRIFIÉ`)

> [!NOTE]
> Ce Hands-On s'enchaîne directement après le Hands-On n°1 dans la même scène active. Exécutez chaque étape en saisissant le prompt dans le champ **`Votre intention`** (panneau droit `L’ATELIER SPATIAL`) puis en appuyant sur `Entrée`.

### ❌ Le Problème
Dans les outils IA actuels, **tout casse dès le 2e prompt** :
- Soit le 2e prompt écrase et régénère toute la scène du Prompt n°1 ;
- Soit le créateur ajoute une nouvelle règle qui permet de contourner une règle de sécurité antérieure (par exemple valider une formation industrielle sans avoir vérifié la tension de la batterie), sans qu'aucun outil ne l'alerte.

### ✅ La Force de WorldPilot
Chaque prompt applique un **patch différentiel (`WorldPatch`)** sans écraser l'existant. Surtout, l'auteur peut déclarer en français un **Invariant Formel de Sécurité** (`🛡️ Invariants`), demander à WorldPilot d'attaquer la scène pour trouver une faille (**`⚠️ VIOLÉ`**), puis verrouiller la règle par prompt et prouver formellement que la faille a disparu (**`✅ VÉRIFIÉ`**).

### 🛠️ Mise en Scène Pas-à-Pas
1. *(Optionnel — « Point & Speak »)* **Ajouter une règle par prompt sans toucher au reste :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     Si je pose ça ici, déclenche une alerte et réinitialise
     ```
   - Regardez **`F2` > `⚡ Règles`** : une nouvelle règle `DROP` nommée **`rule_alert_and_reset`** a été ajoutée à la volée **sans supprimer ni la voiture, ni la quête, ni les règles précédentes**.
2. **Prompt n°2 — Poser un contrat formel de non-régression (Invariant) :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     Personne ne doit terminer cette formation sans inspecter la batterie
     ```
   - Regardez **`F2` > `🛡️ Invariants`** :
     - La carte de l'invariant unique **`🛡️ INV_CAR_BATTERY_INSPECT_FIRST`** s'affiche avec le badge vert **`✔ CONFORME`** (sans doublon).
     - Description : *« Sécurité Électrique : La batterie automobile doit être inspectée avant d’être raccordée au circuit du véhicule. »* (condition formelle `never_state` : interdiction d'avoir `car_running = TRUE` si `battery_inspected = FALSE`).
3. **Prompt n°3 — Demander à WorldPilot de chercher une faille dans la scène :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     Essaie de casser cette expérience
     ```
   - **Ce qui apparaît immédiatement à l'écran :**
     1. Dans le bandeau permanent en haut de `F2`, le bouton d'invariants s'allume en rouge : **`⚠️ Invariant VIOLÉ`**.
     2. Dans **`F2 > 🛡️ Invariants`**, le badge de la carte passe en rouge vif : **`⚠️ VIOLÉ`**.
     3. Un encadré rouge sombre apparaît à l'intérieur de la carte :
        ```text
        🔍 Contre-Exemple Formel Trouvé (Profondeur = 2) :
        1. DROP(Batterie ➔ Compartiment Moteur)
        2. État atteint : car_running = TRUE alors que battery_inspected = FALSE.
        ```
     4. Une bannière de notification apparaît en bas de l'écran :
        *« ⚠️ Contre-exemple trouvé : l'invariant « ... » est VIOLÉ (car_running = TRUE alors que battery_inspected = FALSE) ! »*
4. **Prompt n°4 — Réparer la faille par prompt et prouver formellement le verrouillage :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     Verrouille l'inspection de la batterie avant de terminer la formation
     ```
   - **Ce qui se passe en direct :**
     1. WorldPilot injecte automatiquement la précondition stricte `require_flag(battery_inspected == TRUE)` sur la règle finale d'installation.
     2. Dans le bandeau supérieur de `F2`, le bouton repasse au vert : **`✅ Invariant VÉRIFIÉ`**.
     3. Dans **`F2 > 🛡️ Invariants`**, le badge passe au vert : **`✅ VÉRIFIÉ`**.
     4. L'encadré passe au vert émeraude de sûreté :
        ```text
        🔒 Preuve Formelle de Sûreté (0 Contre-Exemple) :
        Précondition require_flag(battery_inspected == TRUE) verrouillée sur la règle finale.
        ```
     5. La bannière de notification confirme :
        *« 🛡️ Correctif appliqué : la précondition 'require_flag: battery_inspected' a été verrouillée sur la règle finale. Invariant ✅ VÉRIFIÉ ! »*
     6. **La contre-épreuve :** Saisissez à nouveau `Essaie de casser cette expérience` puis `Entrée` — WorldPilot explore à nouveau 3 profondeurs d'événements et affiche :
        *« ✅ Vérification formelle réussie : aucun contre-exemple trouvé sur 3 profondeurs d'événements. L'invariant est 100 % VÉRIFIÉ ! »*

---

## 🔄 Hands-On n°3 : Modifier ou Remplacer un Objet (Prompt n°5) sans Casser les Anciennes Règles ($W_{AB} \approx_\Omega W_{BA}$)

### ❌ Le Problème
Que se passe-t-il quand l'auteur décide de modifier un objet, de changer sa texture, ou pire : de **remplacer la batterie par un générateur** ?  
Dans un moteur classique, dès que l'objet `car_battery_new` est supprimé pour être remplacé, toutes les règles créées précédemment deviennent des **règles orphelines** qui pointent vers un identifiant fantôme.

### ✅ La Force de WorldPilot
Le moteur de patch ([`worldSlice.ts`](file:///Users/b.delb/Documents/antigravity/worldpilot/src/engine/slices/worldSlice.ts#L530-L560) & [`validateWorldPatch`](file:///Users/b.delb/Documents/antigravity/worldpilot/src/engine/validator.ts#L75-L118)) intercepte chaque remplacement d'entité et **re-câble automatiquement** toutes les anciennes règles (`sourceId`, `targetId`, `entityId`) et étapes de quête sur le nouvel objet, quel que soit l'ordre dans lequel les prompts ont été exécutés ($W_{AB} \approx_\Omega W_{BA}$).

### 🛠️ Mise en Scène Pas-à-Pas
1. *(Optionnel — Modification partielle)* **Déplacer l'objet sans rien casser :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     Déplace la batterie de 50 cm vers la droite
     ```
   - Vérifiez dans **`F2` > `⚡ Règles`** : la voiture et l'établi n'ont pas bougé, la batterie a changé de coordonnées et toutes les règles restent intactes.
2. **Prompt n°5 — Le test clé : Remplacer la batterie par un autre équipement :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     Remplace la batterie par un générateur en gardant sa position
     ```
   - **Ce qui apparaît immédiatement à l'écran :**
     1. Dans la scène 3D, la batterie a été remplacée aux mêmes coordonnées exactes par le générateur.
     2. En haut de `F2`, la bannière de lignée sémantique s'allume automatiquement :
        **`🔗 Lignée Sémantique (WorldPatch) : Batterie 12V ➔ generateur_de_secours... (100% Règles & Invariants re-câblés)`**
        avec un bouton direct **`Preuve AB/BA`**.
     3. Dans **`F2 > ⚡ Règles`**, examinez les règles `rule_inspect_car_battery` et `rule_install_car_battery` : **leur ligne `🔗 Câblage` a été automatiquement re-câblée sur l'identifiant du nouveau générateur (`🔗 Câblage : Generateur ➔ Bac à batterie...`) !** Aucune règle n'est orpheline.
     4. Dans l'onglet **`📜 Historique`** (`Alt+H`), le patch consigne l'opération `car_battery_new → REPLACED_BY → generateur_de_secours...`.
3. **Preuve scientifique en 2 clics — Ouvrir le Laboratoire de Permutation AB / BA ($W_{AB} \approx_\Omega W_{BA}$) :**
   - Saisissez dans le champ **`Votre intention`** : `test ab ba` puis `Entrée` (ou cliquez sur **`🧪 AB≈BA : 100% vs 16.7%`** dans le bandeau supérieur de `F2`).
   - La fenêtre modale **`Laboratoire de Permutation AB / BA (Sensibilité à l'Ordre)`** s'ouvre.
   - **Étape A (La panne des moteurs classiques) :** Cliquez sur le bouton **`❌ Simuler C0 Naive (16.7%)`** (ou cliquez sur la barre `C0`, ou sur **`▶ Lancer le Test AB / BA`**). Le laboratoire exécute les deux ordres (`Prompt A puis B` vs `Prompt B puis A`) et affiche en rouge **`❌ RÉGRESSION D'ORDRE DÉTECTÉE (C0_NaiveSequential) : W_AB ≠ W_BA`** (`16.7%` de survie, divergence $D_\Omega > 0$ sur la logique et les invariants).
   - **Étape B (La garantie WorldPilot) :** Cliquez sur le bouton **`✅ Simuler C5 WorldPilot (100%)`** (ou cliquez sur la barre `C5`, ou sur **`▶ Lancer le Test AB / BA`**). Le verdict passe immédiatement au vert émeraude **`✅ COMMUTATIVITÉ FORMELLE PROUVÉE (C5_DependencyAwareMinimalRepair) : W_AB ≈_Ω W_BA (0.00 Divergence)`** (`100.0%`, divergence $D_\Omega = 0.000$, hash d'état canonique strictement identique `86e1f070`) avec le détail des réconciliations causales !

---

## 💥 Hands-On n°4 : Quand un Prompt Crée une Collision Physique — Blast Radius & Auto-Guérison (< 8.4 ms)

### ❌ Le Problème
Lors d'un nouveau prompt d'édition spatiale, le créateur déplace un meuble ou un établi qui vient accidentellement chevaucher ou bloquer l'accès au compartiment moteur (*Spatial Deadlock*). Aucune erreur de code n'est levée, mais le joueur ne peut plus atteindre la zone cible.

### ✅ La Force de WorldPilot
Dès qu'un prompt provoque une obstruction géométrique sur une entité impliquée dans une règle causale, WorldPilot :
1. Calcule le **Rayon d'Impact Différentiel (*Blast Radius* $\Delta W$)** en **$< 8.4\text{ ms}$** ;
2. Affiche une **sphère d'onde de choc 3D rouge** sur la collision dans la scène 3D ;
3. Répare la collision via un **Patch Minimal de Pareto** qui dégage l'accès à distance de sécurité (`+0.85m`) **sans annuler l'intention de l'auteur**.

### 🛠️ Mise en Scène Pas-à-Pas
1. **Prompt n°6 — Provoquer une collision spatiale par prompt :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     Déplace l'établi juste devant le compartiment moteur
     ```
   - **Double réaction immédiate à l'écran :**
     - **Dans la scène 3D :** l'établi vient se placer seul contre le compartiment moteur (le générateur restant sur sa position initiale à gauche) et une **sphère d'onde de choc 3D rouge pulsante** matérialise l'obstruction physique.
     - **Dans le panneau `F2` :** la bannière rouge d'alerte s'allume en haut :
       > **`💥 BLAST RADIUS (COLLIDER_DEADLOCK) : L’établi bloque l’accès au compartiment moteur (0.85m).`**  
       > avec un bouton vert **`✨ Auto-Guérir`**.
2. **Prompt n°7 — Auto-guérir la scène sans annuler le rapprochement :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` (ou cliquez sur le bouton vert **`✨ Auto-Guérir`** dans la bannière de `F2`) :
     ```text
     Corrige le conflit spatial sans annuler mon intention
     ```
   - **Résultat immédiat :**
     1. En moins de `8.4 ms`, l'établi est repositionné chirurgicalement à `+0.85m` (l'établi reste rapproché de la voiture comme souhaité, mais dégage l'accès moteur nécessaire à la quête).
     2. La bannière bascule immédiatement au vert :
        > **`✅ PARETO AUTO-HEAL (< 8.4 ms) : Établi décalé de +0.85m — 100% Sans Régression.`**
     3. La sphère d'onde de choc 3D rouge disparaît instantanément de la scène !

---

## 👆 Hands-On n°5 : Créer une Règle Sans Clavier en Casque VR — L'Observabilité Émergente In-Situ

### ❌ Le Problème
Une fois dans un casque VR (*Victoria VR*), personne ne veut taper sur un clavier virtuel pour coder une règle. Et si un joueur tente spontanément un geste physique que le créateur n'avait pas prévu (par exemple approcher un outil d'une pièce moteur), il ne se passe rien.

### ✅ La Force de WorldPilot
Le moteur d'**Inférence d'Intention Inverse (*Inverse Intent Engine*)** analyse en continu la cinématique 3D de la main ou de la souris (loi de Fitts 3D, vitesse d'approche, temps de survol) et fait apparaître **directement au-dessus des objets 3D** une bulle holographique proposant de transformer ce geste spontané en règle formelle.

### 🛠️ Mise en Scène Pas-à-Pas
1. **Réaliser un geste spontané en 3D :**
   - Dans la scène 3D à gauche, cliquez-glissez à la souris sur le **Générateur** (ou la **Batterie 12V**) et approchez-le vivement de la **Voiture (`car_sedan_1`)** ou de l'**Établi** *(vous pouvez aussi cliquer sur **`✨ 3. Tracer Arc Intention 3D`** dans `F3` > `2. Neuro-Symbolique`)*.
2. **Observer la détection in-situ :**
   - Une **arche lumineuse 3D (spline de Bézier)** relie les deux objets dans l'espace et une popin holographique non-intrusive s'affiche au-dessus :
     > **`⚡ Impulsion physique (87%) · 1 essai`**
3. **Compiler le geste en règle en 1 clic :**
   - Cliquez sur **`✨ Promouvoir en Règle Active`** directement sur la bulle 3D au-dessus du moteur (ou dans `F3 > 2. Neuro-Symbolique` sur le bouton vert **`✨ Compiler en Règle`**).
   - Ouvrez **`F2` > `⚡ Règles`** (bouton en bas à droite) : la nouvelle règle causale a été compilée et ajoutée au `WorldIR` **sans avoir tapé une seule ligne de texte** !

---

## 🧠 Hands-On n°6 : Démasquer la Réussite par Hasard — Observatoire Bayésien & Boucle $E_1 \to E_2$ (`F3`)

### ❌ Le Problème
Un monde généré une seule fois ($E_1$) est aveugle : un utilisateur qui clique frénétiquement partout au hasard finit par déclencher le bon objet et réussit la mission exactement comme un expert qui a compris la procédure.

### ✅ La Force de WorldPilot
Dans **`🛰️ L'Observatoire` (`F3` > Onglet `1. Anti-Jetable (E1➔E2)`)**, le Méta-Contrôleur Bayésien calcule en temps réel deux probabilités :
- **$P(H_1)$ — Essai-Erreur / Piège :** l'utilisateur agit par tâtonnement superficiel ;
- **$P(H_2)$ — Maîtrise Causale :** l'utilisateur comprend les préconditions physiques.  
En fonction de ce diagnostic, WorldPilot **mute chirurgicalement la scène 3D en une expérience adaptée ($E_2$)** sans régénérer le monde.

### 🛠️ Mise en Scène Pas-à-Pas
1. Appuyez sur **`F3`** (ou cliquez sur **`🛰️ L'Observatoire`** dans la barre du haut au centre) et sélectionnez l'onglet **`1. Anti-Jetable (E1➔E2)`**. *(Note : le bouton en bas à droite `⚡ Observabilité & Causalité` / F2 est le débogueur local).*
2. **Démasquer un joueur qui clique au hasard ($H_1$) :**
   - Cliquez sur **`⚠️ 1. Simuler Piège H1`**.
   - Regardez la jauge rouge **`H1 : Essai-Erreur / Piège`** grimper et le bandeau toast persistant s'afficher au-dessus du rectangle « L'Anti-Générateur Jetable » : WorldPilot détecte que l'utilisateur a mordu à un leurre cognitif et ajuste sa politique sur *Remédiation Guidée*. (Le bandeau reste affiché jusqu'au clic de fermeture). Dans la scène 3D, une sphère d'alerte jaune `⚠️ Obstruction physique (Collision)` apparaît pour marquer le piège spatial.
3. **Valider un expert analytique ($H_2$) :**
   - Cliquez plusieurs fois sur **`🎯 2. Simuler Maîtrise H2`** (ou cliquez sur **`🏆 Exécuter le Benchmark Comparatif des 4 Personas Cognitifs`** pour afficher la matrice complète des 4 profils : *Analytique, Tâtonnement, Prudent, Adversaire*).
   - La jauge verte **`H2 : Maîtrise Causale`** bondit à **> 95 %** et l'incertitude épistémique $U$ chute.
4. **Muter la scène 3D en direct vers l'épreuve $E_2$ (Acquisition de compétence) :**
   - Cliquez sur le bouton bleu **`⚡ 3. Muter la Scène 3D vers E2`**.
   - **Regardez la scène 3D à gauche (fermez F3) :** sans détruire la voiture, WorldPilot opère une mutation adaptative complète :
     1. Une **Balise de Transfert Invariant** holographique violette (`🔮 Balise de Transfert Invariant [Épreuve E2]`) apparaît à côté de la voiture avec des anneaux orbitaux rotatifs ;
     2. L'avatar autonome **`Ingénieure Nova`** rejoint Marc dans l'atelier pour superviser la nouvelle épreuve ;
     3. Le panneau de quête à gauche passe automatiquement à **`Épreuve de Transfert Invariant (Étape 1 sur 1)`** avec le bouton d'action `⚡ Lancer l'action`. L'acquisition de compétence est ainsi attestée par une mutation contextuelle fermée !

---

## 🤖 Hands-On n°7 : Industrialiser la QA à 10 000 Mondes — Playtester Synthétique (`Cmd+Y`) & « World Lighthouse » (`Cmd+P`)

### ❌ Le Problème
Si des milliers d'utilisateurs créent des mondes avec le *VR AI Builder* de Victoria VR, aucun humain ne peut les tester un par un. Comment empêcher la publication dans l'*AI Verse* d'un monde où la quête est infaisable (objet hors de portée, règle bloquée) ou trop lourd pour un casque VR ?

### ✅ La Force de WorldPilot
Deux garde-fous automatisés inspirés du génie logiciel :
1. **Le Playtester Synthétique (`Cmd+Y` ou prompt `playtest`) :** 5 bots autonomes (`⚡ Speedrunner`, `🧭 Explorateur`, `🧪 Playtester`, `🎓 Apprenti`, `🧠 Clone Humain`) parcourent le graphe causal et spatial de la scène en quelques millisecondes et estiment la franchissabilité avec génération d'un **Minimal Patch** en 1 clic en cas de blocage.
2. **La Porte de Pré-Publication « World Lighthouse » (`Cmd+P` ou prompt `certifie le monde`) :** audite la scène selon les quotas officiels des parcelles Victoria VR (*Standard*, *Showroom*, *Arena*).

### 🛠️ Mise en Scène Pas-à-Pas
1. **Lancer les Bots de Playtest (`playtest` ou `Cmd+Y`) :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     playtest
     ```
   - La modale **`🤖 Vérification spatiale estimée`** (badges `HEURISTIQUE GÉOMÉTRIQUE` & `PATCH SUGGÉRÉ`) s'ouvre :
     - **`⚡ Speedrunner`** : valide le parcours spatial estimé (100% franchissable sur la scène E2, 3 waypoints) et trace la trajectoire 3D visible dans la scène avec le badge `🤖 Playtester (speedrunner) 100% complété` ;
     - **`🧭 Explorateur`** / **`🧪 Playtester`** : explorent les branches causales alternatives et cherchent d'éventuels blocages ;
     - **`🧠 Clone Humain`** : rejoue **vos propres hésitations** enregistrées dans la scène !
   - Le bouton **`🛡️ Ouvrir Publish Readiness Gate`** au bas de la modale permet d'enchaîner directement sur l'étape 7.2 (World Lighthouse).
2. **Certifier le monde avant publication Victoria VR (`certifie le monde` ou `Cmd+P`) :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     certifie le monde
     ```
   - Montrez les 3 gabarits locaux en haut (**`Compact (10m × 10m)`**, **`Moyen (20m × 20m)`**, **`Étendu (40m × 40m)`**), le score de préparation sur 100 (géométrie, accessibilité causale, invariants, budget d'entités) et cliquez sur **`💾 Télécharger le rapport`**.

---

## 🎒 Hands-On n°8 : Pourquoi la 3D Plutôt qu'un Site 2D ? « Physics-over-Forms » & Robotique LeRobot (`F3`)

### ❌ Le Problème
1. **L'erreur du Web 3D gadget :** Copier-coller des fiches produits 2D sur des murs virtuels en 3D est inutile et fait fuir 95 % des utilisateurs. La 3D n'a de sens que si la **géométrie physique 1:1** remplace les formulaires texte.
2. **Le gaspillage des traces 3D :** Dans les mondes virtuels classiques, les manipulations physiques réalisées par les utilisateurs sont perdues dès qu'ils quittent la session.

### ✅ La Force de WorldPilot
1. **« Physics-over-Forms » :** Au lieu de lire `Dimensions : 38 × 26 × 3 cm` sur une fiche technique, l'utilisateur glisse physiquement l'ordinateur 15.6" dans le sac 3D à l'échelle 1:1 pour prouver qu'il rentre.
2. **Fonderie de Données Robotiques (Hugging Face LeRobot v2.1) :** Chaque geste humain validé en 3D est converti en trajectoires **6-DoF $\text{SE}(3)$** annotées avec récompense causale $r_t$ et **score ergonomique biomécanique ISO 11226 RULA** (mesurant la fatigue posturale en casque VR).

### 🛠️ Mise en Scène Pas-à-Pas
1. **Charger la scène dédiée du sac 42L (Prompt n°8) :**
   - Cliquez sur **`🎬 Parcours guidé`** dans la barre supérieure et lancez **`🎒 Mindel : Sac 42L & Capacité Spatiale`** (ou saisissez `Montrer la capacité d'un sac de voyage 42L` dans le volet droit + `Entrée`).
   - **Ce que vous observez :** L'atelier mécanique disparaît (voiture, Nova et Marc sont nettoyés). La scène bascule dans la galerie studio sombre et or à fort contraste (sans éblouissement blanc). La table centrale accueille les 4 objets nettement espacés (dégagement de 28 cm garanti entre chaque pour éviter tout chevauchement) : *Gourde Isotherme*, *Sac Nomade Pro 42L*, *Ordinateur Pro 15.6"* et *Gros Carton*. Le volet de gauche affiche la procédure technique *« Mindel : Test de Volume & Gabarit 3D »*.
2. **Prouver la compatibilité physique par la 3D (« Physics-over-Forms ») & Détection d'Intention Inverse :**
   - Saisissez l'**Ordinateur Portable 15.6"** à la souris et glissez-le vers le **Sac Nomade Pro 42L** : la physique 3D valide l'insertion volumétrique à l'échelle 1:1.
   - Le moteur d'intention inverse (*Inverse Intent Engine*) détecte immédiatement l'interaction spontanée et fait apparaître la bulle holographique `⚡ Impulsion physique (87%)` avec le bouton vert `✨ Promouvoir en Règle Active` (et `✕ Ignorer`). Vous pouvez ignorer ou promouvoir la règle.
3. **Exporter les gestes 3D en Dataset Robotique LeRobot v2.1 :**
   - Saisissez dans le champ **`Votre intention`** puis appuyez sur `Entrée` :
     ```text
     exporte lerobot
     ```
     *(ou ouvrez **`F3`** > Onglet **`3. Robotique (LeRobot)`**).*
   - Montrez les 3 indicateurs clés : le nombre de **trames MDP $(s_t, a_t, r_t)$**, le **score ergonomique biomécanique ISO RULA (`1.8 / 7.0 Optimal`)** et la densité d'activité spatiale Victoria VR.
   - Cliquez sur **`🎬 1. Simuler Trace 6-DoF`** puis sur **`🤖 2. Exporter LeRobot v2.1 (.JSON)`** pour télécharger le dataset prêt pour l'entraînement de modèles *Vision-Language-Action (VLA)*.

---

## 🏁 Conclusion : Ce que ce Hands-On Démontre (Générateur 3D Classique vs. WorldPilot)

| Dimension | ❌ Générateur Text-to-3D Classique | ✅ WorldPilot (Contrôle & Observabilité) |
| :--- | :--- | :--- |
| **Transparence de la logique** | Boîte noire (décor muet ou code opaque) | Graphe causal bidirectionnel `3D ⇄ Logique` & `WorldIR` YAML (`F2`) |
| **Édition au Prompt n°2, n°3… n°9** | Écrase la scène ou casse silencieusement les anciennes règles | Patch différentiel + **Invariants formels** (`⚠️ VIOLÉ` $\to$ `✅ VÉRIFIÉ`) |
| **Remplacement d'objet & Ordre des prompts** | Règles orphelines dès qu'un objet est remplacé ($W_{AB} \neq W_{BA}$) | **Re-câblage automatique** des règles & Équivalence prouvée ($W_{AB} \approx_\Omega W_{BA}$) |
| **Collision physique lors d'un prompt** | Blocage silencieux de la quête (*Spatial Deadlock*) | **Blast Radius** + Onde de choc 3D rouge + **Auto-guérison Pareto (`< 8.4 ms`)** |
| **Interaction imprévue en casque VR** | Ignorée (nécessite de retourner coder au clavier) | **Inférence d'Intention Inverse (`⚡ Impulsion physique`)** promue en règle en 1 clic |
| **Évaluation de l'utilisateur** | Ne distingue pas le clic au hasard de la compréhension réelle | **Observatoire Bayésien ($H_1$ vs $H_2$)** & Mutation adaptative **$E_1 \to E_2$** (`F3`) |
| **Industrialisation & Valeur des traces** | Tests manuels impossibles à grande échelle ; gestes perdus | **Playtester IA (`Cmd+Y`)**, **World Lighthouse (`Cmd+P`)** & **Export LeRobot v2.1** |
| **Portabilité Multi-Moteur (`WorldAdapter`)** | Couplé en dur à un seul moteur de rendu / géométrie muette | **`WorldIR ≠ Mesh 3D`** : `R3FWebGLWorldAdapter` $\rightleftarrows$ `UnrealVictoriaVRWorldAdapter` (Z-Up `[cm]`) |

---

## 🏛️ Bonus : Le Centre de Preuve Visuelle « `🏛️ 4 Piliers` » (`F2`) & Vérification Automatisée (`npm run verify`)

Pour démontrer l'intégralité de ces garanties en direct devant le jury en quelques secondes, ouvrez **`⚡ Observabilité Réactive` (`F2`)** et cliquez sur l'onglet **`🏛️ 4 Piliers`** :
1. **Bandeau Permanent des 4 Preuves Architecturales** (en haut de `F2`) :
   - `⚡ 60 FPS • 0 eval() • 0 ms LLM`
   - `🛡️ Invariants (1)` $\to$ `⚠️ Invariant VIOLÉ` $\to$ `✅ Invariant VÉRIFIÉ`
   - `🧪 AB≈BA : 100% vs 16.7%`
   - `🔌 WebGL ⇄ Unreal`
2. **Déclencheurs 1-Clic Auto-Contenus dans l'onglet `🏛️ 4 Piliers`** :
   - **Pilier 1 (Édition Non-Destructive & Commutativité)** :
     - Bouton **`🧪 Labo AB/BA (100%)`** : ouvre le laboratoire comparatif `C0` (16.7%) vs `C5` (100%).
     - Bouton **`🔗 Batterie ➔ Générateur`** : déclenche le remplacement avec la bannière dorée de lignée sémantique.
     - Bouton **`💥 Simuler Blast Radius`** : déclenche l'obstruction spatiale `COLLIDER_DEADLOCK` avec la sphère 3D rouge.
     - Bouton **`✨ Pareto Auto-Heal`** : résout instantanément la collision à `+0.85m` (`< 8.4 ms`).
   - **Pilier 2 (Zéro Code Généré & Sûreté Formelle)** :
     - Bouton **`🔍 Casser Invariant (Prof=2)`** : exécute le model-checker BFS et allume le badge rouge `⚠️ VIOLÉ`.
     - Bouton **`🔒 Verrouiller (0 Faille)`** : applique la précondition stricte `require_flag` et repasse au vert `✅ VÉRIFIÉ`.
   - **Pilier 3 (Industrialisation à 10 000 Mondes)** :
     - Bouton **`🤖 Playtester 10x`** : lance le playtest synthétique autonome multi-agents.
     - Bouton **`🏛️ Lighthouse 100/100`** : ouvre la grille d'audit de pré-publication Victoria VR.
     - Bouton **`🛰️ Bayésien E1➔E2`** : ouvre l'observatoire bayésien et la mutation contrefactuelle.
   - **Pilier 4 (Portabilité Multi-Moteur / WorldAdapter)** :
     - Sélecteur 3 cibles : **`🟢 R3F WebGL`** (Studio Actif), **`🔌 Unreal Engine`** (VR AI Builder), **`🤖 LeRobot v2.0`** (HDF5 / JSON-LD).
     - Bouton sous Unreal : **`📥 Exporter JSON Unreal 5.4 (Victoria VR)`** (`worldpilot-unreal-victoria-vr.json` compilé en `AActor` Z-Up `[cm]`, `UBoxComponent` TriggerSocket et `UWorldPilotCausalRuleRow`).
     - Bouton sous LeRobot : **`📊 Ouvrir Export LeRobot (F3)`** (ouvre directement l'onglet d'export dans l'Observatoire).

### 🧪 Exécuter toute la suite de certification automatisée en ligne de commande

```bash
# Exécuter uniquement l'audit complet des 4 Piliers & des 9 Prompts Hands-On :
npm run test:pillars

# Exécuter l'ensemble des 6 suites de tests + build de production TypeScript/Vite :
npm run verify
```


