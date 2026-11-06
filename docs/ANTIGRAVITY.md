# ANTIGRAVITY — WORLDpilot WORKING RULES

This file defines the default behavior for Antigravity when working in this repository.

There is only **one operating mode**.

## Primary objective

Build the strongest possible WorldPilot hackathon prototype.

Every change should prefer:

1. working end-to-end behavior;
2. demo reliability;
3. understandable architecture;
4. deterministic runtime behavior;
5. useful edit observability;
6. low development friction.

Research is exploratory and must not block normal product development.

## Normal workflow

For a meaningful task:

```text
inspect
→ propose small implementation plan
→ implement
→ run relevant tests/checks
→ verify visible behavior
→ record provenance where practical
→ continue
```

Do not stop normal development to theorize about research.

## Research-aware engineering

When cheap and useful, preserve:

- edit id;
- world version before/after;
- user instruction;
- generated plan;
- patch;
- entities/rules touched;
- warnings;
- cheap consistency checks;
- optional bounded behavior probes.

If an interesting anomaly appears:

```text
fix the bug
+
preserve minimal evidence
+
continue development
```

Do not automatically redesign the architecture.

## Do not

- build a universal persistent-contract system just because it was previously discussed;
- implement a complete contract lifecycle unless the product requires it;
- implement heavy full-suite verification after every edit;
- create research-only complexity that does not improve WorldPilot;
- claim novelty from an isolated observation;
- turn every bug into a research idea;
- create multiple operational modes.

## Important documents

Read these as the current source of truth:

- `ARCHITECTURE.md`
- `WORLD_CI.md`
- `TEST_STRATEGY.md`
- `METRICS.md`
- `DEMO.md`
- `RESEARCH_NOTES.md`

Older research-first positioning should not override these documents.

## Research observation rule

Potentially interesting phenomena may be logged with one of:

```text
WATCH
RECURRING
KILL-SEARCH
PILOT-CANDIDATE
RESEARCH-CANDIDATE
DISMISSED
```

A paper topic is not frozen.

WorldPilot should help discover which research question is worth studying.
