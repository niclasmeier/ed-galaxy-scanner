# Quickstart

## Prerequisites
- Bun (current stable)

## Install
- `bun install`

## Run (JSON output)
- `bun run src/cli/index.ts --input galaxy.json --max-dist-sol 1000 --format json`

## Run (text output)
- `bun run src/cli/index.ts --input galaxy.json --max-dist-sol 1000 --format text`

## JSONL vs JSON array input
- JSONL (one system per line): `--input galaxy.jsonl`
- JSON array (single list of systems): `--input galaxy_small.json`

## Stdin usage
- `cat galaxy.jsonl | bun run src/cli/index.ts --input - --format json`

## Quadrant filtering
By default, the CLI filters to the South-West quadrant (SW) relative to Sagittarius A*. You can change this with `--use-quadrants`:

- All quadrants: `--use-quadrants all`
- Single quadrant: `--use-quadrants NE`
- Multiple quadrants: `--use-quadrants NW,SE`
- Valid quadrant names: NW (North-West), NE (North-East), SW (South-West), SE (South-East)

Example: Search across North-East and South-East quadrants:
```
bun run src/cli/index.ts --input galaxy.json --use-quadrants "NE,SE" --format json
```

Example: Search all quadrants with verbose output:
```
bun run src/cli/index.ts --input galaxy.json --use-quadrants "all" --verbose
```

## Scoring Strategies
The CLI supports three scoring strategies via the `--scoring` flag:

### Industrial Strategy (default)
Optimizes for valuable industrial development sites based on star types, planets, characteristics.
```
bun run src/cli/index.ts --input galaxy.json --scoring industrial --format json
```

### Agriculture Strategy (MVP)
Currently identical to industrial strategy. Placeholder for future agricultural-specific scoring.
```
bun run src/cli/index.ts --input galaxy.json --scoring agriculture --format json
```

### Tritium Strategy
Focuses on systems with icy rings for tritium extraction. Scores 5 points per regular icy ring, 10 points per pristine icy ring. Automatically filters out systems with no icy rings.
```
bun run src/cli/index.ts --input galaxy.json --scoring tritium --format json
```

**Note**: The tritium strategy filters systems during the read phase (not post-processing), so memory usage stays low for large datasets.

Example: Find tritium-rich systems with verbose stats:
```
bun run src/cli/index.ts --input galaxy.json --scoring tritium --verbose
```

## Tests
- `bun test`

## Output Contracts
- Input record schema: [specs/001-settlement-ranking/contracts/galaxy-system.schema.json](specs/001-settlement-ranking/contracts/galaxy-system.schema.json)
- Output record schema: [specs/001-settlement-ranking/contracts/settlement-candidate.schema.json](specs/001-settlement-ranking/contracts/settlement-candidate.schema.json)
