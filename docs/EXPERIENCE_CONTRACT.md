# EXPERIENCE CONTRACT

## Role in WorldPilot

An Experience Contract is an optional product mechanism for expressing important properties of an interactive world.

It is useful when a creator wants WorldPilot to verify something that should remain true.

Example:

> Nobody should ever complete this training without inspecting the battery.

WorldPilot can convert this into a testable invariant.

Experience Contracts are **not** the mandatory organizing principle of every edit and are **not** currently the frozen research contribution.

Use them when they improve the product, demo, safety or explainability.

---

## Layers

### Correctness

Goals reachable; no impossible dependency.

### Usability

Next action discoverable; critical object perceivable.

### Effectiveness

Completion, time, discovery, learning/business outcome.

### Platform readiness

Input semantics portable; obvious device/performance guardrails.

## Example

```yaml
purpose: Train first-time rover technician

invariants:
  - trainingCompleted -> batteryInspected
  - airlockOpen -> diagnosticsCompleted

targets:
  completionRate: { min: 0.90 }
  completionSeconds: { max: 120 }

guardrails:
  safetyBypasses: { max: 0 }
```

## Evidence rule

Contracts are evaluated from execution evidence or deterministic checks, not from LLM opinion alone.

Possible outputs:

```text
PASS
FAIL
UNVERIFIED
```

A FAIL should ideally include a finite reproducible witness.

## Scope discipline

Do not build:

- a universal contract lifecycle;
- a complete dependency graph;
- selective revalidation infrastructure;

unless the product actually needs them.

If recurring failures later show that these mechanisms are valuable, they can be promoted deliberately.
