# Implementation Plan: Space Selection Strategies

**Branch**: `002-selection-strategies` | **Date**: 2026-01-29 | **Spec**: specs/002-selection-strategies/spec.md
**Input**: Feature specification from `/specs/002-selection-strategies/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Introduce space selection strategies for system filtering: retain the existing spherical selection around Sol by default; add a cube strategy (3D space, all coordinates); add an area strategy (2D rectangular, X-Y plane only); both bounded by two endpoints specified as system names or "x/y/z" coordinates; use constants for Sol (0/0/0) and Colonia (-9530.5/-910.28125/19808.125) as defaults when endpoints omitted (no system lookup); infer strategy when endpoints provided; use case-insensitive endpoint matching, deterministic filtering, and explicit error handling for ambiguous or missing endpoints.

## Technical Context

**Language/Version**: TypeScript 5.6 (Bun runtime)  
**Primary Dependencies**: Bun, commander  
**Storage**: Files (JSONL/JSON array inputs)  
**Testing**: bun test, tsc --noEmit  
**Target Platform**: CLI on macOS/Linux  
**Project Type**: Single CLI project  
**Performance Goals**: <= 2 seconds for 50k systems; warn when selection exceeds 200k systems  
**Constraints**: Deterministic ranking; non-interactive CLI; explicit stderr errors with non-zero exit codes for invalid inputs  
**Verbose Output**: When `--verbose` is enabled, strategy type and selection bounds MUST be logged to console  
**Coordinate Format**: Endpoints accept "x/y/z" format (e.g., "-9530.5/-910.28125/19808.125"); whitespace around slashes optional  
**Default Constants**: Sol = (0, 0, 0), Colonia = (-9530.5, -910.28125, 19808.125); used when endpoints omitted  
**Scale/Scope**: Typical inputs 50k systems; selection strategy applies before scoring and ranking

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Deterministic ranking rules defined with explicit tie-breakers.
- [x] Data provenance and validation steps documented.
- [x] CLI contract covers stdin/args, stdout, stderr, exit codes, JSON output.
- [x] Test strategy includes unit tests for scoring/distance/order and a golden test.
- [x] Performance bounds and input size assumptions stated.
- [x] TypeScript `any` type is not used; `unknown` or proper types used instead.

## Project Structure

### Documentation (this feature)

```text
specs/002-selection-strategies/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── cli/
│   └── index.ts
├── domain/
│   ├── scoring.ts
│   ├── settlement.ts
│   └── types.ts
├── io/
│   ├── jsonl.ts
│   └── output.ts
└── utils/
    └── distance.ts

tests/
├── integration/
│   ├── cli.golden.test.ts
│   └── fixtures/
└── unit/
    ├── distance.test.ts
    ├── scoring.test.ts
    └── settlement.test.ts
```

**Structure Decision**: Single CLI project with domain modules and tests under `tests/`.

## Phase 0: Outline & Research

### Research Tasks

- Confirm best practices for Commander CLI option design (strategy flags and default handling).
- Evaluate efficient case-insensitive endpoint matching for large datasets.
- Validate cube-bounds filtering order vs. existing distance/eligibility filtering.

### Output

- research.md with decisions and rationale.

## Phase 1: Design & Contracts

### Data Model

- Define entities for space selection strategy, endpoint match, and selection bounds.

### Contracts

- Provide JSON schema for selection strategy configuration and CLI options mapping.

### Quickstart

- Usage examples for spherical (default) and cube strategies.

### Agent Context Update

- Run `.specify/scripts/bash/update-agent-context.sh copilot` and ensure new tech is recorded.

### Constitution Check (Post-Design)

- [x] Deterministic ranking rules defined with explicit tie-breakers.
- [x] Data provenance and validation steps documented.
- [x] CLI contract covers stdin/args, stdout, stderr, exit codes, JSON output.
- [x] Test strategy includes unit tests for scoring/distance/order and a golden test.
- [x] Performance bounds and input size assumptions stated.

## Phase 2: Task Planning (not executed here)

- To be completed in `/speckit.tasks`.
