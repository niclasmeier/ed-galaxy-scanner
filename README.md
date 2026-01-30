# Settlement Planner CLI

A command-line tool for ranking Elite Dangerous settlement candidates based on galaxy data. Find the best systems for building settlements, whether you're seeking industrial strongholds, agricultural colonies, or tritium mining outposts.

## Quick Start

### Run via bunx (no installation required)

```bash
# From npm (after publication)
bunx settlement-planner --input galaxy.json

# From GitHub repository
bunx github:niclasmeier/ed-galaxy-scanner --input galaxy.json

# Show help
bunx settlement-planner --help
```

### Local usage (Bun)

```bash
bun run src/cli/index.ts --help
bun run src/cli/index.ts --input galaxy.json
```

## Features
The settlement planner creates a list oif the "best" systems for creating new colonies in the game Elite Dangerous: Odysee. It checks all systems that are with the 15LY limit for colonization and rates them system using a simple scoring algorith.

_Caveats:_ Sometime one gets false positives, due to
- Systems are used that have population that aren't an eligilbe starting point for Colonization (e.g. Colonia region). Since it needed to much in depth logic, this is not part of this project. So you'll have to use something like the inara.cz website.
- When the galaxy file is old, maybe someone snatched a good opporttunity from you.

### Preparation

Download a file from the [Spansh data dumps](https://spansh.co.uk/dumps). Generally one could assume that the more days the better, making the `galaxy.json.gz` the best file, but 93.8GB is a lot and takes a while to download. Maybe you want to to stick to a day or a week.


### 🎯 Simple Usage: Find Best Systems Near Sol

Find the top 20 settlement candidates within 1000 LY of Sol:

```bash
bunx settlement-planner --input galaxy.json
```

Limit to systems within 500 LY of Sol:

```bash
bunx settlement-planner --input galaxy.json --max-dist-sol 500
```

Get the top 10 results:

```bash
bunx settlement-planner --input galaxy.json --limit 10
```

### 🗺️ Complex Area Selection: Between Sol and Colonia

Instead of searching in a sphere around Sol, define specific regions using **cube** or **area** strategies:

**Cube Strategy** (3D rectangular region):
```bash
# Default: cube from Sol to Colonia
bunx settlement-planner --input galaxy.json --selection-strategy cube

# Custom cube endpoints
bunx settlement-planner --input galaxy.json \
  --cube-from Sol --cube-to "Sagittarius A*"

# Using coordinates
bunx settlement-planner --input galaxy.json \
  --cube-from "0/0/0" --cube-to "-9530.5/-910.28125/19808.125"
```

**Area Strategy** (2D galactic plane region, ignoring Z coordinate):
```bash
# Default: area from Sol to Colonia (X-Y plane only)
bunx settlement-planner --input galaxy.json --selection-strategy area

# Custom area endpoints
bunx settlement-planner --input galaxy.json \
  --area-from Sol --area-to "Beagle Point"
```

### 📊 Scoring Strategies: Different Goals for Different Playstyles

Choose a scoring strategy based on your settlement goals:

**Industrial** (default) - Build a strong, diversified economy:
```bash
bunx settlement-planner --input galaxy.json --scoring industrial
```
- Scores based on star types, planet diversity, water worlds, gas giants
- Best for self-sufficient industrial outposts

**Agriculture** - Focus on habitable worlds (currently uses industrial scoring):
```bash
bunx settlement-planner --input galaxy.json --scoring agriculture
```
- Emphasizes Earth-like and terraformable planets
- Future-ready for agricultural colony specialization

**Tritium** - Find "gas stations" for long journeys:
```bash
bunx settlement-planner --input galaxy.json --scoring tritium
```
- Scores systems with icy rings (5 pts regular, 10 pts pristine)
- Perfect for finding fuel sources along exploration routes
- Automatically filters out systems without icy rings

### 🧭 Quadrant Filtering: Focus on Specific Galactic Regions

Filting systems by galactic quadrants (relative to Sagittarius A*) is always active and defaults to SW. Most action is in/around the Bubble. But one can fine tune it:

```bash
# Southwest quadrant only (default, includes Sol and Colonia)
bunx settlement-planner --input galaxy.json --use-quadrants SW

# Multiple quadrants
bunx settlement-planner --input galaxy.json --use-quadrants NW,NE,SW

# All quadrants
bunx settlement-planner --input galaxy.json --use-quadrants all
```

Quadrants:
- **NW** (North-West): X < Sgr A*, Y > Sgr A*
- **NE** (North-East): X > Sgr A*, Y > Sgr A*
- **SW** (South-West): X < Sgr A*, Y < Sgr A* (includes Sol and Colonia)
- **SE** (South-East): X > Sgr A*, Y < Sgr A*

### 🔧 Advanced Options

**Sorting**:
```bash
# Sort by score descending, then distance to Sol ascending (default)
bunx settlement-planner --input galaxy.json --sort score-desc,dsol-asc

# Sort by distance to Sol only
bunx settlement-planner --input galaxy.json --sort dsol-asc
```

**Output formats**:
```bash
# JSON (default, machine-readable)
bunx settlement-planner --input galaxy.json --format json

# Text (human-readable table)
bunx settlement-planner --input galaxy.json --format text

# Simple (compact markdown table)
bunx settlement-planner --input galaxy.json --format simple
```

**Verbose mode** (progress indicators and statistics):
```bash
bunx settlement-planner --input galaxy.json --verbose
```

**Piping** (read from stdin, write to stdout):
```bash
cat galaxy.json | bunx settlement-planner --input - > results.json
```

### 💡 Example Workflows

**Find tritium sources between Sol and Colonia**:
_Hint:_ the `--area-from`/`--area-from` defaults to Sol and `--area-to`/`--area-to` to Colonia, because it is often time the area of interest.
```bash
bunx settlement-planner --input galaxy.json \
  --selection-strategy cube \
  --scoring tritium \
  --verbose \
  --format text
```

**Find top 5 industrial systems within 200 LY of Sol in the SW quadrant**:
```bash
bunx settlement-planner --input galaxy.json \
  --max-dist-sol 200 \
  --use-quadrants SW \
  --scoring industrial \
  --limit 5 \
  --format simple
```

**Explore agricultural potential near Sagittarius A***:
```bash
bunx settlement-planner --input galaxy.json \
  --area-from "0/0/0" \
  --area-to "Sagittarius A*" \
  --scoring agriculture \
  --sort score-desc
```

## Installation Methods

### Using bunx (recommended)

- **bunx**: Zero-install execution for one-off runs or CI
- **Local**: Faster iteration when developing locally
- Bun is required to run the CLI. Install from https://bun.sh

### Publishing to npm

This tool is designed to be published to npm for easy distribution. See the Release Process section below.

## Troubleshooting

- **Command not found: bunx** → Install Bun from https://bun.sh
- **Permission denied** → Run `chmod +x src/cli/index.ts`
- **Invalid strategy** → Check spelling of `--scoring` or `--selection-strategy` values
- **No results** → Try increasing `--max-dist-sol` or changing `--use-quadrants`

## Release Process

1. Bump version in `package.json` following SemVer.
2. Create a GitHub release tag (e.g., `v0.1.1`).
3. Ensure `NPM_TOKEN` is set in repository secrets for the publish workflow.
4. The publish workflow runs `bun test` and publishes to npm.

## Requirements

- **Bun**: Required runtime (https://bun.sh)
- **Galaxy data**: JSONL format with system information (name, coords, bodies, stations)

## Contributing

This project uses a specification-driven development approach. See the `specs/` directory for detailed feature specifications and plans.
