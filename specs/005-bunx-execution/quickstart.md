---
title: "Quickstart: Bunx Execution"
---

# Quickstart: Using Settlement Planner via Bunx

## Prerequisites

- **Bun** installed ([https://bun.sh](https://bun.sh))
- **Galaxy data file** (e.g., `galaxy.json`)

## Installation

No installation needed! Just run:

```bash
bunx settlement-planner --help
```

This downloads and executes the latest published version from npm.

## Basic Usage

### Get help
```bash
bunx settlement-planner --help
```

### Rank settlements (default industrial scoring, 20 results)
```bash
bunx settlement-planner --input galaxy.json
```

### Output as JSON
```bash
bunx settlement-planner --input galaxy.json --format json
```

### Rank by tritium (mining focus)
```bash
bunx settlement-planner --input galaxy.json --scoring tritium --limit 20
```

### Sort by distance to Sol, then score
```bash
bunx settlement-planner --input galaxy.json --sort dsol-asc,score-desc
```

### Show only South-West and South-East quadrants with verbose output
```bash
bunx settlement-planner --input galaxy.json --use-quadrants SW,SE --verbose
```

### Select systems in a cube between Sol and Colonia
```bash
bunx settlement-planner --input galaxy.json \
  --selection-strategy cube \
  --cube-from "0/0/0" \
  --cube-to "-9530.5/-910.28125/19808.125"
```

### Pipe input from stdin
```bash
cat galaxy.json | bunx settlement-planner --format json | jq '.' | head -20
```

## Examples Combining Features

### Find the 50 best agriculture settlements in NW quadrant
```bash
bunx settlement-planner --input galaxy.json \
  --scoring agriculture \
  --use-quadrants NW \
  --limit 50 \
  --verbose
```

### Get tritium mining targets sorted by proximity within 5000 LY of Sol
```bash
bunx settlement-planner --input galaxy.json \
  --scoring tritium \
  --max-dist-sol 5000 \
  --sort dsol-asc \
  --format json
```

### Export settlement candidates in an area for further analysis
```bash
bunx settlement-planner --input galaxy.json \
  --selection-strategy area \
  --area-from "0/0/0" \
  --area-to "20000/-20000/25000" \
  --scoring industrial \
  --format json > settlements.json
```

## Testing with a Small Dataset

Download or use a sample galaxy data file, then:

```bash
bunx settlement-planner --input galaxy_small.json --verbose
```

This should complete in a few seconds and show progress and summary information.

## Troubleshooting

### "bunx: command not found"
Install Bun from [https://bun.sh](https://bun.sh):
```bash
curl https://bun.sh/install | bash
```

### "settlement-planner: command not found"
The package may not be published yet. Verify:
- Check npm registry: `npm info settlement-planner`
- Or run from source: `bun run src/cli/index.ts --help`

### "Permission denied" on entry point
Rarely, the entry point permissions may need to be reset. Run:
```bash
chmod +x $(npm list -g settlement-planner | grep settlement-planner | awk '{print $NF}')/src/cli/index.ts
```

## Using a Specific Version

To use a specific version of settlement-planner:

```bash
bunx settlement-planner@1.2.3 --input galaxy.json
```

To use the latest development version from GitHub (main branch):

```bash
bunx github.com/owner/settlement-planner@main --input galaxy.json
```

(Replace `owner` with the actual GitHub organization or username.)

## Performance Tips

- Use `--limit` to cap results if working with large datasets
- Use `--max-dist-sol` to reduce search scope
- Use quadrant filtering (`--use-quadrants`) for regional analysis
- Add `--verbose` to see progress on large files

## Next Steps

- See the full CLI documentation: `bunx settlement-planner --help`
- Explore scoring strategies: `bunx settlement-planner --help | grep -A5 scoring`
- Learn about selection strategies: `bunx settlement-planner --help | grep -A10 selection`
- Join the Elite Dangerous community and share your settlement rankings!

