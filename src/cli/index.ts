#!/usr/bin/env bun

import { Command } from "commander";
import { findEligibleCandidatesWithNearest, cubeKey, findReachableCubeKeysBySolDistance } from "../domain/settlement.js";
import { computeScore, shouldIncludeTritium, countIcyRings } from "../domain/scoring.js";
import { parseSortSpec, validateSortSpec, applySortSpec, DEFAULT_SORT_SPEC } from "../domain/sorting.js";
import { applySpaceSelection } from "../domain/selection.js";
import type { SpaceSelectionStrategy, StarSystem, ScoringStrategyName } from "../domain/types.js";
import { detectJsonArrayInput, readJsonArrayStream, readJsonLines } from "../io/jsonl.js";
import { formatCandidates, type OutputFormat } from "../io/output.js";
import { distanceToSol } from "../utils/distance.js";
import { isSystemInQuadrants, parseQuadrants, type QuadrantName } from "../utils/quadrant.js";

const program = new Command();

program
  .name("settlement-ranking")
  .description("Rank settlement candidate systems from galaxy data")
  .requiredOption("-i, --input <path>", "Input file path (supports .gz) or '-' for stdin")
  .option("--max-dist-sol <number>", "Max distance to Sol in LY", "1000")
  .option(
    "--selection-strategy <mode>",
    "Space selection strategy: sphere, cube, or area (defaults to cube when cube endpoints are provided, area when area endpoints are provided)",
    "sphere",
  )
  .option("--cube-from <name>", "Cube endpoint: system name or coordinates as x/y/z (default: Sol at 0/0/0)")
  .option("--cube-to <name>", "Cube endpoint: system name or coordinates as x/y/z (default: Colonia at -9530.5/-910.28125/19808.125)")
  .option("--area-from <name>", "Area endpoint: system name or coordinates as x/y/z (default: Sol at 0/0/0)")
  .option("--area-to <name>", "Area endpoint: system name or coordinates as x/y/z (default: Colonia at -9530.5/-910.28125/19808.125)")
  .option("--use-quadrants <quadrants>", "Filter by galactic quadrants: NW, NE, SW, SE (comma-separated), or 'all' (default: SW)")
  .option("--scoring <strategy>", "Scoring strategy: industrial (default), agriculture, or tritium", "industrial")
  .option("--sort <spec>", "Sort criteria: field-direction[,field-direction...]. Fields: score, dsol. Directions: asc, desc. Examples: score-desc, score-asc, dsol-asc, score-desc,dsol-asc (default: score-desc,dsol-asc)", "score-desc,dsol-asc")
  .option("--limit <number>", "Max number of results to return", "20")
  .option("--format <format>", "Output format: json, text, or simple", "simple")
  .option("--continue-on-error", "Skip invalid JSON lines and continue", true)
  .option("--verbose", "Enable verbose progress and summary output", false)
  .option("--colonization-mode <mode>", "Colonization eligibility mode: standard or none (default: standard)", "standard")
  .option("--require-sol-route", "Require systems to be in cubes with systems within 150 LY of Sol", false)
  .option("--native-json", "Use @nozbe/simdjson native bindings for JSON parsing (requires native bindings)", false)
  .addHelpText("after", "\nBunx usage: bunx settlement-planner [options]\n")
  .parse(process.argv);

const options = program.opts();

function parseMaxDistance(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--max-dist-sol must be a positive number");
  }
  return parsed;
}

function parseLimit(value: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("--limit must be a positive number");
  }
  return Math.floor(parsed);
}

