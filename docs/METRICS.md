# METRICS

## Rule

Never publish an unmeasured number.

The hackathon product metrics come first.

Research-oriented metrics are exploratory until a controlled protocol is frozen.

---

## Compiler / authoring

- schema-valid first attempt;
- semantic-valid rate;
- repair rate;
- invalid references;
- median/P95 latency.

## Spatial

- contextual reference accuracy;
- ambiguity rejection;
- entity resolution failures.

## Runtime

- deterministic tests;
- cycle tests;
- undo/redo tests;
- runtime binding failures.

## World CI

- cheap checks executed;
- failures caught before commit;
- counterexamples found when deeper verification runs;
- regression pass rate for saved critical regressions.

## Edit observability

- edits with valid `edit_id`;
- edits with before/after snapshots;
- edits with provenance record;
- entities/rules touched per edit;
- consistency warnings per edit;
- behavioral probes executed per edit when applicable.

## Demo

- full-path success rate;
- console errors;
- load failures;
- failed edits;
- recovery time after failed edit.

## Experience

Only if genuinely measured:

- completion;
- time;
- discoverability;
- bypasses.

---

# Exploratory research signals

These are observation signals, not publication metrics yet.

## Behavioral blast radius

Possible proxies:

```text
edit size
vs
number of affected behaviors
vs
distance from edited entity
```

## Semantic identity instability

Possible events:

```text
RENAMED
REPLACED
REGENERATED
SPLIT
MERGED
ROLE_TRANSFERRED
```

## Cross-layer semantic drift

Count mismatches among:

```text
scene graph
geometry
physics
rules
triggers
navigation
runtime state
rendering
```

## Edit-order dependence

When explicitly tested:

```text
A(B(W)) != B(A(W))
```

## Observation status

Research observations may use:

```text
WATCH
RECURRING
KILL-SEARCH
PILOT-CANDIDATE
RESEARCH-CANDIDATE
DISMISSED
```

Do not promote an observation based on one occurrence.
