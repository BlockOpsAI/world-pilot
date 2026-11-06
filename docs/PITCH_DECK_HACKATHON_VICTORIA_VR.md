---
marp: true
theme: default
paginate: true
backgroundColor: #0b0f19
color: #f8fafc
---

# 🎯 WorldPilot — Victoria VR Hackathon Pitch Deck & Live Demo Script (English)

> **Design Rule ("Reasonable Contrarian" Anti-Deck):**
> - **100% English** for the international Victoria VR Hackathon jury.
> - **Zero walls of text on slides:** Maximum **15–25 words per slide**, huge typography, paired with **real product screenshots + visual architecture diagrams**.
> - **Full talk track in Speaker Notes:** Every slide in [`WorldPilot_VictoriaVR_Hackathon_Deck.pptx`](./WorldPilot_VictoriaVR_Hackathon_Deck.pptx) includes the exact 15-second English voiceover in its PowerPoint Speaker Notes.

---

## 🖥️ PART 1: The 6 Visual Slides (90 Seconds Total)

---

### Slide 1 — Beyond Prompt #1
**Title:** WorldPilot — Compiling Plain Language into Verified 3D Logic  
**Visual:** Split-screen screenshot of the 3D Car Battery Workshop + Live `F2` Causal Debugger (`YAML` & `Flags`) + Visual Diagram (`Prompt #1 Meshes` vs `Prompt #2–#9 Logic Survival`).

- **Prompt #1 (Solved):** Generating 3D meshes.
- **Prompt #2 to #9 (Broken Today):** Editing scenes breaks prior rules and blocks quests.
- **10,000 Worlds:** Manual QA fails at scale — you need **World CI**.

> 🎙️ **Speaker Notes (15s):**  
> *"Everyone can generate a 3D scene on Prompt #1. Almost every AI tool breaks that scene's logic by Prompt #5—and none can manually QA 10,000 user-generated worlds. WorldPilot is the deterministic logic compiler and pre-publish Quality Gate for the AI Verse."*

---

### Slide 2 — Surgical `WorldPatch` vs. Destructive Regen
**Title:** Edit Without Breaking Prior Rules ($W_{AB} \equiv_\Omega W_{BA}$)  
**Visual:** Bar chart comparing `Naive Sequential Execution (43.0% State Equivalence / 64.5% Joint Satisfaction on EO-Bench N=200)` vs `WorldPilot C5 Defense + Local Repair (100% State Equivalence / 99.5% Joint Satisfaction)` + Live Screenshot of `Edit-Order Commutativity Lab`.

- **Semantic Lineage:** `car_battery ➔ generator` auto-rewires all existing rules.
- **Order-Independent ($N=200$):** **100%** state equivalence (**99.5%** joint satisfaction) vs **43.0%** (**64.5%** SAT) naive baseline.
- **Git Blame for 3D:** Every prompt is a versioned, reversible `WorldPatch` (`v1 ➔ v2`).

> 🎙️ **Speaker Notes (15s):**  
> *"Instead of regenerating a black box on every prompt, WorldPilot compiles atomic WorldPatches. Replace the battery with a generator, and every existing rule and invariant automatically rewires itself—achieving 100% state equivalence and 99.5% joint instruction satisfaction across our 200-case benchmark."*

---

### Slide 3 — 3D Blast Radius & `< 8.4 ms` Invariant-Guided Local Repair
**Title:** Catch & Heal Spatial Deadlocks Before Players Get Stuck  
**Visual:** Before/After visual comparison of the 3D Red Blast Radius Shockwave (`⚠️ COLLIDER_DEADLOCK`) $\to$ Surgical `0.85 m` Local Repair (`✅ Zero Unresolved Invariants`).

- **Detect:** Real-time 3D collision shockwave when an edit blocks a trigger zone.
- **Preserve Intent:** Never blindly revert the creator's prompt.
- **Auto-Heal:** Invariant-guided local repair shifts the obstacle by **0.85 m in `< 8.4 ms`**.

