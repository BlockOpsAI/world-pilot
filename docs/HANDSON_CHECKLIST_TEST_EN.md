# ⚡ Step-by-Step Test Checklist (WorldPilot Hands-On)

This document is the concise, operational version of the WorldPilot Hands-On test sequence.  
**Scene Structure:**
- **🟢 BLOCK 1 (Mechanical Workshop): Hands-On 1 to 7 run CONTINUOUSLY in the same active scene.** Each step builds on the entities, rules, and invariants created in earlier steps.
- **🔵 BLOCK 2 (3D Luggage & Robotics): Hands-On 8 STARTS FRESH** by loading a completely new scene (`42L Bag`).

---

# 🟢 BLOCK 1: MECHANICAL WORKSHOP (Hands-On 1 to 7 in Continuous Sequence)

## 🧪 Hands-On 1: Blank Slate & Logic Inspection
*(Starting point: reset and initialize the scene)*

- **Step 1.1 — Open the `F2` Monitor**
  - **Action**: Press `F2` (or click `⚡ Observability & Causality` in the bottom-right corner).
  - **Verification**: The `⚡ Reactive Observability` panel opens with the green `LIVE` badge.

- **Step 1.2 — Reset the Scene**
  - **Action**: Type `clear` (or `reset` or `vider`) into the `Your intent` input (right sidebar) and press `Enter`.
  - **Verification**: The 3D scene is empty. `F2` displays `0 Entities`, `0 Rules`, `0 Flags`.

- **Step 1.3 — Load the Mechanical Workshop (Prompt 1)**
  - **Action**: Type `Show how to change a car battery` (or `Montrer comment changer une batterie dans une voiture`) + `Enter`.
  - **Verification**: The blue sedan with open hood, workbench, 12V battery, and battery tray appear. `F2` shows 3 red `FALSE` flags, 2 causal rules, and 1 verified invariant. Left panel: Step 1/2.

- **Step 1.4 — Validate Action (3D ➔ Logic)**
  - **Action**: In the 3D scene, click the 12V Battery, then click the prominent green button at the top of the 3D card (e.g. `🎯 Inspect the battery…` or `⚡ Inspect…`), or click the green button in the left Quest HUD (`⚡ Launch action`).
  - **Verification**: The quest advances to Step 2/2, a green target indicator appears above the engine bay, and in `F2 > 🚩 Flags`, `battery_inspected` and `step_battery_1_completed` turn `TRUE` (green).

- **Step 1.5 — Reactive Force-Toggle (Logic ➔ 3D)**
  - **Action**: In `F2 > 🚩 Flags`, click the green `TRUE` badge of `battery_inspected` to toggle it back to `FALSE`.
  - **Verification**: The quest demotes back to Step 1/2 and the green engine target marker turns off.
  - **Action**: At the bottom of `F2`, click `⏭️ Force step validation (2/2)`.
  - **Verification**: The quest advances back to Step 2/2, `battery_inspected` returns to `TRUE`, and a force validation toast appears.

- **Step 1.6 — Rule Simulation (Dry-Run)**
  - **Action**: In `F2 > ⚡ Rules`, on `rule_inspect_car_battery` (or `rule_install_car_battery`), click `⚡ Simuler l'exécution` (Simulate execution).
  - **Verification**: The button lights up green `✓ Déclenché !` for 1.8s, a chime sounds, and the toast confirms manual triggering. If `battery_inspected` is `FALSE`, the installation rule blocks the DROP per its precondition.

---

## 🛡️ Hands-On 2: Invariants, Flaw Detection & Causal Lock
*(Runs directly in the active mechanical scene)*

- **Step 2.1 — Spontaneous Additional Rule (Optional)**
  - **Action**: Type `If I drop this here, trigger an alert and reset` + `Enter`.
  - **Verification**: A second DROP rule named `rule_alert_and_reset` is added in `F2 > ⚡ Rules`, without modifying existing entities.

- **Step 2.2 — Add Safety Invariant (Prompt 2)**
  - **Action**: Type `Nobody should complete this training without inspecting the battery` + `Enter`.
  - **Verification**: In `F2 > 🛡️ Invariants`, the invariant `INV_CAR_BATTERY_INSPECT_FIRST` displays the green `✔ CONFORME` badge.

- **Step 2.3 — Search for Flaws (Prompt 3)**
  - **Action**: Type `Try to break this experience` + `Enter`.
  - **Verification**: The top banner button in `F2` and the invariant card turn bright red: `⚠️ Invariant VIOLATED` with a formal counter-example (direct battery DROP to engine).

- **Step 2.4 — Lock the Rule by Prompt (Prompt 4)**
  - **Action**: Type `Lock battery inspection before finishing the training` + `Enter`.
  - **Verification**: In `F2 > 🛡️ Invariants`, the badge turns green `✅ VERIFIED` with the precondition `require_flag(battery_inspected == TRUE)`.

