# WorldPilot

WorldPilot is a browser based editor for interactive 3D scenes. It combines natural language authoring, a Three.js/React Three Fiber viewport, physics interactions, and local tools for inspecting scene rules and testing selected interactions.

The project was built for the Victoria VR hackathon. The current repository is a prototype: test results, heuristics and local readiness checks should be described according to what they actually measure, not as platform certification or a formal proof.

## What is in the prototype

- Create and edit scene entities with text and voice instructions.
- Inspect world state and interaction rules.
- Run heuristic playtest scenarios and view their limitations.
- Review local scene readiness checks and export a report.
- Explore bundled GLB objects created directly by WorldPilot, alongside procedural Three.js models.
- Use the browser based 3D viewport and its WebXR entry point where supported.

## Architecture

```text
Prompt / voice
      ↓
Instruction parser and optional language model
      ↓
WorldIR and validated WorldPatch
      ↓
Three.js / React Three Fiber scene + Rapier physics
      ↓
Rule evaluation, heuristic playtesting, local diagnostics
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/ARCHITECTURE_OVERVIEW.md](docs/ARCHITECTURE_OVERVIEW.md), [docs/UPGRADES.md](docs/UPGRADES.md), and [docs/UPGRADE_3D.md](docs/UPGRADE_3D.md) for implementation context and recommendations. Asset information is recorded in [docs/ASSET_PROVENANCE.md](docs/ASSET_PROVENANCE.md).

## Hands-On Guides & Documentation

All project documentation is located in the [`docs/`](docs/) directory:
- **English**:
  - **[Step-by-Step Test Checklist (Short Hands-On)](docs/HANDSON_CHECKLIST_TEST_EN.md)**: Concise step-by-step walkthrough to reproduce the complete demo (Hands-On 1 to 8).
  - **[Complete Observability & Causality Guide (Detailed Hands-On)](docs/HANDSON_WORLDPILOT_OBSERVABILITY_EN.md)**: Comprehensive architectural guide detailing the 4 pillars, formal counter-examples, AB/BA commutativity, and Bayesian mutations.
- **Français**:
  - **[Checklist de Test Rapide (Hands-On Court)](docs/HANDSON_CHECKLIST_TEST.md)**: Déroulé pas-à-pas concis pour reproduire la démo complète (Hands-On 1 à 8).
  - **[Guide Complet d'Observabilité & Causalité (Hands-On Détaillé)](docs/HANDSON_WORLDPILOT_OBSERVABILITE.md)**: Guide exhaustif explicitant les 4 piliers d'architecture, les contre-exemples formels, la commutativité AB/BA et les mutations bayésiennes.
- **Hackathon Presentation**:
  - **[Victoria VR Hackathon Pitch Deck](docs/PITCH_DECK_HACKATHON_VICTORIA_VR.md)** (and PowerPoint presentation [docs/WorldPilot_VictoriaVR_Hackathon_Deck.pptx](docs/WorldPilot_VictoriaVR_Hackathon_Deck.pptx)).

## Run locally

Requirements: Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Build and verification commands are listed in `package.json`; run them from the project root when you need to verify a change.

## Scope and limits

The scene tests are bounded heuristics and do not replace testing by a person in the target browser or headset. Local readiness reports are not an official Victoria VR publication decision. Check dependency notices and review the assets actually included in any public build.