function normalizeSystem(record: unknown): StarSystem | null {
  if (!record || typeof record !== "object") {
    return null;
  }
  const system = record as Partial<StarSystem> & {
    coords?: { x?: number; y?: number; z?: number } | null;
    bodies?: unknown;
    stations?: unknown;
  };
  if (typeof system.id64 !== "number") {
    return null;
  }
  if (typeof system.name !== "string" || system.name.length === 0) {
    return null;
  }
  if (!system.coords) {
    return null;
  }
  if (
    typeof system.coords.x !== "number" ||
    typeof system.coords.y !== "number" ||
    typeof system.coords.z !== "number"
  ) {
    return null;
  }

  const population = typeof system.population === "number" ? system.population : 0;
  const bodies = Array.isArray(system.bodies) ? system.bodies : [];
  const stations = Array.isArray(system.stations) ? system.stations : undefined;

  return {
    id64: system.id64,
    name: system.name,
    coords: { x: system.coords.x, y: system.coords.y, z: system.coords.z },
    population,
    bodies,
    bodyCount: typeof system.bodyCount === "number" ? system.bodyCount : undefined,
    allegiance: system.allegiance ?? undefined,
    stations,
  };
}

function isFleetCarrier(station: unknown): boolean {
  if (!station || typeof station !== "object") {
    return false;
  }
  const candidate = station as {
    type?: string;
    stationType?: string;
    name?: string;
    symbol?: string;
    subType?: string;
  };
  const parts = [candidate.type, candidate.stationType, candidate.name, candidate.symbol, candidate.subType]
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
  const combined = parts.join(" ");
  return (
    combined.includes("fleet carrier") ||
    combined.includes("fleetcarrier") ||
    combined.includes("drake-class carrier")
  );
}

function stripFleetCarriers(system: StarSystem): StarSystem {
  if (!Array.isArray(system.stations)) {
    return system;
  }
  const filtered = system.stations.filter((station) => !isFleetCarrier(station));
  if (filtered.length === system.stations.length) {
    return system;
  }
  return { ...system, stations: filtered };
}

interface ReadStats {
  brokenLines: number;
  readCount: number;
  skippedQuadrants: number;
  filteredNoIce: number;
  populatedCount: number;
  emptyCount: number;
}

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

interface ProcessRecordsContext {
  stats: ReadStats;
  quadrants?: Set<QuadrantName>;
  scoringStrategy?: ScoringStrategyName;
  continueOnError: boolean;
  writeLiveStats: () => void;
  reportRead: () => void;
  errorPrefix: string;
}

import type { ParsedRecord } from "../domain/types.js";

async function processRecords(
  records: AsyncIterable<ParsedRecord<StarSystem>>,
  ctx: ProcessRecordsContext,
): Promise<StarSystem[]> {
  const systems: StarSystem[] = [];
  for await (const record of records) {
    ctx.reportRead();
    const normalized = normalizeSystem(record.value);
    if (normalized) {
      if (ctx.quadrants && !isSystemInQuadrants(normalized.coords, ctx.quadrants)) {
        ctx.stats.skippedQuadrants += 1;
        ctx.writeLiveStats();
        continue;
      }
      if (ctx.scoringStrategy === "tritium" && !shouldIncludeTritium(normalized)) {
        ctx.stats.filteredNoIce += 1;
        ctx.writeLiveStats();
        continue;
      }
      if (normalized.population > 0) {
        ctx.stats.populatedCount += 1;
      } else {
        ctx.stats.emptyCount += 1;
      }
      ctx.writeLiveStats();
      systems.push(stripFleetCarriers(normalized));
    } else if (!ctx.continueOnError) {
      throw new Error(`Invalid system record ${ctx.errorPrefix} ${record.lineNumber ?? 0}`);
    } else {
      ctx.stats.brokenLines += 1;
      ctx.writeLiveStats();
      console.error(`Warning: invalid system record ${ctx.errorPrefix} ${record.lineNumber ?? 0}, skipping.`);
    }
  }
  return systems;
}

