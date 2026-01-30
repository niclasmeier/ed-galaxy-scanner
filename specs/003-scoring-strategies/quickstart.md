# Quickstart: Scoring Strategies

## Overview

The settlement ranking CLI supports multiple scoring strategies to rank systems based on different criteria.

## Available Strategies

- **industrial** (default): Score based on stars, planets, and planetary characteristics
- **agriculture**: Currently identical to industrial; reserved for future expansion
- **tritium**: Score based on icy rings for tritium extraction

## Basic Usage

### Industrial Strategy (Default)
```bash
bun run src/cli/index.ts --input galaxy.json --format json
# or explicitly:
bun run src/cli/index.ts --input galaxy.json --scoring industrial --format json
```

Results are ranked by industrial score (highest first).

### Agriculture Strategy
```bash
bun run src/cli/index.ts --input galaxy.json --scoring agriculture --format json
```

Currently produces identical results to industrial strategy.

### Tritium Strategy
```bash
bun run src/cli/index.ts --input galaxy.json --scoring tritium --format json
```

**Key differences**:
- Only systems with at least 1 icy ring are included
- Score is based on icy ring count:
  - Regular icy ring: 5 points
  - Pristine icy ring: 10 points
- Results ranked by tritium score (highest first)

## Examples

### Find top 20 tritium-rich systems
```bash
bun run src/cli/index.ts --input galaxy.json --scoring tritium --limit 20 --format json
```

### Industrial systems with verbose output
```bash
bun run src/cli/index.ts --input galaxy.json --scoring industrial --verbose
```

Output shows: `scoring=industrial` in summary

### Tritium systems with filtering statistics
```bash
bun run src/cli/index.ts --input galaxy.json --scoring tritium --verbose
```

Output shows:
- `scoring=tritium`
- `filtered_no_ice=12345` (systems excluded due to no icy rings)

### Combined with space selection
```bash
# Industrial scoring in a specific cube region
bun run src/cli/index.ts --input galaxy.json --scoring industrial \
  --cube-from "Sol" --cube-to "Colonia" --format json

# Tritium scoring with quadrant filtering
bun run src/cli/index.ts --input galaxy.json --scoring tritium \
  --use-quadrants "NW,NE" --format json
```

## Scoring Details

### Industrial Scoring
Points awarded for:
- Stars: 1 point per star
- Neutron stars: 30 points per neutron star
- Planets: 5 points per planet
- Gas giants: 10 points per gas giant
- Landable planets: 15 points per landable planet
- Water worlds: 8 points per water world
- Terraformable planets: 15 points per terraformable planet
- High metal content: 8 points per high metal content planet

### Tritium Scoring
Points awarded for:
- Regular icy ring: 5 points per ring
- Pristine icy ring: 10 points per ring

**Filtering**:
- Systems with 0 icy rings are excluded from results

## Help Text

For complete CLI options:
```bash
bun run src/cli/index.ts --help
```

## See Also

- [Specification](spec.md) - Full feature specification
- [Plan](plan.md) - Technical design details
- [Research](research.md) - Data format documentation
