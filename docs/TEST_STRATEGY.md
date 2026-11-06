# TEST STRATEGY

## Objective

Keep the hackathon prototype fast to change while protecting the critical end-to-end demo.

Testing should be layered by cost.

---

## Unit

Schemas, validators, rule evaluation, state transitions, reference resolver, graph algorithms, edit-diff generation.

## Integration

- CommandPlan → transaction;
- WorldPatch → WorldIR;
- WorldPatch → scene;
- event → visible result;
- entity replacement → reference integrity;
- edit → provenance record;
- optional contract → witness/counterexample.

## Golden prompts

Maintain stable expectations only for critical flows.

Do not create a huge prompt benchmark during normal hackathon development.

## E2E critical path

1. load world;
2. create/edit;
3. program behavior;
4. apply patch;
5. run cheap checks;
6. test visible behavior;
7. optionally prove an invariant;
8. replay/fix if needed.

## Critical golden test

```text
GIVEN battery selected
AND wrong zone pointed

WHEN
"If I put this here, trigger a warning and reset it."

THEN
references resolve
AND valid rule compiles
AND Test Mode fires warning/reset
AND execution needs no LLM call
AND an edit provenance record is produced.
```

---

## Edit observability test

For every accepted meaningful edit, test when practical that:

```text
edit_id exists
before version exists
after version exists
instruction is recorded
patch is inspectable
touched entities/rules are derivable
cheap checks have a result
```

## Cross-layer consistency tests

Add cheap checks for failures such as:

```text
mesh moved but collider stale
entity removed but trigger remains
entity replaced but rule points to old id
interactive visual object lacks runtime capability
navigation/zone relation references deleted entity
```

These checks are valuable even if no research paper is ever written.

## Behavioral probes

Use small reusable probes where they are cheap and relevant:

```text
walk-to
open
activate
collide
enter-zone
pick-up
reach-objective
```

Do not replay all probes after every edit by default.

Prefer:

```text
important edit
or
suspicious change
or
pre-demo checkpoint
→ relevant bounded probes
```

## Regression promotion

Turn a bug into a permanent regression test when:

- it can break the demo;
- it has occurred more than once;
- it represents an important class;
- or the cost of rediscovery is high.
