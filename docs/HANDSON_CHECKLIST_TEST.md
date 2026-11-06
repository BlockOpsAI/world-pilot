# ⚡ Checklist de Test Pas-à-Pas (Hands-On WorldPilot)

Ce document est la version opérationnelle ultra-brève du Hands-On.  
**Structure des scènes :**
- **🟢 BLOC 1 (Atelier Mécanique) : Hands-On 1 à 7 s'enchaînent EN CONTINU dans la même scène active.** Chaque étape s'appuie sur les objets et règles créés par les étapes précédentes.
- **🔵 BLOC 2 (Bagagerie 3D & Robotique) : Hands-On 8 REPART DE ZÉRO** en chargeant une toute nouvelle scène (`Sac 42L`).

---

# 🟢 BLOC 1 : ATELIER MÉCANIQUE (Hands-On 1 à 7 en continu)

## 🧪 Hands-On 1 : Page Blanche & Découverte Logique
*(Point de départ : on initialise la scène)*

- **Étape 1.1 — Ouvrir le moniteur `F2`**
  - **Action** : Appuyer sur `F2` (ou cliquer sur `⚡ Observabilité & Causalité` en bas à droite).
  - **Vérification** : La fenêtre `⚡ Observabilité Réactive` s'ouvre avec le badge vert `LIVE`.

- **Étape 1.2 — Réinitialiser la scène**
  - **Action** : Saisir `vider` dans le champ `Votre intention` (volet droit) puis `Entrée`.
  - **Vérification** : La scène 3D est vide. `F2` indique `0 Entité`, `0 Règle`, `0 Flag`.

- **Étape 1.3 — Charger l'atelier mécanique (Prompt 1)**
  - **Action** : Saisir `Montrer comment changer une batterie dans une voiture` + `Entrée`.
  - **Vérification** : La berline bleue capot ouvert, l'établi, la batterie 12V et le bac moteur apparaissent. `F2` affiche 3 flags rouges `FALSE`, 2 règles causales et 1 invariant conforme. Volet gauche : Étape 1/2.

- **Étape 1.4 — Valider l'action (3D ➔ Logique)**
  - **Action** : Dans la scène 3D, cliquer sur la Batterie 12V, puis sur le bouton d'action vert prominent « ⚡ Inspecter la nouvelle batterie » en haut de la carte 3D (ou le bouton vert du volet de quête à gauche).
  - **Vérification** : Le guidage passe à l'Étape 2/2, un repère vert apparaît au-dessus du moteur, et dans `F2 > 🚩 Flags`, `battery_inspected` et `step_battery_1_completed` passent à `TRUE` (vert).

- **Étape 1.5 — Forçage réactif (Logique ➔ 3D)**
  - **Action** : Dans `F2 > 🚩 Flags`, cliquer sur le badge vert `TRUE` de `battery_inspected` pour le repasser à `FALSE`.
  - **Vérification** : La quête rétrograde à l'Étape 1/2 et le repère vert du moteur s'éteint.
  - **Action** : En bas de `F2`, cliquer sur `⏩ Forcer la validation de l'étape (2/2)`.
  - **Vérification** : La quête repasse à l'Étape 2/2, `battery_inspected` repasse à `TRUE` et une notification de forçage s'affiche.

- **Étape 1.6 — Simulation de règle (Dry-Run)**
  - **Action** : Dans `F2 > ⚡ Règles`, sur la carte `rule_inspect_car_battery` (ou `rule_install_car_battery`), cliquer sur `⚡ Simuler l'exécution`.
  - **Vérification** : Le bouton s'allume en vert `✓ Déclenché !` pendant 1.8s, un carillon retentit, le bandeau toast confirme l'exécution manuelle et le flux causal de `F2` enregistre l'événement (sans ouvrir de modale). Si `battery_inspected` est `FALSE`, la règle d'installation bloque le DROP conformément à sa condition.

---

