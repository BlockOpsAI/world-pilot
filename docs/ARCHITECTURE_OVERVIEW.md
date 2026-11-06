# ARCHITECTURE

## Product priority

WorldPilot is built first as a strong Victoria VR hackathon product.

Research observability is part of normal engineering, not a separate operating mode.

The architecture should therefore optimize for:

1. a reliable end-to-end authoring experience;
2. deterministic executable behavior;
3. clear provenance of edits;
4. cheap consistency checks;
5. enough structured evidence to investigate recurring phenomena later.

Do not add research-only infrastructure unless it also helps reliability, debugging, replay, explainability or the demo.

---

## Repository shape

```text
src/
├── core/
├── authoring/
├── engine/
├── scene/
├── simulation/
├── verification/
├── observability/
├── infrastructure/
├── ui/
└── app/
```

## core

WorldIR, EntitySpec, Capability, RuleSpec, WorldState, Objective, optional ExperienceContract, WorldPatch.

No React, Three.js or provider SDK.

## authoring

```text
natural language + spatial context + WorldIR
→ CommandPlan
→ WorldPatch
```

The authoring layer should prefer small, inspectable patches over opaque regeneration.

Each accepted edit gets an `edit_id`.

## engine

```text
Event → rules → conditions → actions → state
```

Deterministic where practical.

The executable runtime must not depend on an LLM for ordinary rule execution.

## scene

R3F/Three.js renderer, bindings, selection, raycast, drag/snap, zones.

## simulation

Use only as much simulation as the product currently needs:

- bounded graph search;
- small synthetic traces;
- behavioral probes;
- replay.

Advanced multi-agent simulation is not a prerequisite for the hackathon.

## verification

Verification is layered.

### Always-cheap checks

- invalid references;
- missing entities;
- invalid capability binding;
- stale trigger/script references;
- impossible direct dependency;
- obvious dead rule;
- broken scene/runtime binding.

### On-demand deeper checks

- reachability;
- invariants;
- behavioral regressions;
- counterexamples;
- replay.

Do not run expensive verification automatically after every edit unless measurements show it is necessary.

## observability

For each meaningful accepted edit, preserve when practical:

```text
edit_id
world_version_before
world_version_after
original_instruction
command_plan
patch
entities_created
entities_removed
entities_changed
rules_changed
warnings
cheap_check_results
optional_behavior_probe_results
```

Recommended artifact shape:

```text
artifacts/edits/E0007/
├── instruction.txt
├── plan.json
├── before.worldir.json
├── after.worldir.json
├── diff.json
└── checks.json
```

Optional fields may include:

- semantic lineage candidates;
- screenshots;
- replay traces;
- model/provider metadata;
- timing.

These records exist primarily for debugging, reproducibility and demo reliability.
They may later support research discovery.

## semantic lineage

When an entity is renamed, replaced, regenerated, split, merged or role-transferred, WorldPilot may record a candidate semantic lineage.

Example:

```text
door_17
→ REPLACED_BY
airlock_23
```

or:

```text
door_17
→ SPLIT_INTO
airlock_frame
airlock_controller
airlock_panels
```

A lineage record is an observation, not automatically a proof of semantic identity.

## WorldAdapter

```ts
interface WorldAdapter {
  readSpatialContext(): SpatialWorldContext;
  applyPatch(patch: WorldPatch): Promise<void>;
}
```

Hackathon adapter: `R3FWorldAdapter`.

## Core principles

### The renderer is not the world

`WorldIR` remains the semantic source of truth.

### Edits should be inspectable

Prefer:

```text
instruction
→ plan
→ patch
→ checks
→ commit
```

over full opaque regeneration.

### Observability is normal engineering

Do not switch into a separate research mode to collect evidence.

If an interesting anomaly appears:

```text
fix product bug
+
preserve evidence cheaply
+
continue building
```

Only recurring phenomena deserve later research review.
