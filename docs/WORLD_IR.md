# WorldIR

## Purpose

WorldIR is the semantic representation of an interactive world.

A mesh knows geometry. WorldIR knows meaning.

## Example

```text
Battery B-17
semanticType: battery
capabilities: movable, inspectable, installable
state: inspected=false, installed=false
relationships: installTarget=Rover-01
constraints: inspection required before installation
```

## Structure

```text
WorldIR
├── entities
├── transforms
├── capabilities
├── states
├── zones
├── rules
├── objectives
├── relationships
├── constraints
└── contracts
```

## Enables
- deterministic runtime
- adapters
- validation
- tests
- simulation
- WorldDiff
- regression
- explainability

## Anti-goal
Do not design a universal 3D ontology. Implement only what the demo and judge robustness require.
