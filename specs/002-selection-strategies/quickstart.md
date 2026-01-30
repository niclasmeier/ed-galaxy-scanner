# Quickstart: Space Selection Strategies

## Prerequisites

- Bun installed
- Input file in JSONL or JSON array format

## Default (Sphere) Strategy

```bash
bun run src/cli/index.ts --input /path/to/galaxy.json --max-dist-sol 1000
```

## Cube Strategy with Defaults (Sol → Sol)

```bash
bun run src/cli/index.ts --input /path/to/galaxy.json --selection-strategy cube
```

## Cube Strategy with Explicit Endpoints

```bash
bun run src/cli/index.ts --input /path/to/galaxy.json --selection-strategy cube --cube-from "Sol" --cube-to "Colonia"
```

## Notes

- Endpoint names are matched case-insensitively.
- `--max-dist-sol` is ignored when the cube strategy is selected.
- Providing `--cube-from` or `--cube-to` defaults the strategy to `cube`.
- `--cube-to` defaults to `Sol` when omitted.
- Providing both sphere and cube parameters results in a non-zero exit code.