## 🛡️ Hands-On 2 : Invariant, Détection de Faille & Verrouillage
*(S'enchaîne directement dans la scène mécanique active)*

- **Étape 2.1 — Règle spontanée additionnelle (Optionnel)**
  - **Action** : Saisir `Si je pose ça ici, déclenche une alerte et réinitialise` + `Entrée`.
  - **Vérification** : Une seconde règle DROP nommée `rule_alert_and_reset` s'ajoute dans `F2 > ⚡ Règles` (en plus de `rule_install_car_battery`), sans modifier les entités existantes.

- **Étape 2.2 — Poser l'invariant de sûreté (Prompt 2)**
  - **Action** : Saisir `Personne ne doit terminer cette formation sans inspecter la batterie` + `Entrée`.
  - **Vérification** : Dans `F2 > 🛡️ Invariants`, l'invariant unique `INV_CAR_BATTERY_INSPECT_FIRST` affiche le badge vert `✔ CONFORME` (sans doublon).

- **Étape 2.3 — Chercher une faille (Prompt 3)**
  - **Action** : Saisir `Essaie de casser cette expérience` + `Entrée`.
  - **Vérification** : Le bouton du bandeau supérieur de `F2` et la carte dans `🛡️ Invariants` passent en rouge vif `⚠️ Invariant VIOLÉ` avec le contre-exemple formel (DROP batterie direct vers moteur).

- **Étape 2.4 — Verrouiller la règle par prompt (Prompt 4)**
  - **Action** : Saisir `Verrouille l'inspection de la batterie avant de terminer la formation` + `Entrée`.
  - **Vérification** : Dans `F2 > 🛡️ Invariants`, le badge repasse au vert `✅ VÉRIFIÉ` avec la mention `require_flag(battery_inspected == TRUE)`.

- **Étape 2.5 — Contre-épreuve de non-régression**
  - **Action** : Saisir `Essaie de casser cette expérience` + `Entrée`.
  - **Vérification** : Notification verte confirmant qu'aucun contre-exemple n'a été trouvé (100% vérifié).

---

## 🔄 Hands-On 3 : Remplacement d'Objet & Commutativité AB/BA
*(S'enchaîne directement : on remplace la batterie protégée au Hands-On 2)*

- **Étape 3.1 — Déplacement partiel (Optionnel)**
  - **Action** : Saisir `Déplace la batterie de 50 cm vers la droite` + `Entrée`.
  - **Vérification** : La batterie se décale vers la droite sur l'établi, toutes les règles restent intactes.

- **Étape 3.2 — Remplacer la batterie par un générateur (Prompt 5)**
  - **Action** : Saisir `Remplace la batterie par un générateur en gardant sa position` + `Entrée`.
  - **Vérification** : Le maillage de la batterie est remplacé par le générateur 3D. Le bandeau `🔗 Lignée Sémantique (WorldPatch)` s'affiche en haut de `F2` (*100% Règles & Invariants re-câblés*). Dans `F2 > ⚡ Règles`, chaque carte affiche désormais la ligne `🔗 Câblage : Generateur ➔ Bac à batterie` (la règle pointe vers le nouvel objet sans devenir orpheline).

- **Étape 3.3 — Laboratoire AB/BA : Échec séquentiel (C0)**
  - **Action** : Saisir `test ab ba` + `Entrée` (ou cliquer sur `🧪 AB≈BA : 100% vs 16.7%` dans `F2`).
  - **Vérification** : La fenêtre modale `Edit-Order Commutativity Lab` s'ouvre.
  - **Action** : Cliquer sur le bouton `❌ Simuler C0 Naive (16.7%)` (ou sélectionner la barre C0 puis cliquer sur `▶ Lancer le Test AB / BA`).
  - **Vérification** : Résultat rouge `❌ RÉGRESSION D'ORDRE DÉTECTÉE (C0_NaiveSequential) : W_AB ≠ W_BA` (16.7% de survie).

- **Étape 3.4 — Laboratoire AB/BA : Succès WorldPilot (C5)**
  - **Action** : Cliquer sur le bouton `✅ Simuler C5 WorldPilot (100%)` (ou sélectionner la barre C5 puis cliquer sur `▶ Lancer le Test AB / BA`).
  - **Vérification** : Résultat vert émeraude `✅ COMMUTATIVITÉ FORMELLE PROUVÉE (C5_DependencyAwareMinimalRepair) : W_AB ≈_Ω W_BA (0.00 Divergence)`, divergence `[0.00 ... 0.00]`. Cliquer sur `✕ Fermer`.

---

## 💥 Hands-On 4 : Collision Spatiale & Auto-Guérison
*(S'enchaîne directement : on rapproche l'établi de la voiture du Hands-On 3)*

- **Étape 4.1 — Provoquer une collision physique (Prompt 6)**
  - **Action** : Saisir `Déplace l'établi juste devant le compartiment moteur` + `Entrée`.
  - **Vérification** : L'établi se déplace seul devant le compartiment moteur (laissant le générateur sur sa position d'origine à gauche), une sphère 3D rouge pulsante apparaît sur la collision, et le bandeau `💥 BLAST RADIUS (COLLIDER_DEADLOCK)` s'allume en haut de `F2`.

- **Étape 4.2 — Auto-guérison de Pareto (Prompt 7)**
  - **Action** : Saisir `Corrige le conflit spatial sans annuler mon intention` + `Entrée` (ou cliquer sur `✨ Auto-Guérir` dans la bannière de `F2`).
  - **Vérification** : L'établi recule à +0.85m, la sphère rouge disparaît, et la bannière passe au vert `✅ PARETO AUTO-HEAL (< 8.4 ms)`.

---

## 👆 Hands-On 5 : Règle Gestuelle In-Situ (VR)
*(S'enchaîne directement : manipulation du générateur et de la voiture)*

- **Étape 5.1 — Geste 3D spontané**
  - **Action** : Dans la scène 3D, cliquer-glisser le Générateur vers la Voiture (ou cliquer sur `✨ 3. Tracer Arc Intention 3D` dans `F3 > 2. Neuro-Symbolique`).
  - **Vérification** : Un arc lumineux 3D relie les deux objets et une bulle holographique `⚡ Impulsion physique` apparaît au-dessus.

- **Étape 5.2 — Compiler le geste en règle**
  - **Action** : Cliquer sur `✨ Promouvoir en Règle Active` directement sur la bulle 3D au-dessus du moteur (ou dans `F3 > 2. Neuro-Symbolique` sur le bouton vert `✨ Compiler en Règle`).
  - **Vérification** : Une nouvelle règle causale apparaît dans `F2 > ⚡ Règles` sans aucune saisie clavier.

---

## 🧠 Hands-On 6 : Observatoire Bayésien & Boucle E1 ➔ E2
*(S'exécute sur la scène active via le moniteur F3)*

- **Étape 6.1 — Ouvrir l'Observatoire (`F3`)**
  - **Action** : Appuyer sur `F3` (ou cliquer sur `🛰️ L'Observatoire` dans la barre du haut au centre) puis ouvrir l'onglet `1. Anti-Jetable (E1➔E2)`.
  - **Vérification** : Le panneau bayésien et les jauges de probabilité H1 / H2 s'affichent. *(Note : le bouton en bas à droite `⚡ Observabilité & Causalité` / F2 ouvre l'inspecteur local).*

- **Étape 6.2 — Simuler un comportement de piège / hasard (H1)**
  - **Action** : Cliquer sur le bouton `⚠️ 1. Simuler Piège H1`.
  - **Vérification** : La jauge rouge `H1 : Essai-Erreur / Piège` grimpe et un bandeau toast persistant s'affiche directement au-dessus du rectangle « L'Anti-Générateur Jetable » (il reste visible jusqu'au clic pour le fermer). Dans la scène 3D, une sphère filaire d'alerte `⚠️ Obstruction physique (Collision)` matérialise l'anomalie.

- **Étape 6.3 — Simuler une résolution causale experte (H2)**
  - **Action** : Cliquer sur le bouton `🎯 2. Simuler Maîtrise H2`.
  - **Vérification** : La jauge verte `H2 : Maîtrise Causale` bondit à > 95% et l'incertitude épistémique chute. Le bandeau toast se met à jour.

- **Étape 6.4 — Muter la scène vers E2**
  - **Action** : Cliquer sur `⚡ 3. Muter la Scène 3D vers E2`.
  - **Vérification** : La scène mute vers l'Épreuve E2 sans détruire la voiture :
    1. Une balise holographique violette rotative `🔮 Balise de Transfert Invariant [Épreuve E2]` apparaît à côté du véhicule ;
    2. L'avatar `Ingénieure Nova` rejoint Marc dans l'atelier ;
    3. Le volet de quête à gauche passe à `Épreuve de Transfert Invariant (Étape 1/1)`. Fermer la modale `F3`.

---

## 🤖 Hands-On 7 : Playtesting Synthétique & Certification
*(S'exécute sur le monde actif via les raccourcis de contrôle qualité)*

- **Étape 7.1 — Lancer le Playtester IA**
  - **Action** : Saisir `playtest` + `Entrée` (ou raccourci `Cmd+Y` / `Ctrl+Y`).
  - **Vérification** : La modale « Vérification spatiale estimée » s'affiche avec ses badges `HEURISTIQUE GÉOMÉTRIQUE` et `PATCH SUGGÉRÉ`, ainsi que les 5 profils cognitifs (`⚡ Speedrunner`, `🧭 Explorateur`, `🧪 Playtester`, `🎓 Apprenti`, `🧠 Clone Humain`).
    - Par défaut, `⚡ Speedrunner` valide le parcours à 100% (3 waypoints spatiaux, durée estimée 5.4s) et trace sa trajectoire 3D surmontée du badge `🤖 Playtester (speedrunner) 100% complété`.
    - Cliquer sur les autres boutons (`🧭 Explorateur`, `🧪 Playtester`, etc.) pour afficher leurs trajectoires et comportements respectifs.
    - Fermer la modale (ou cliquer sur `🛡️ Ouvrir Publish Readiness Gate` pour enchaîner sur 7.2).

- **Étape 7.2 — Lancer la certification (World Lighthouse)**
  - **Action** : Saisir `certifie le monde` + `Entrée` (ou raccourci `Cmd+P` / `Ctrl+P`, ou cliquer sur `🛡️ Ouvrir Publish Readiness Gate`).
  - **Vérification** : La modale officielle de certification Victoria VR s'affiche avec les 3 gabarits de parcelles (`Compact (10m × 10m)`, `Moyen (20m × 20m)`, `Étendu (40m × 40m)`), les jauges de conformité, le score global sur 100 et le bouton `💾 Télécharger le rapport`. Fermer la modale.

---

# 🔵 BLOC 2 : NOUVELLE SCÈNE DÉDIÉE (Hands-On 8)

## 🎒 Hands-On 8 : « Physics-over-Forms » & Dataset LeRobot
*(REPART DE ZÉRO : cette commande remplace la scène mécanique par celle du sac 42L)*

- **Étape 8.1 — Charger la scène du sac 42L**
  - **Action** : Saisir `Montrer la capacité d'un sac de voyage 42L` + `Entrée` (ou dans `🎬 Parcours guidé` > `🎒 Mindel : Sac 42L`).
  - **Vérification** : L'atelier mécanique disparaît (voiture, Nova et Marc sont purgés). La scène bascule dans la galerie studio sombre et or à fort contraste (sans éblouissement blanc). La table centrale accueille les 4 objets bien espacés (au moins 28 cm de jeu entre chaque) : Gourde Isotherme, Sac Nomade Pro 42L, Ordinateur Pro 15.6" et Gros Carton incompatible. Volet de quête à gauche : *Mindel : Test de Volume & Gabarit 3D*.

- **Étape 8.2 — Test d'insertion physique 1:1**
  - **Action** : Glisser l'ordinateur 15.6" dans le sac 42L à la souris.
  - **Vérification** : Collision et insertion physique validées à l'échelle 1:1. Le moteur d'intention inverse (Inverse Intent Engine) détecte le geste spontané et affiche la bulle holographique `⚡ Impulsion physique (87%)` avec le bouton `✨ Promouvoir en Règle Active` (ce qui confirme la détection continue de l'IA sans clavier). Vous pouvez cliquer sur `✕ Ignorer` ou `✨ Promouvoir en Règle Active`.

- **Étape 8.3 — Exporter le dataset robotique LeRobot**
  - **Action** : Saisir `exporte lerobot` + `Entrée` (ou ouvrir `F3 > 3. Robotique (LeRobot)`).
  - **Vérification** : Le panneau robotique s'ouvre avec les trames MDP $(s, a, r)$ et le score ergonomique ISO RULA (`1.8 / 7.0 Optimal`).
  - **Action** : Cliquer sur `🎬 1. Simuler Trace 6-DoF` puis sur `🤖 2. Exporter LeRobot v2.1 (.JSON)`.
  - **Vérification** : Téléchargement du fichier JSON compatible Hugging Face LeRobot v2.1.