async function readSystems(
  input: string,
  continueOnError: boolean,
  verbose: boolean,
  quadrants?: Set<QuadrantName>,
  scoringStrategy?: ScoringStrategyName,
  nativeJson?: boolean,
): Promise<{ systems: StarSystem[]; stats: ReadStats }> {
  const stats: ReadStats = {
    brokenLines: 0,
    readCount: 0,
    skippedQuadrants: 0,
    filteredNoIce: 0,
    populatedCount: 0,
    emptyCount: 0,
  };
  let lastLineLength = 0;
  const writeLiveStats = (): void => {
    if (!verbose) {
      return;
    }
    const discardedOther = stats.filteredNoIce + stats.brokenLines;
    const line =
      `Reading systems=${formatCount(stats.readCount)} ` +
      `populated=${formatCount(stats.populatedCount)} ` +
      `discarded_quadrants=${formatCount(stats.skippedQuadrants)} ` +
      `discarded_other=${formatCount(discardedOther)}`;
    const padded = line.padEnd(lastLineLength, " ");
    process.stderr.write(`\r${padded}`);
    lastLineLength = Math.max(lastLineLength, line.length);
  };
  const reportRead = (): void => {
    stats.readCount += 1;
    writeLiveStats();
  };
  const onInvalid = (): void => {
    stats.brokenLines += 1;
    reportRead();
  };

  if (verbose) {
    writeLiveStats();
  }

  const ctx: ProcessRecordsContext = {
    stats,
    quadrants,
    scoringStrategy,
    continueOnError,
    writeLiveStats,
    reportRead,
    errorPrefix: "on line",
  };

  if (input === "-") {
    const systems = await processRecords(
      readJsonLines<StarSystem>(input, { continueOnError, onInvalid, nativeJson }),
      ctx,
    );
    return { systems, stats };
  }

  const file = Bun.file(input);
  if (!(await file.exists())) {
    throw new Error(`Input file not found: ${input}`);
  }

  const isArray = await detectJsonArrayInput(input);
  if (isArray) {
    ctx.errorPrefix = "in JSON array at index";
    const systems = await processRecords(
      readJsonArrayStream<StarSystem>(input, { continueOnError, onInvalid, nativeJson }),
      ctx,
    );
    return { systems, stats };
  }

  const systems = await processRecords(
    readJsonLines<StarSystem>(input, { continueOnError, onInvalid, nativeJson }),
    ctx,
  );
  return { systems, stats };
}