- **Step 2.5 — Non-Regression Counter-Test**
  - **Action**: Type `Try to break this experience` + `Enter`.
  - **Verification**: Green notification confirming that zero counter-examples were found (100% verified across 3 event depths).

---

## 🔄 Hands-On 3: Entity Replacement & AB/BA Commutativity
*(Runs directly: replacing the battery protected in Hands-On 2)*

- **Step 3.1 — Partial Translation (Optional)**
  - **Action**: Type `Move the battery 50 cm to the right` + `Enter`.
  - **Verification**: The battery shifts 50 cm to the right on the workbench; all causal rules stay intact.

- **Step 3.2 — Replace Battery with Generator (Prompt 5)**
  - **Action**: Type `Replace the battery with a generator while keeping its position` + `Enter`.
  - **Verification**: The battery mesh is replaced by the 3D generator. The `🔗 Semantic Lineage (WorldPatch)` banner appears at the top of `F2` (*100% Rules & Invariants rewired*). In `F2 > ⚡ Rules`, rules now point to `Generateur ➔ Bac à batterie` without becoming orphaned.

- **Step 3.3 — AB/BA Lab: Sequential Failure (C0)**
  - **Action**: Type `test ab ba` + `Enter` (or click `🧪 AB≈BA : 100% vs 16.7%` in `F2`).
  - **Verification**: The `Edit-Order Commutativity Lab` modal opens.
  - **Action**: Click `❌ Simuler C0 Naive (16.7%)` (or select C0 and click `▶ Launch AB / BA Test`).
  - **Verification**: Red failure banner: `❌ ORDER REGRESSION DETECTED (C0_NaiveSequential): W_AB ≠ W_BA` (16.7% survival).

- **Step 3.4 — AB/BA Lab: WorldPilot Success (C5)**
  - **Action**: Click `✅ Simuler C5 WorldPilot (100%)`.
  - **Verification**: Emerald green result: `✅ FORMAL COMMUTATIVITY PROVED (C5_DependencyAwareMinimalRepair): W_AB ≈_Ω W_BA (0.00 Divergence)`, canonical state hash identical (`86e1f070`). Click `✕ Close`.

---

## 💥 Hands-On 4: Spatial Collision & Pareto Auto-Healing
*(Runs directly: moving the workbench towards the car from Hands-On 3)*

- **Step 4.1 — Cause a Physical Collision (Prompt 6)**
  - **Action**: Type `Move the workbench right in front of the engine compartment` + `Enter`.
  - **Verification**: The workbench moves in front of the engine bay (leaving the generator on its left origin), a pulsing red shockwave sphere appears, and the `💥 BLAST RADIUS (COLLIDER_DEADLOCK)` banner lights up in `F2`.

- **Step 4.2 — Pareto Auto-Healing (Prompt 7)**
  - **Action**: Type `Fix the spatial conflict without cancelling my intent` + `Enter` (or click `✨ Auto-Heal` in `F2`).
  - **Verification**: The workbench shifts back by +0.85m, the red sphere vanishes, and the banner turns green: `✅ PARETO AUTO-HEAL (< 8.4 ms)`.

---

## 👆 Hands-On 5: In-Situ Gestural Rule (VR)
*(Runs directly: manipulating generator and car)*

- **Step 5.1 — Spontaneous 3D Gesture**
  - **Action**: In the 3D scene, drag the Generator towards the Car (or click `✨ 3. Trace 3D Intent Arc` in `F3 > 2. Neuro-Symbolic`).
  - **Verification**: A glowing 3D Bézier curve links both objects and a floating holographic card `⚡ Physical impulse (87%)` appears.

- **Step 5.2 — Promote Gesture to Active Rule**
  - **Action**: Click `✨ Promote to Active Rule` directly on the 3D bubble above the car (or in `F3 > 2. Neuro-Symbolic` click `✨ Compiler en Règle`).
  - **Verification**: A new causal rule appears in `F2 > ⚡ Rules` without any keyboard typing.

---

## 🧠 Hands-On 6: Bayesian Observatory & E1 ➔ E2 Loop
*(Executed on active scene via F3 monitor)*

- **Step 6.1 — Open the Observatory (`F3`)**
  - **Action**: Press `F3` (or click `🛰️ Observatory` in the top navbar) and open tab `1. Anti-Jetable (E1➔E2)`.
  - **Verification**: The Bayesian panel and probability gauges H1 / H2 appear. *(Note: bottom-right `⚡ Observability & Causality` / F2 is the local causal debugger).*

