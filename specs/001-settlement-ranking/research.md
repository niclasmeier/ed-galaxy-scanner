# Phase 0 Research

## Decision 1: CLI argument parsing
- **Decision**: Use `commander` for CLI parsing and help output.
- **Rationale**: Strong TypeScript support, standard help/usage formatting, light footprint for a single-command CLI.
- **Alternatives considered**: `yargs` (heavier), `clipanion` (more complex command modeling), `cac` (lighter but fewer patterns).

## Decision 2: JSONL streaming approach
- **Decision**: Use Bun Web Streams (`Bun.file(path).stream()` / `Bun.stdin`) with a `TextDecoder` and rolling buffer to split on `\n`.
- **Rationale**: Keeps memory stable for large files, preserves backpressure, and avoids loading the full file.
- **Alternatives considered**: Node `readline` (slightly more overhead), `split2` (extra dependency), full-file load (not viable for 50k+ systems).

## Decision 3: Line-level JSON parsing
- **Decision**: Parse each line independently with `JSON.parse`, failing fast by default and including line numbers in errors; allow a `--continue-on-error` flag to skip invalid lines.
- **Rationale**: Matches JSONL semantics and provides clear, deterministic error reporting.
- **Alternatives considered**: Streaming JSON parser (overkill), silent skipping (violates data provenance requirement).

## Decision 4: Output formats
- **Decision**: Support `--format json` (default) and `--format text` outputs; always write results to stdout and errors to stderr.
- **Rationale**: Matches constitution requirements for JSON output and scripting friendliness.
- **Alternatives considered**: JSON-only output (less user-friendly), text-only (violates constitution).

## Decision 5: Testing strategy
- **Decision**: Use `bun test` with unit tests for scoring/distance/ordering and a golden integration test for CLI output on a fixed dataset.
- **Rationale**: Fast local tests, aligns with constitution requirements, ensures deterministic ranking.
- **Alternatives considered**: External test runners (unnecessary), manual verification (insufficient).

## Decision 6: Performance target interpretation
- **Decision**: Treat constitution performance bound (≤ 2 seconds for 50k systems) as the primary goal; document any deviations if observed.
- **Rationale**: Constitution supersedes spec, so plan must target the stricter bound.
- **Alternatives considered**: 10-second bound from spec (conflicts with constitution).
