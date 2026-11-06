# WORLD CI

## Purpose

World CI exists to keep WorldPilot reliable during rapid iterative authoring.

It is primarily an engineering safety net for the hackathon.

It may later provide evidence for research, but it must not become a heavy research pipeline that slows ordinary edits.

---

## Default edit loop

```text
world change
→ cheap affected checks
→ commit or reject
→ optional probes
```

## Cheap P1 checks

Run these whenever practical:

- invalid entity reference;
- missing capability;
- stale script/trigger binding;
- state required but never produced by any direct rule;
- permanently broken direct dependency;
- invalid zone/entity relationship;
- obvious dead rule;
- obvious rule cycle;
- broken runtime binding.

## Deeper verification

Run on demand, before important demo checkpoints, or when a failure suggests it is useful:

```text
reachability
invariants
behavioral probes
bounded simulation
counterexample search
regression replay
```

Do not automatically run a full behavioral suite after every edit unless measurements justify the cost.

---

## Example

```text
WORLD CI
Reference integrity        PASS
Runtime bindings           PASS
Cheap consistency          PASS

Optional behavioral probe:
Safety invariant           FAIL

Witness:
Start → Install → Diagnostics → Exit

NOT READY
```

## Failure evidence

Every meaningful failure should preserve enough evidence to reproduce it when practical:

```text
world version
edit id
check/probe
input state
actions
observed result
expected result
```

## Regression handling

```text
bug
→ preserve minimal evidence
→ fix
→ save regression test when valuable
```

Not every one-off bug must become a permanent regression test.

Promote a failure into the permanent suite when it is:

- important to the demo;
- likely to recur;
- representative of a broader failure class;
- costly to rediscover.

## Research-observation rule

If a bug appears to show a broader phenomenon, log it without blocking development.

Examples:

- a tiny local edit creates a distant behavioral side effect;
- an entity replacement leaves stale cross-layer references;
- edit order changes behavior;
- a visual success hides runtime inconsistency.

The engineering action remains:

```text
fix first
log evidence cheaply
continue
```
