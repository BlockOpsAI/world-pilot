# 🧭 WorldPilot Hands-On Guide: The "Reasonable Contrarian" Playbook for the Victoria VR Hackathon

> **Official Challenge of the Victoria VR Hackathon:**  
> *« Turn plain language into interactive 3D scenes and working logic. »*
>
> **⚡ Understand WorldPilot in 10 Seconds (The Key Analogy):**  
> - Conventional *Text-to-3D* tools (and Unreal Engine's *VR AI Builder*) generate **3D decor** (passive meshes).  
> - **WorldPilot is the logic compiler, non-regression firewall, and behavioral observatory** of these virtual worlds: it guarantees that when a creator iterates on their scene across multiple prompts (**Prompt #2, #3… #9**), **no existing rules are broken**, no moved objects block the quest, and every user action in 3D is understood and validated.

---

## 🏛️ The 4 Architectural Pillars (The "Reasonable Contrarian" Defense Before the Jury)

| Pillar | ❌ What 90% of Generative 3D Projects Do | ✅ WorldPilot's Production Architecture | Technical Reference |
| :--- | :--- | :--- | :--- |
| **1. Non-Destructive Editing (`WorldPatch`)** | Each new prompt overwrites the scene or silently breaks rules created 2 minutes earlier. | Compiles natural language into **versioned atomic operations (`WorldPatch`)** with invariant preservation ($W_{AB} \approx_\Omega W_{BA}$) and minimal Pareto repairs (`< 8.4 ms`). | `src/core/types.ts`, `src/research/editOrder/` |
| **2. Zero Generated Code & Zero LLM at Runtime** | The LLM generates arbitrary code (`eval`) or is invoked on every player click (1.5s latency + severe hallucination and security risk). | **The LLM never touches runtime execution.** It compiles a declarative graph (`WorldIR` / YAML), executed locally at **60 FPS offline** by a deterministic engine. | `0002-deterministic-runtime.md`, `0003-no-generated-code.md` |
| **3. Industrialization to 10,000 Worlds (`World CI`)** | Manually testing 10 scenes in VR is feasible; manually testing **10,000 user-generated worlds** is humanly impossible. | **Pre-Publish Quality Gate (`World CI`)**: formal graph verification (`Cmd+K`), autonomous *Adversarial Playtester* (`Cmd+Y`), and *Spatial Lighthouse* certification (`100/100`, `Cmd+P`). | `VICTORIA_FIT.md`, `0006-world-ci.md` |
| **4. Native Portability to Unreal Engine (`WorldAdapter`)** | Logical scene state is tightly coupled to WebGL/Three.js meshes (disposable and incompatible with Unreal Engine). | **« 3D Rendering is not the World » (`Logical Object ≠ 3D Mesh`)**: `WorldIR` (YAML / W3C WoT `JSON-LD`) is completely decoupled from rendering via `WorldAdapter` (WebGL today, Unreal Engine tomorrow). | `0001-worldir.md`, `0004-world-adapter.md`, `src/scene/R3FWorldAdapter.tsx` |

> **✨ Real-Time Visual Proof Center in WorldPilot (`F2 > 🏛️ 4 Pillars`):**
> When you open the **`⚡ Reactive Observability`** monitor (by pressing **`F2`** or clicking **`⚡ Observability & Causality`** in the bottom-right corner), a **Permanent 4-Proof Strip** and a dedicated **`🏛️ 4 Pillars`** tab showcase these differentiators with 1 click:
> - **Permanent Proof Strip at top of `F2`**:
>   - `⚡ 60 FPS • 0 eval() • 0 ms LLM`
>   - `🛡️ Invariants (1)` (green) $\to$ turns red `⚠️ Invariant VIOLATED` upon flaw $\to$ turns green `✅ Invariant VERIFIED` after lock
>   - `🧪 AB≈BA : 100% vs 16.7%`
>   - `🔌 WebGL ⇄ Unreal`
> - **Live Dynamic Banners in `F2`**:
>   - **Semantic Lineage Banner (`🔗 Semantic Lineage (WorldPatch)`)**: automatically appears when the battery is replaced with a generator (`12V Battery ➔ backup_generator...`, 100% Rules & Invariants rewired), with a direct **`AB/BA Proof`** button.
>   - **Blast Radius & Pareto Auto-Heal Banner**: displays the red alert **`💥 BLAST RADIUS (COLLIDER_DEADLOCK)`** with a 1-click **`✨ Auto-Heal`** button that turns green **`✅ PARETO AUTO-HEAL (< 8.4 ms)`** (`+0.85m`, 100% regression-free).
> - **AB/BA Permutation Commutativity Lab (`test ab ba` or `🧪 AB≈BA` button)**: visual modal comparing **C0 Naive LLM (`16.7%`) vs C2 Full Replan (`43.3%`) vs C5 WorldPilot (`100.0%`)**, 7-layer divergence vector `[0.00 ... 0.00]`, and **`▶ Launch AB / BA Test`** button.

---

## 🗺️ Hands-On Overview (8 Demonstrations)

Every demonstration follows a consistent **3-part structure**:
1. **❌ The Problem** *(what fails in 95% of today's generative 3D tools)*
2. **✅ WorldPilot's Solution** *(our systems engineering response)*
3. **🛠️ Step-by-Step Walkthrough** *(exact prompts to enter and what to observe on screen)*

| # | What You Will Demonstrate | Prompts Used (In the "Your intent" input) |
| :-: | :--- | :--- |
| **1** | **Blank Slate & Opening the Logic Hood (`3D ⇄ Logic` & `YAML`)** | `clear` $\to$ `Show how to change a car battery` + `F2` Panel |
| **2** | **Adding rules, detecting a flaw (`⚠️ VIOLATED`), and locking it (`✅ VERIFIED`)** | `Nobody should complete this training without inspecting the battery` $\to$ `Try to break this experience` $\to$ `Lock battery inspection...` |
| **3** | **Replacing an entity without breaking existing rules ($W_{AB} \approx_\Omega W_{BA}$)** | `Replace the battery with a generator while keeping its position` + `test ab ba` |
| **4** | **When a prompt causes a physical collision: Blast Radius & Auto-Healing (< 8.4 ms)** | `Move the workbench right in front of the engine compartment` $\to$ `Fix the spatial conflict without cancelling my intent` |
| **5** | **Creating a rule without a keyboard in VR: Emergent In-Situ 3D Gesture (`⚡ Physical impulse`)** | 3D mouse drag-and-drop + Holographic card (`✨ Promote to Active Rule`) |
| **6** | **Unmasking guessing vs true understanding: Bayesian Observatory & $E_1 \to E_2$ Loop** | `F3` (`🛰️ Observatory`) > Tab `1. Anti-Jetable (E1➔E2)` |
| **7** | **Industrializing QA to 10,000 Worlds: Synthetic Playtester (`Cmd+Y`) & Lighthouse (`Cmd+P`)** | `playtest` (`Cmd+Y`) + `certify the world` (`Cmd+P`) |
| **8** | **Why 3D instead of a 2D website? « Physics-over-Forms » & LeRobot Robotics** | Scene `🎒 Bag 42L` + `export lerobot` (`F3` > `3. Robotics (LeRobot)`) |

> ### ⏱️ "Jury Speedrun" Mode (2 Minutes Flat — The 8-Prompt Sequence)
> If you only have **2 minutes** to demonstrate WorldPilot's causal non-regression, open the **`F2`** panel (`⚡ Reactive Observability`) and sequentially enter these 8 prompts into the **`Your intent`** input (right sidebar `SPATIAL STUDIO` + `Enter`):
> 1. `clear` *(resets to blank canvas: 0 entities, 0 rules, 0 flags)*
> 2. `Show how to change a car battery` *(compiles 3D scene + causal rules + quest HUD + invariant)*
> 3. `Nobody should complete this training without inspecting the battery` *(adds formal never_state contract)*
> 4. `Try to break this experience` *(runs BFS counter-example search: red badge **`⚠️ Invariant VIOLATED`**)*
> 5. `Lock battery inspection before finishing the training` *(locks precondition: green badge **`✅ Invariant VERIFIED`**)*
> 6. `Replace the battery with a generator while keeping its position` *(replaces entity and **automatically rewires** existing rules)*
> 7. `Move the workbench right in front of the engine compartment` *(triggers red 3D shockwave and **`💥 BLAST RADIUS (COLLIDER_DEADLOCK)`**)*
> 8. `Fix the spatial conflict without cancelling my intent` *(Pareto solver in `< 8.4 ms` $\to$ **`✅ PARETO AUTO-HEAL (< 8.4 ms)`** at `+0.85m`)*

---

## 🧪 Hands-On #1: Blank Slate & Opening the Logic Hood (`Prompt #1` + `F2`)

### ❌ The Problem
In standard *Text-to-3D* generators, the scene is an opaque black box: either it is inert decor ("wax museum"), or its logic is buried in brittle, un-auditable scripts.

### ✅ WorldPilot's Solution
WorldPilot starts from a blank canvas and compiles your **Prompt #1** into a **formal causal graph (`WorldIR` serialized as clean YAML)**. The 3D scene and the **`⚡ Reactive Observability` (`F2`)** monitor are bidirectionally synchronized in real time (`3D ➔ Logic` and `Logic ➔ 3D`).

### 🛠️ Step-by-Step Walkthrough
1. **Open the Observability Monitor (`F2`):**
   - Press **`F2`** (or click the floating pill **`⚡ Observability & Causality`** in the bottom-right corner).
   - The **`⚡ Reactive Observability`** window opens with its green **`LIVE`** badge. Drag it by its header handle **`⠿`** to the right to leave the 3D scene unobstructed.
2. **Prove Clean Reset:**
   - Type `clear` (or `reset` or `vider`) into the **`Your intent`** input (right sidebar) and press `Enter`.
   - **What you observe:** The 3D scene is empty (`0 Entities`, `0 Rules`, `0 Flags` in `F2`).
3. **Execute Prompt #1 (Generate the mechanical workshop and its logic):**
   - In the **`Your intent`** input, enter and press `Enter`:
     ```text
     Show how to change a car battery
     ```
   - **What appears immediately:**
     - **In the 3D scene:** Blue sedan with open hood (`car_sedan_1`), workbench (`car_workbench`), 12V AGM battery (`car_battery_new`), and battery tray (`battery_tray_zone`).
     - **In the `F2` panel:**
       - Tab **`🚩 Flags`**: state flags `battery_inspected: FALSE`, `battery_installed: FALSE`, `car_running: FALSE` (red badges).
       - Tab **`⚡ Rules`**: cards for `rule_inspect_car_battery` (`INTERACT` trigger) and `rule_install_car_battery` (`DROP` trigger), with conditions and `⚡ Simuler l'exécution` button.
       - Tab **`🛡️ Invariants`**: invariant `INV_CAR_BATTERY_INSPECT_FIRST` with green `✔ CONFORME` badge.
       - Tab **`📄 YAML`**: live underlying substrate with `📋 Copy` and `💾 Export` buttons.
       - Bottom of `F2`: **`🎯 QUEST DEBUGGER: STEP 1/2`**, titled *« Inspect the new 12V battery »*, with the orange button **`⏭️ Force step validation (2/2)`**.
     - **In the left Quest HUD:** Procedure *« Remplacement de Batterie Automobile 12V »*, Step 1/2 with contextual action button.
4. **Demonstrate Bidirectional Synchronization `3D ⇄ Logic`:**
   - **Direction `3D ➔ Logic` (Trigger Action):**
     1. In the 3D viewport, click the **12V Battery** on the workbench: the contextual 3D card opens with the primary green action button at the top (e.g. **`🎯 Inspect the battery…`** or **`⚡ Inspect…`**) — you can also click the green button **`⚡ Launch action`** in the left Quest HUD.
     2. Click this button: Step 1 is immediately validated, the quest advances to **Step 2/2** (*« Install battery into engine bay »*), and a green target beacon lights up above the engine bay.
     3. Check **`F2 > 🚩 Flags`**: the flag **`battery_inspected`** switches instantly from **`FALSE`** (red) to **`TRUE`** (green).
   - **Direction `Logic ➔ 3D` (Live Toggle & Force Validation):**
     - In **`F2 > 🚩 Flags`**, every flag is an interactive switch (*Live Toggle*).
     - Click the green **`TRUE`** badge on `battery_inspected`: it flips to **`FALSE`** (red), manually invalidating the precondition without recompiling. Click it again to return to **`TRUE`**.
     - In **`F2 > ⚡ Rules`**, click **`⚡ Simuler l'exécution`** under `rule_inspect_car_battery`: this triggers the interaction, plays the chime audio, shows the diagnosis notification, and sets `battery_inspected = TRUE`.
     - In the **`🎯 QUEST DEBUGGER`** at the bottom of `F2`, click **`⏭️ Force step validation (2/2)`** to advance the quest without 3D manipulation.

---

## 🛡️ Hands-On #2: Prompt #2 to Prompt #4 — Add an Invariant, Detect a Flaw (`⚠️ VIOLATED`), and Lock it (`✅ VERIFIED`)

### ❌ The Problem
In existing generative AI tools, **everything breaks by the 2nd prompt**:
- Either Prompt #2 regenerates and erases the entire scene from Prompt #1;
- Or the author adds a rule that accidentally bypasses an earlier safety invariant (e.g. completing industrial training without verifying battery voltage), with zero warnings raised.

### ✅ WorldPilot's Solution
Each prompt applies an **atomic differential patch (`WorldPatch`)** without destroying existing state. The author can declare a **Formal Safety Invariant** in plain English (`🛡️ Invariants`), command WorldPilot to attack the scene to find flaws (**`⚠️ VIOLATED`**), and lock the rule by prompt to mathematically prove that the flaw is eliminated (**`✅ VERIFIED`**).

### 🛠️ Step-by-Step Walkthrough
1. **Prompt #2 — Add a formal non-regression contract (Invariant):**
   - In **`Your intent`**, enter and press `Enter`:
     ```text
     Nobody should complete this training without inspecting the battery
     ```
   - In **`F2 > 🛡️ Invariants`**:
     - The card for **`🛡️ INV_CAR_BATTERY_INSPECT_FIRST`** displays the green **`✔ CONFORME`** badge.
     - Condition: formal `never_state` rule forbidding `car_running = TRUE` if `battery_inspected = FALSE`.
2. **Prompt #3 — Order WorldPilot to attack the scene for flaws:**
   - In **`Your intent`**, enter and press `Enter`:
     ```text
     Try to break this experience
     ```
   - **What happens immediately:**
     1. In `F2`'s top proof strip, the invariant button turns red: **`⚠️ Invariant VIOLATED`**.
     2. In **`F2 > 🛡️ Invariants`**, the badge turns bright red: **`⚠️ VIOLATED`**.
     3. A red counter-example box appears inside the card:
        ```text
        🔍 Formal Counter-Example Found (Depth = 2):
        1. DROP(Battery ➔ Engine Bay)
        2. Reached state: car_running = TRUE while battery_inspected = FALSE.
        ```
3. **Prompt #4 — Repair the flaw by prompt and verify formal lock:**
   - In **`Your intent`**, enter and press `Enter`:
     ```text
     Lock battery inspection before finishing the training
     ```
   - **Real-time verification:**
     1. WorldPilot automatically injects the strict precondition `require_flag(battery_inspected == TRUE)` onto the final installation rule.
     2. In `F2`'s top bar and card, the badge switches to green: **`✅ Invariant VERIFIED`**.
     3. Emerald box confirms:
        ```text
        🔒 Formal Safety Proof (0 Counter-Examples):
        Precondition require_flag(battery_inspected == TRUE) locked on final rule.
        ```
     4. **Counter-Test**: Type `Try to break this experience` again + `Enter` — WorldPilot searches 3 event depths and confirms: *0 counter-examples found. 100% verified!*

---

## 🔄 Hands-On #3: Entity Replacement & Order Invariance ($W_{AB} \approx_\Omega W_{BA}$)

### ❌ The Problem
What happens when the author decides to replace an object — e.g. **replacing the battery with a generator**?  
In classical engines, deleting `car_battery_new` leaves all existing rules as **orphaned rules** pointing to a dangling reference ID.

### ✅ WorldPilot's Solution
The patch engine ([`worldSlice.ts`](file:///Users/b.delb/Documents/antigravity/worldpilot/src/engine/slices/worldSlice.ts) & [`validateWorldPatch`](file:///Users/b.delb/Documents/antigravity/worldpilot/src/engine/validator.ts)) intercepts entity replacements and **automatically rewires** all rules and quest steps onto the new entity, guaranteeing order commutativity ($W_{AB} \approx_\Omega W_{BA}$).

### 🛠️ Step-by-Step Walkthrough
1. **Prompt #5 — The Key Test: Replace battery with generator:**
   - In **`Your intent`**, enter and press `Enter`:
     ```text
     Replace the battery with a generator while keeping its position
     ```
   - **Immediate results on screen:**
     1. In 3D, the battery is replaced at the exact same coordinates by the generator.
     2. At the top of `F2`, the semantic lineage banner appears:
        **`🔗 Semantic Lineage (WorldPatch): 12V Battery ➔ backup_generator... (100% Rules & Invariants rewired)`**
        with a direct **`AB/BA Proof`** button.
     3. In **`F2 > ⚡ Rules`**, inspect the rules: their wiring now points to the new generator ID (`🔗 Wiring: Generator ➔ Battery tray`)! No orphaned rules.
2. **Scientific Proof in 2 Clicks — Open the AB/BA Permutation Lab ($W_{AB} \approx_\Omega W_{BA}$):**
   - In **`Your intent`**, type `test ab ba` + `Enter` (or click **`🧪 AB≈BA : 100% vs 16.7%`** in `F2`).
   - The **`Edit-Order Commutativity Lab`** modal opens.
   - **Step A (Conventional Engine Failure):** Click **`❌ Simuler C0 Naive (16.7%)`**. The lab executes both orders (`Prompt A then B` vs `Prompt B then A`) and displays red: **`❌ ORDER REGRESSION DETECTED (C0_NaiveSequential): W_AB ≠ W_BA`** (`16.7%` survival, divergence $D_\Omega > 0$).
   - **Step B (WorldPilot Guarantee):** Click **`✅ Simuler C5 WorldPilot (100%)`**. Verdict turns emerald green: **`✅ FORMAL COMMUTATIVITY PROVED (C5_DependencyAwareMinimalRepair): W_AB ≈_Ω W_BA (0.00 Divergence)`** (`100.0%`, divergence $D_\Omega = 0.000$, canonical state hash identical `86e1f070`).

---

## 💥 Hands-On #4: Spatial Collision, Blast Radius & Pareto Auto-Healing (< 8.4 ms)

### ❌ The Problem
During spatial editing, an author moves a workbench that accidentally obstructs the engine bay (*Spatial Deadlock*). No software exception is thrown, but the user is blocked from reaching the target area.

### ✅ WorldPilot's Solution
Whenever a prompt creates a geometric obstruction on an entity involved in a causal rule, WorldPilot:
1. Calculates the **Differential Impact Radius (*Blast Radius* $\Delta W$)** in **$< 8.4\text{ ms}$**;
2. Renders a **red 3D shockwave sphere** over the collision in the 3D viewport;
3. Resolves the collision via a **Pareto Minimal Repair Patch** that offsets the object to safety distance (`+0.85m`) **without cancelling the author's intent**.

### 🛠️ Step-by-Step Walkthrough
1. **Prompt #6 — Cause a spatial collision by prompt:**
   - In **`Your intent`**, enter and press `Enter`:
     ```text
     Move the workbench right in front of the engine compartment
     ```
   - **Immediate reactions:**
     - **In 3D:** The workbench shifts right in front of the engine bay, and a **pulsing red 3D shockwave sphere** materializes the obstruction.
     - **In `F2`:** The red alert banner turns on:
       > **`💥 BLAST RADIUS (COLLIDER_DEADLOCK): Workbench blocks access to engine compartment (0.85m).`**  
       > with an **`✨ Auto-Heal`** button.
2. **Prompt #7 — Auto-heal without cancelling intent:**
   - In **`Your intent`**, enter and press `Enter` (or click **`✨ Auto-Heal`** in `F2`):
     ```text
     Fix the spatial conflict without cancelling my intent
     ```
   - **Immediate resolution:**
     1. In `< 8.4 ms`, the workbench is surgically repositioned to `+0.85m` (it remains close to the car as intended, but clears the necessary passage).
     2. The banner switches to green:
        > **`✅ PARETO AUTO-HEAL (< 8.4 ms): Workbench shifted by +0.85m — 100% Regression-free.`**
     3. The red 3D shockwave sphere disappears instantly!

---

## 👆 Hands-On #5: In-Situ Gestural Rule (VR) — Emergent Observability

### ❌ The Problem
Inside a VR headset (*Victoria VR*), nobody wants to type on a virtual keyboard to code a rule. If a player spontaneously tests a physical gesture that the author hadn't scripted (e.g. bringing an object near a machine), nothing happens.

### ✅ WorldPilot's Solution
The **Inverse Intent Engine** continuously analyzes 3D hand/controller kinematics (3D Fitts' law, approach velocity, dwell time) and displays a holographic card **directly above the 3D objects**, allowing the user to promote this spontaneous gesture into a formal rule in 1 click.

### 🛠️ Step-by-Step Walkthrough
1. **Perform a Spontaneous 3D Gesture:**
   - In the 3D scene, drag the **Generator** towards the **Car** *(or click `✨ 3. Trace 3D Intent Arc` in `F3 > 2. Neuro-Symbolic`)*.
2. **Observe In-Situ Detection:**
   - A glowing 3D spline links both objects and a non-intrusive card appears above:
     > **`⚡ Physical impulse (87%) · 1 attempt`**
3. **Compile Gesture to Rule in 1 Click:**
   - Click **`✨ Promote to Active Rule`** on the 3D card above the car.
   - Open **`F2 > ⚡ Rules`**: the new causal rule has been compiled and added to `WorldIR` **without typing a single line of code**!

---

## 🧠 Hands-On #6: Bayesian Observatory & Adaptive $E_1 \to E_2$ Loop (`F3`)

### ❌ The Problem
A static generated world ($E_1$) is blind: a user clicking frantically at random completes the mission just like an expert who understood the physics.

### ✅ WorldPilot's Solution
In **`🛰️ Observatory` (`F3` > Tab `1. Anti-Jetable (E1➔E2)`)**, the Bayesian Meta-Controller computes real-time probabilities:
- **$P(H_1)$ — Trial & Error / Trap:** user acts by superficial guessing;
- **$P(H_2)$ — Causal Mastery:** user understands physical preconditions.  
Based on this diagnosis, WorldPilot **surgically mutates the 3D scene into an adapted experience ($E_2$)** without regenerating the world.

### 🛠️ Step-by-Step Walkthrough
1. Press **`F3`** (or click **`🛰️ Observatory`** in the top navbar) and select tab **`1. Anti-Jetable (E1➔E2)`**.
2. **Unmask Random Guessing ($H_1$):**
   - Click **`⚠️ 1. Simuler Piège H1`**.
   - Red gauge **`H1: Trial & Error`** rises and a persistent toast appears above "L'Anti-Générateur Jetable". In 3D, a yellow wireframe sphere marks the trap.
3. **Validate Analytic Expert ($H_2$):**
   - Click **`🎯 2. Simuler Maîtrise H2`**.
   - Green gauge **`H2: Causal Mastery`** jumps to **> 95%** and epistemic uncertainty drops.
4. **Mutate 3D Scene to Challenge $E_2$ (Skill Acquisition):**
   - Click **`⚡ 3. Muter la Scène 3D vers E2`**.
   - Close `F3` and inspect the 3D scene: without destroying the car, WorldPilot executes an adaptive mutation:
     1. A purple rotating beacon **`🔮 Balise de Transfert Invariant [Épreuve E2]`** appears next to the car;
     2. Autonomous avatar **`Ingénieure Nova`** joins Marc in the shop;
     3. The quest panel updates to **`Épreuve de Transfert Invariant (Step 1/1)`**.

---

## 🤖 Hands-On #7: Industrializing QA to 10,000 Worlds — Synthetic Playtester (`Cmd+Y`) & Lighthouse (`Cmd+P`)

### ❌ The Problem
If thousands of users build worlds with Victoria VR's AI Builder, humans cannot test them all. How can the platform prevent broken or unplayable worlds from entering the *AI Verse*?

### ✅ WorldPilot's Solution
Two automated quality gates:
1. **Synthetic Playtester (`Cmd+Y` or `playtest`):** 5 autonomous bots (`⚡ Speedrunner`, `🧭 Explorer`, `🧪 Playtester`, `🎓 Novice`, `🧠 Human Clone`) traverse the spatial and causal graph in milliseconds and suggest a **Minimal Patch** if blocked.
2. **Pre-Publish Gate "World Lighthouse" (`Cmd+P` or `certify the world`):** audits the scene against official Victoria VR parcel quotas (*Standard*, *Showroom*, *Arena*).

### 🛠️ Step-by-Step Walkthrough
1. **Run Synthetic Playtester (`playtest` or `Cmd+Y`):**
   - Type `playtest` + `Enter` in **`Your intent`**.
   - Modal **`Estimated Spatial Verification`** opens:
     - **`⚡ Speedrunner`**: validates estimated path (100% passable, 3 waypoints) and traces visible 3D trajectory;
     - **`🧭 Explorer`** / **`🧪 Playtester`**: explore branching paths;
     - **`🧠 Human Clone`**: replays **your own recorded hesitations** in the scene!
   - Click **`🛡️ Open Publish Readiness Gate`** to proceed to step 7.2.
2. **Certify World Before Publication (`certify the world` or `Cmd+P`):**
   - Type `certify the world` + `Enter` in **`Your intent`**.
   - Inspect the 3 parcel presets (**`Compact (10m × 10m)`**, **`Medium (20m × 20m)`**, **`Extended (40m × 40m)`**), readiness score out of 100, and click **`💾 Download Report`**.

---

## 🎒 Hands-On #8: Why 3D Instead of a 2D Website? « Physics-over-Forms » & LeRobot Robotics

### ❌ The Problem
1. **The Web 3D Gadget Trap:** Copying 2D product forms onto virtual 3D walls drives away 95% of users. 3D only matters if **1:1 physical geometry** replaces text forms.
2. **Wasted 3D Traces:** In traditional virtual environments, physical user interactions are discarded when the user disconnects.

### ✅ WorldPilot's Solution
1. **« Physics-over-Forms »:** Instead of reading `Dimensions: 38 × 26 × 3 cm`, the user physically slides the 15.6" laptop into the 3D 42L bag at 1:1 scale to verify fit.
2. **Robotic Data Foundry (Hugging Face LeRobot v2.1):** Every validated 3D gesture is exported as **6-DoF $\text{SE}(3)$** trajectories with causal reward $r_t$ and **ISO 11226 RULA ergonomic score** (measuring postural fatigue in VR).

### 🛠️ Step-by-Step Walkthrough
1. **Load Dedicated 42L Bag Scene (Prompt #8):**
   - Click **`🎬 Guided Tour`** in the top navbar and launch **`🎒 Mindel : Bag 42L`** (or type `Show the capacity of a 42L travel bag` in the right panel + `Enter`).
   - **What you observe:** Mechanical workshop clears. Scene switches to dark studio gallery with gold contrast (zero blinding glare). The central table features 4 comfortably spaced items (guaranteed 28 cm clearance between each to prevent overlapping): *Insulated Bottle*, *42L Nomad Bag*, *15.6" Laptop*, and *Large Box*. Left HUD displays *« Mindel: Volume & 3D Clearance Test »*.
2. **1:1 Physical Fit Test (« Physics-over-Forms ») & Inverse Intent Detection:**
   - Drag the **15.6" Laptop** towards the **42L Nomad Bag**: 1:1 volumetric insertion is verified by physics.
   - The Inverse Intent Engine detects the spontaneous gesture and displays the holographic card `⚡ Physical impulse (87%)` with `✨ Promote to Active Rule` and `✕ Ignore`.
3. **Export 3D Gestures into LeRobot v2.1 Dataset:**
   - In **`Your intent`**, enter and press `Enter`:
     ```text
     export lerobot
     ```
     *(or open **`F3` > Tab `3. Robotics (LeRobot)`**).*
   - Review the 3 key indicators: **MDP frames $(s_t, a_t, r_t)$**, **ISO RULA ergonomic score (`1.8 / 7.0 Optimal`)**, and spatial activity density.
   - Click **`🎬 1. Simuler Trace 6-DoF`** then **`🤖 2. Exporter LeRobot v2.1 (.JSON)`** to download the dataset ready for Vision-Language-Action (VLA) training.

---

## 🏁 Conclusion: What This Hands-On Proves (Conventional 3D Generator vs WorldPilot)

| Dimension | ❌ Conventional Text-to-3D Generator | ✅ WorldPilot (Control & Observability) |
| :--- | :--- | :--- |
| **Logic Transparency** | Black box (mute decor or opaque code) | Bidirectional causal graph `3D ⇄ Logic` & `WorldIR` YAML (`F2`) |
| **Iterative Editing (Prompt #2 to #9)** | Overwrites scene or silently breaks prior rules | Differential patch + **Formal Invariants** (`⚠️ VIOLATED` $\to$ `✅ VERIFIED`) |
| **Entity Replacement & Order** | Orphaned rules when entity is replaced ($W_{AB} \neq W_{BA}$) | **Automatic rule rewiring** & Proven equivalence ($W_{AB} \approx_\Omega W_{BA}$) |
| **Physical Collision on Prompt** | Silent spatial deadlock blocking quests | **Blast Radius** + Red 3D shockwave + **Pareto Auto-Heal (`< 8.4 ms`)** |
| **Spontaneous Gestures in VR** | Ignored (requires returning to keyboard) | **Inverse Intent Inference (`⚡ Physical impulse`)** promoted in 1 click |
| **User Assessment** | Cannot distinguish random clicking from understanding | **Bayesian Observatory ($H_1$ vs $H_2$)** & Adaptive Mutation **$E_1 \to E_2$** (`F3`) |
| **Industrial QA & Trace Value** | Manual testing impossible; gestures discarded | **AI Playtester (`Cmd+Y`)**, **Lighthouse (`Cmd+P`)** & **LeRobot v2.1 Export** |
| **Multi-Engine Portability** | Hardcoded to single WebGL renderer | **`WorldIR ≠ 3D Mesh`** : `R3FWebGLWorldAdapter` $\rightleftarrows$ `UnrealVictoriaVRWorldAdapter` (Z-Up `[cm]`) |

---

## 🧪 Run Automated Certification Tests

```bash
# Run the 4 Pillars & 9 Hands-On Prompts audit:
npm run test:pillars

# Run all 6 test suites + TypeScript strict build:
npm run verify
```