- **Step 6.2 — Simulate Guessing / Random Behavior (H1)**
  - **Action**: Click `⚠️ 1. Simuler Piège H1`.
  - **Verification**: The red gauge `H1 : Trial & Error / Trap` climbs, and a persistent toast appears directly above "L'Anti-Générateur Jetable" (stays visible until clicked). In 3D, a yellow wireframe sphere `⚠️ Obstruction physique (Collision)` marks the trap.

- **Step 6.3 — Simulate Expert Causal Mastery (H2)**
  - **Action**: Click `🎯 2. Simuler Maîtrise H2`.
  - **Verification**: The green gauge `H2 : Causal Mastery` jumps to > 95% and epistemic uncertainty drops.

- **Step 6.4 — Mutate Scene to E2**
  - **Action**: Click `⚡ 3. Muter la Scène 3D vers E2`.
  - **Verification**: The scene adapts into Challenge E2 without destroying the car:
    1. A purple rotating holographic beacon `🔮 Balise de Transfert Invariant [Épreuve E2]` appears next to the car;
    2. Autonomous avatar `Ingénieure Nova` joins Marc in the shop;
    3. The left quest panel updates to `Épreuve de Transfert Invariant (Step 1/1)`. Close `F3`.

---

## 🤖 Hands-On 7: Synthetic Playtesting & Certification
*(Executed on active scene via QA shortcuts)*

- **Step 7.1 — Run AI Synthetic Playtester**
  - **Action**: Type `playtest` + `Enter` (or press `Cmd+Y` / `Ctrl+Y`).
  - **Verification**: The modal `Estimated Spatial Verification` appears with `GEOMETRIC HEURISTIC` and `SUGGESTED PATCH` badges, alongside 5 cognitive profiles (`⚡ Speedrunner`, `🧭 Explorer`, `🧪 Playtester`, `🎓 Novice`, `🧠 Human Clone`).
    - By default, `⚡ Speedrunner` verifies 100% path clearance (3 spatial waypoints, ~5.4s) and traces a visible 3D trajectory topped by badge `🤖 Playtester (speedrunner) 100% complété`.
    - Click other personas (`🧭 Explorer`, `🧪 Playtester`, etc.) to view alternative trajectories.
    - Close the modal (or click `🛡️ Open Publish Readiness Gate` to proceed to 7.2).

- **Step 7.2 — Run World Certification (World Lighthouse)**
  - **Action**: Type `certify the world` + `Enter` (or press `Cmd+P` / `Ctrl+P`, or click `🛡️ Open Publish Readiness Gate`).
  - **Verification**: The official Victoria VR readiness modal displays the 3 parcel presets (`Compact (10m × 10m)`, `Medium (20m × 20m)`, `Extended (40m × 40m)`), compliance gauges, total score out of 100, and `💾 Download Report`. Close the modal.

---

# 🔵 BLOCK 2: DEDICATED NEW SCENE (Hands-On 8)

## 🎒 Hands-On 8: « Physics-over-Forms » & LeRobot Robotics Dataset
*(STARTS FRESH: this command replaces the mechanical workshop with the 42L bag showcase)*

- **Step 8.1 — Load the 42L Bag Scene**
  - **Action**: Type `Show the capacity of a 42L travel bag` (or `Montrer la capacité d'un sac de voyage 42L`) + `Enter` (or select `🎬 Guided Tour` > `🎒 Mindel : Bag 42L`).
  - **Verification**: Mechanical workshop clears (car, Nova, and Marc are purged). Scene switches to dark studio gallery with gold contrast (zero blinding glare). The central table features 4 comfortably spaced objects (at least 28 cm clearance between each): Insulated Bottle, 42L Nomad Bag, 15.6" Laptop, and Incompatible Box. Left quest HUD: *Mindel: Volume & 3D Clearance Test*.

- **Step 8.2 — 1:1 Physical Insertion Test & Inverse Intent**
  - **Action**: Drag the 15.6" Laptop into the 42L Bag with the mouse.
  - **Verification**: 1:1 physical collision and volume insertion validated. The Inverse Intent Engine detects the spontaneous gesture and displays the holographic popin `⚡ Physical impulse (87%)` with `✨ Promote to Active Rule` and `✕ Ignore`. Click either `✕ Ignore` or `✨ Promote to Active Rule`.

- **Step 8.3 — Export LeRobot Robotics Dataset**
  - **Action**: Type `export lerobot` + `Enter` (or open `F3 > 3. Robotics (LeRobot)`).
  - **Verification**: Robotics panel opens with MDP frames $(s, a, r)$ and ISO RULA ergonomic score (`1.8 / 7.0 Optimal`).
  - **Action**: Click `🎬 1. Simuler Trace 6-DoF` then `🤖 2. Exporter LeRobot v2.1 (.JSON)`.
  - **Verification**: Downloads the JSON dataset compatible with Hugging Face LeRobot v2.1.