async function main(): Promise<void> {
  try {
    const input = String(options.input ?? "");
    if (!input) {
      throw new Error("Missing --input");
    }
    const selectionStrategyRaw = String(options.selectionStrategy ?? "sphere").toLowerCase();
    if (selectionStrategyRaw !== "sphere" && selectionStrategyRaw !== "cube" && selectionStrategyRaw !== "area") {
      throw new Error("--selection-strategy must be one of: sphere, cube, area");
    }
    const selectionStrategyProvided = program.rawArgs.includes("--selection-strategy");
    const cubeFromProvided = program.rawArgs.includes("--cube-from");
    const cubeToProvided = program.rawArgs.includes("--cube-to");
    const areaFromProvided = program.rawArgs.includes("--area-from");
    const areaToProvided = program.rawArgs.includes("--area-to");

    let selectionStrategyMode: SpaceSelectionStrategy["mode"] = selectionStrategyRaw as SpaceSelectionStrategy["mode"];

    if (!selectionStrategyProvided) {
      if (areaFromProvided || areaToProvided) {
        selectionStrategyMode = "area";
      } else if (cubeFromProvided || cubeToProvided) {
        selectionStrategyMode = "cube";
      }
    }

    const cubeFrom = typeof options.cubeFrom === "string" ? options.cubeFrom : undefined;
    const cubeTo = typeof options.cubeTo === "string" ? options.cubeTo : undefined;
    const areaFrom = typeof options.areaFrom === "string" ? options.areaFrom : undefined;
    const areaTo = typeof options.areaTo === "string" ? options.areaTo : undefined;

    if (selectionStrategyProvided && selectionStrategyMode === "sphere" && (cubeFrom || cubeTo || areaFrom || areaTo)) {
      throw new Error("Cube/area endpoints are not allowed when using sphere selection");
    }

    const maxDistSol = parseMaxDistance(String(options.maxDistSol ?? "1000"));
    const limit = parseLimit(String(options.limit ?? "20"));
    const format = String(options.format ?? "json").toLowerCase() as OutputFormat;
    if (format !== "json" && format !== "text" && format !== "simple") {
      throw new Error("--format must be one of: json, text, simple");
    }
    const colonizationMode = String(options.colonizationMode ?? "standard").toLowerCase();
    if (colonizationMode !== "standard" && colonizationMode !== "none") {
      throw new Error("--colonization-mode must be one of: standard, none");
    }
    const requireSolRoute = Boolean(options.requireSolRoute ?? false);
    const nativeJson = Boolean(options.nativeJson ?? false);

    const verbose = Boolean(options.verbose);
    
    // Parse and validate scoring strategy
    const scoringStrategyRaw = String(options.scoring ?? "industrial").toLowerCase();
    const validStrategies: ScoringStrategyName[] = ["industrial", "agriculture", "tritium"];
    if (!validStrategies.includes(scoringStrategyRaw as ScoringStrategyName)) {
      throw new Error(`Invalid scoring strategy: ${scoringStrategyRaw}. Must be one of: ${validStrategies.join(", ")}`);
    }
    const scoringStrategy = scoringStrategyRaw as ScoringStrategyName;
    
    // Parse and validate quadrants
    const useQuadrantsInput = typeof options.useQuadrants === "string" ? options.useQuadrants : "SW";
    const quadrants = parseQuadrants(useQuadrantsInput);
    if (!quadrants) {
      throw new Error(`Invalid quadrants: ${useQuadrantsInput}. Must be NW, NE, SW, SE (comma-separated) or 'all'`);
    }

    // Parse and validate sort spec
    const sortSpecInput = typeof options.sort === "string" ? options.sort : "score-desc,dsol-asc";
    let sortSpec;
    try {
      sortSpec = parseSortSpec(sortSpecInput);
      // Use default if empty
      if (sortSpec.length === 0) {
        sortSpec = DEFAULT_SORT_SPEC;
      }
      validateSortSpec(sortSpec);
    } catch (error) {
      throw new Error(`Invalid sort specification: ${error instanceof Error ? error.message : String(error)}`);
    }

    const { systems, stats } = await readSystems(input, Boolean(options.continueOnError), verbose, quadrants, scoringStrategy, nativeJson);
    let sol = systems.find((system) => system.name === "Sol");
    if (!sol) {
      sol = {coords: {x: 0.0, y: 0.0, z: 0.0}, id64: 10477373803, name: "Sol", population: 18320926115, bodies: []};
    }
    const selectionStrategy: SpaceSelectionStrategy = {
      mode: selectionStrategyMode,
      maxDistSol: selectionStrategyMode === "sphere" ? maxDistSol : undefined,
      cubeFromName: selectionStrategyMode === "cube" ? cubeFrom : undefined,
      cubeToName: selectionStrategyMode === "cube" ? cubeTo : undefined,
      areaFromName: selectionStrategyMode === "area" ? areaFrom : undefined,
      areaToName: selectionStrategyMode === "area" ? areaTo : undefined,
    };
    const selectionResult = applySpaceSelection(systems, selectionStrategy, {
      solCoords: sol.coords,
    });
    const scopedSystems = selectionResult.systems;

    const emptyCount = scopedSystems.filter((system) => system.population <= 0).length;
    const populatedCount = scopedSystems.length - emptyCount;

    // Get eligible candidates based on colonization mode
    let eligible;
    let routeScopedSystems = scopedSystems;

    if (requireSolRoute) {
      const reachableCubeKeys = findReachableCubeKeysBySolDistance(scopedSystems, sol.coords, 150);
      routeScopedSystems = scopedSystems.filter((system) => reachableCubeKeys.has(cubeKey(system.coords)));
    }

    if (colonizationMode === "none") {
      // Return all empty systems with planets, not limited by proximity to populated
      eligible = routeScopedSystems
        .filter((system) => system.population <= 0)
        .filter((system) => {
          const planetCount = (system.bodies ?? []).filter((body) => body.type.toLowerCase() === "planet").length;
          return planetCount > 0;
        })
        .map((system) => ({ system, nearestPopulatedName: "N/A" }));
    } else {
      // Default: standard mode - only 15 LY near populated systems
      const result = findEligibleCandidatesWithNearest(routeScopedSystems, {
        maxDistSol: selectionStrategyMode === "sphere" ? maxDistSol : undefined,
        solName: "Sol",
        sol,
      });
      eligible = result.candidates;
    }

    const cubeIndex = findEligibleCandidatesWithNearest(routeScopedSystems, {
      maxDistSol: selectionStrategyMode === "sphere" ? maxDistSol : undefined,
      solName: "Sol",
      sol,
    }).cubeIndex;
    const quadrantCount = cubeIndex.cubes.size;

    const candidates = eligible.map(({ system, nearestPopulatedName }) => {
      const score = computeScore(system, scoringStrategy);
      const bodies = system.bodies ?? [];
      const starsCount = bodies.filter((body) => body.type.toLowerCase() === "star").length;
      const bodyCount = typeof system.bodyCount === "number" ? system.bodyCount : bodies.length;
      const stationCount = Array.isArray(system.stations) ? system.stations.length : 0;
      const icyRings = countIcyRings(system);
      return {
        name: system.name,
        nearestPopulatedName,
        distanceToSol: distanceToSol(system, sol.coords),
        totalScore: score.total,
        scoreBreakdown: score.breakdown,
        starsCount,
        bodyCount,
        icyRings,
        stationCount,
      };
    });

    // Apply tritium filtering if tritium strategy is selected
    const filteredCandidates = scoringStrategy === "tritium" 
      ? candidates.filter((candidate) => candidate.icyRings > 0)
      : candidates;
    
    // Track filtering stats
    const filteredCount = scoringStrategy === "tritium" ? candidates.length - filteredCandidates.length : 0;

    const sorted = applySortSpec(filteredCandidates, sortSpec);
    const limited = sorted.slice(0, limit);
    if (verbose) {
      process.stderr.write("\n");
      let boundsStr = "";
      if (selectionResult.bounds) {
        if (selectionResult.bounds.source === "sphere") {
          boundsStr = `radius=${maxDistSol}LY`;
        } else if (selectionResult.bounds.source === "cube") {
          boundsStr = `X[${selectionResult.bounds.minX.toFixed(2)}, ${selectionResult.bounds.maxX.toFixed(2)}], Y[${selectionResult.bounds.minY.toFixed(2)}, ${selectionResult.bounds.maxY.toFixed(2)}], Z[${selectionResult.bounds.minZ.toFixed(2)}, ${selectionResult.bounds.maxZ.toFixed(2)}]`;
        } else if (selectionResult.bounds.source === "area") {
          boundsStr = `X[${selectionResult.bounds.minX.toFixed(2)}, ${selectionResult.bounds.maxX.toFixed(2)}], Y[${selectionResult.bounds.minY.toFixed(2)}, ${selectionResult.bounds.maxY.toFixed(2)}] (ignoring Z)`;
        }
      }
      let statsStr = 
        `Summary: strategy=${selectionStrategyMode}, bounds=${boundsStr}, ` +
        `scoring=${scoringStrategy}, ` +
        `broken lines=${stats.brokenLines}, ` +
        `skippedQuadrants=${stats.skippedQuadrants}, ` +
        `skippedCoords=${selectionResult.skippedMissingCoords}, ` +
        `empty=${emptyCount}, populated=${populatedCount}, ` +
        `quadrantCount=${quadrantCount}, results=${limited.length}`;
      if (scoringStrategy === "tritium") {
        statsStr += `, filtered_no_ice=${filteredCount}`;
      }
      statsStr += "\n";
      process.stderr.write(statsStr);
    }
    const output = formatCandidates(limited, format);
    process.stdout.write(output + (output.endsWith("\n") ? "" : "\n"));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exit(1);
  }
}

await main();