> 🎙️ **Speaker Notes (15s):**  
> *"When a creator moves the workbench right in front of the engine bay, WorldPilot immediately highlights the 3D Blast Radius and repairs the spatial deadlock in 8.4 milliseconds—saving both the creator's intent and quest playability."*

---

### Slide 4 — Zero Generated Code & Zero LLM in the Runtime Loop
**Title:** 60 FPS Deterministic Runtime — Safe for the Shared *AI Verse*  
**Visual:** Two-Stage Architecture Diagram (`Authoring Time: NL / VR Gesture ➔ WorldPatch Compiler` $\neq$ `Runtime: Local 60 FPS Engine, 0 ms LLM Latency, 0 eval()`).

- **No `eval()` Security Risks:** AI never generates executable C#/JS scripts.
- **0 ms Runtime Latency:** LLM compiles declarative `WorldIR` (`YAML`) at authoring time only.
- **No-Keyboard VR Authoring:** Grab & place in 3D $\to$ click **`[+ Freeze as Rule]`**.

> 🎙️ **Speaker Notes (15s):**  
> *"Calling an LLM on every player click adds 1.5 seconds of latency and arbitrary code execution risks. In WorldPilot, the LLM only compiles declarative YAML at authoring time; the runtime executes locally at 60 FPS with zero network latency."*

---

### Slide 5 — Scaling from 10 to 10,000 Worlds (`World CI` & Bayesian Mastery)
**Title:** Pre-Publish Quality Gate & Anti-Disposable Worlds ($E_1 \to E_2$)  
**Visual:** Live screenshot of `Spatial Lighthouse 100/100` (`14/14 Golden Worlds`) + Bayesian Mastery curve (`27% Lucky Guess Rejected` $\to$ `Auto-Generated Tractor World E2`).

- **Check (`Cmd+K` & `Cmd+Y`):** Bounded state-space invariant checker + **10x speed** autonomous playtester.
- **Audit (`Cmd+P`):** **100/100** *Spatial Lighthouse* across 14 reference worlds.
- **Measure (`F3`):** Bayesian Knowledge Tracing catches lucky guessing ($27\% < 85\%$) and spawns an isomorphic world ($E_2$).

> 🎙️ **Speaker Notes (15s):**  
> *"To scale from 10 worlds to 10,000 community worlds, WorldPilot runs an automated playtester and Spatial Lighthouse audit before publishing—and uses Bayesian telemetry to distinguish real skill mastery from lucky clicking."*

---

### Slide 6 — "3D Rendering Is Not the World" (`UnrealWorldAdapter`)
**Title:** Ready for Victoria VR's *VR AI Builder* + Live Demo  
**Visual:** Decoupled `WorldIR` hub diagram branching to `R3FWorldAdapter (Web Studio)`, `UnrealWorldAdapter (Victoria VR AI Builder)`, and `LeRobot v2.0 HDF5 (Physical AI)` + Screenshot of Export Panel.

- **`Logical Entity ≠ 3D Mesh`:** Truth lives in `WorldIR` (`YAML` / W3C `JSON-LD`).
- **Dual Engine:** Instant browser studio (`R3FWorldAdapter`) $\to$ AAA VR runtime (`UnrealWorldAdapter`).
- **Live Demo Now:** 8 prompts from a blank canvas (`vider`) to a verified world.

> 🎙️ **Speaker Notes (15s):**  
> *"Because WorldIR is strictly decoupled from rendering via WorldAdapter, the exact same world verified in our browser studio today can drive Unreal Engine in Victoria VR tomorrow. Let's switch to the live demo and try to break it in real time."*

---
---

## 🎬 PART 2: 3-Minute Live Demo Script (Split-Screen: 3D Scene + `F2` Monitor)

