# Implementation Plan: Bunx Execution Support

**Branch**: `005-bunx-execution` | **Date**: 2026-01-30 | **Spec**: specs/005-bunx-execution/spec.md
**Input**: Feature specification from `/specs/005-bunx-execution/spec.md`

## Summary

Enable bunx-based execution of the settlement planner CLI by adding Bun-compatible bin metadata, a Bun shebang, and executable permissions. Maintain existing CLI behavior while providing npm and GitHub execution paths.

## Technical Context

**Language/Version**: TypeScript 5.6 (Bun current stable)  
**Primary Dependencies**: Bun, commander  
**Storage**: N/A (file/stream input only)  
**Testing**: bun test, tsc --noEmit  
**Target Platform**: CLI on macOS/Linux/Windows (Bun installed)  
**Project Type**: Single CLI project  
**Performance Goals**: No additional overhead beyond current CLI execution  
**Constraints**: Non-interactive CLI; deterministic output; bunx as distribution mechanism only  
**Scale/Scope**: Same as current CLI usage (50k systems typical)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Deterministic ranking rules defined with explicit tie-breakers. (unchanged; no ranking changes)
- [x] Data provenance and validation steps documented. (unchanged)
- [x] CLI contract covers stdin/args, stdout, stderr, exit codes, JSON output. (unchanged; bunx preserves behavior)
- [x] Test strategy includes unit tests for scoring/distance/order and a golden test. (existing suite preserved)
- [x] Performance bounds and input size assumptions stated. (unchanged)
- [x] TypeScript `any` type is not used; `unknown` or proper types used instead. (unchanged)

## Project Structure

### Documentation (this feature)

```text
specs/005-bunx-execution/
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
│   ├── selection.ts
│   ├── settlement.ts
│   └── sorting.ts
├── io/
│   ├── jsonl.ts
│   └── output.ts
└── utils/
    ├── distance.ts
    └── quadrant.ts

tests/
├── integration/
├── unit/
└── fixtures/
```

**Structure Decision**: Single CLI project using existing `src/` and `tests/` layout.

## Phase 0: Outline & Research

### Research Tasks

- Confirm bunx bin expectations and Bun shebang support.
- Validate direct TypeScript execution via Bun for `bin` entry.
- Identify minimal package.json metadata required for bunx.

### Output

- research.md with decisions, rationale, and alternatives.

## Phase 1: Design & Contracts

### Data Model

- Define PackageMetadata and BinEntry fields required for bunx execution.

### Contracts

- JSON schema for package metadata (`bin`, `name`, `version`, `description`).

### Quickstart

- bunx usage examples and troubleshooting guidance.

### Agent Context Update

- Run `.specify/scripts/bash/update-agent-context.sh copilot` and record Bun/bunx usage notes if missing.

### Constitution Check (Post-Design)

- [x] Deterministic ranking rules defined with explicit tie-breakers.
- [x] Data provenance and validation steps documented.
- [x] CLI contract covers stdin/args, stdout, stderr, exit codes, JSON output.
- [x] Test strategy includes unit tests for scoring/distance/order and a golden test.
- [x] Performance bounds and input size assumptions stated.

## Phase 2: Task Planning (not executed here)

- To be completed in `/speckit.tasks`.

## Complexity Tracking

No constitution violations.
