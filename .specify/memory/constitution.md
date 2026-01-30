<!--
Sync Impact Report
- Version change: 1.0.0 → 1.0.1
- Modified principles: None
- Added sections: Core Principles, Technical Constraints, Development Workflow, Governance (initial)
- Removed sections: None
- Templates requiring updates:
	- .specify/templates/plan-template.md ✅ updated
	- .specify/templates/spec-template.md ✅ no change
	- .specify/templates/tasks-template.md ✅ updated
- Follow-up TODOs:
	- TODO(RATIFICATION_DATE): original adoption date unknown
-->
# Elite Dangerous Settlement Planner CLI Constitution

## Core Principles

### I. Deterministic Ranking & Reproducibility
The same inputs MUST always produce the same ordered list. Sorting MUST be stable
and tie-breakers MUST be explicitly defined. Any stochastic behavior is forbidden
unless a user-provided seed is required and echoed in outputs.
Rationale: settlement planning requires consistent, repeatable recommendations.

### II. Data Provenance & Validation
Input data sources (files, formats, versions) MUST be explicit in CLI arguments
or metadata. Coordinates, values, and settlement state MUST be validated with
clear error messages. Invalid records MUST be rejected, not silently ignored.
Rationale: trust in the ranking depends on verifiable data integrity.

### III. CLI Contract & Output Discipline
The tool MUST accept inputs via CLI args and/or stdin, write results to stdout,
and emit errors to stderr with non-zero exit codes. Output MUST support JSON and
a human-readable format, selectable by flag. No interactive prompts in normal
operation.
Rationale: enables scripting, piping, and automation in player workflows.

### IV. Test Discipline for Ranking Logic
Unit tests MUST cover scoring, distance filtering ($\le 15\,\text{LY}$), and
ordering rules. At least one golden test MUST validate end-to-end ranking on a
fixed sample dataset. Tests MUST be runnable via a single command.
Rationale: the algorithm is the product; regressions are unacceptable.

### V. Performance & Scale Bounds
The ranking pipeline MUST document expected input size and complexity. The
default path MUST complete within 2 seconds for 50k systems on a typical laptop.
If limits are exceeded, the CLI MUST warn and offer a reduced-scope option.
Rationale: command-line tools must remain responsive.

## Technical Constraints

- Implementation MUST be TypeScript targeting Bun (current stable).
- TypeScript `strict` mode MUST be enabled and linting enforced.
- The algorithm MUST enforce the rule: select the most valuable system that is
	within $\le 15\,\text{LY}$ of any previously settled system.
- Value scoring MUST be deterministic and documented in user-facing help.

## Development Workflow

- All changes MUST include updates to help text or docs if they alter CLI flags
	or output structure.
- Pull requests MUST pass lint, type-check, and all tests.
- Changes affecting ranking MUST include updated tests and rationale notes.
- Releases MUST use semantic versioning and include a concise changelog.

## Governance

- This constitution supersedes all project conventions and templates.
- Amendments require a documented rationale, version bump per SemVer, and a
	review for compliance impacts on templates and workflows.
- Every plan and spec MUST include a Constitution Check section verifying all
	core principles and constraints.
- Compliance is reviewed at PR time; any waiver MUST be documented with scope
	and expiration.

**Version**: 1.0.1 | **Ratified**: TODO(RATIFICATION_DATE): original adoption date unknown | **Last Amended**: 2026-01-29