| Time | Action / Copy-Paste Prompt | What You Say to the Jury (English) |
| :---: | :--- | :--- |
| **0:00** | Press **`F2`**, then type:<br>`vider` | *"We start from a completely blank canvas: zero meshes, zero rules, zero hidden scripts."* |
| **0:20** | `Montrer comment changer une batterie dans une voiture`<br>*(Click the 12V Battery on the workbench)* | *"From one plain-language sentence, WorldPilot compiles the 3D workshop AND the live YAML causal graph on the right. Clicking the battery in 3D flips `battery_inspected` to `TRUE` in under 1 millisecond—zero LLM calls at runtime."* |
| **0:55** | `Personne ne doit terminer cette formation sans inspecter la batterie`<br>then:<br>`Essaie de casser cette expérience` | *"I add a safety invariant and ask WorldPilot to break my scene. Look at `F2 > Invariants`: it turns red (`⚠️ VIOLÉ`) and outputs the exact counterexample trace—a player can install the battery without inspecting it first."* |
| **1:25** | `Verrouille l'inspection de la batterie avant de terminer la formation` | *"One sentence locks the missing precondition onto the completion rule. The bounded invariant checker immediately turns green (`✅ VÉRIFIÉ`)."* |
| **1:45** | `Remplace la batterie par un générateur en gardant sa position`<br>*(Optional: `test ab ba`)* | *"In standard AI tools, deleting the battery destroys your logic. Here, WorldPilot swaps the 3D asset AND automatically rewires every rule and invariant to the generator via semantic lineage."* |
| **2:15** | `Déplace l'établi juste devant le compartiment moteur`<br>then:<br>`Corrige le conflit spatial sans annuler mon intention` | *"Now I make an authoring mistake: moving the workbench right in front of the engine bay. WorldPilot triggers a red 3D Blast Radius shockwave (`COLLIDER_DEADLOCK`) and heals it via invariant-guided local repair in 8.4 milliseconds."* |
| **2:45** | `certifie le monde` (`Cmd+P`) | *"Finally, before publishing to the Victoria VR AI Verse, one command runs our Spatial Lighthouse audit: 100/100 verified across all 14 reference worlds."* |

---
---

## 🛡️ PART 3: Jury Q&A Cheat-Sheet (English)

| Likely Jury Question | 20-Second "Reasonable Contrarian" Answer | 1-Click Live Proof |
| :--- | :--- | :--- |
| **1. "Your demo runs in WebGL/Three.js, but Victoria VR runs on Unreal Engine. How does this integrate?"** | *"That is our core architectural decision (`ADR-0001` & `ADR-0004`): **3D rendering is not the world**. All logic, physics, and invariants live in `WorldIR` (`YAML` / W3C `JSON-LD`) behind a strict `WorldAdapter` interface. WebGL gives creators a zero-install authoring & CI studio, and an `UnrealWorldAdapter` reads the exact same certified `WorldIR` inside Victoria VR."* | Open `F2 > 📄 YAML` or `F3 > 3. Robotique (LeRobot)` (`W3C JSON-LD`). |
| **2. "Nobody wants to type text prompts on a virtual keyboard inside a VR headset."** | *"We completely agree. That's why we built **In-Situ Spatial Demonstration Authoring**: in VR, you simply grab an object, place it in a zone, and click the floating 3D **`[+ Freeze as Rule]`** hologram—compiling a formal rule with zero typing."* | Drag the battery in `🎨 Conception` mode to show the 3D **`[+ Figer comme Règle]`** popup. |
| **3. "Why not let an LLM drive the runtime interactions directly?"** | *"Three production reasons: **latency** (1.5s per click breaks 90Hz VR presence), **security** (never `eval()` LLM-generated scripts in a multiplayer metaverse), and **API cost**. Our LLM compiles declarative `WorldPatches` at authoring time; the runtime is 100% local and deterministic at 60 FPS."* | Click any 3D object and show `< 1 ms` state transition in `F2`. |
| **4. "Why do this in 3D instead of a standard 2D web app?"** | *"Our rule is **Physics-over-Forms**: if removing 3D loses no information, 3D is a gimmick. We use 3D strictly for 1:1 volumetric proof (testing whether a 15.6" laptop + DSLR physically fit inside a 42L backpack) while keeping a cooperative 2D spec drawer for dense reading."* | Switch to **`🎒 Sac 42L (Compatibilité)`** and click **`📏 Tester Sac 42L + Reflex + PC 15.6"`**. |
