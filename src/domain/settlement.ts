import type { Coords, SettlementCandidate, StarSystem } from "./types.js";
import { distance } from "../utils/distance.js";

export const CUBE_SIZE_LY = 50;

export interface CubeIndex {
  cubes: Map<string, StarSystem[]>;
  populatedCubeKeys: Set<string>;
}

export interface CandidateSearchOptions {
  maxDistSol?: number;
  solName?: string;
  sol?: StarSystem;
}

export interface EligibleCandidate {
  system: StarSystem;
  nearestPopulatedName: string;
}

export interface EligibleCandidatesResult {
  candidates: EligibleCandidate[];
  cubeIndex: CubeIndex;
}

export function toCubeCoord(value: number): number {
  return Math.floor(value / CUBE_SIZE_LY);
}

export function cubeKey(coords: Coords): string {
  return `${toCubeCoord(coords.x)},${toCubeCoord(coords.y)},${toCubeCoord(coords.z)}`;
}

export function parseCubeKey(key: string): [number, number, number] {
  const [x, y, z] = key.split(",").map((part) => Number(part));
  return [x, y, z];
}

export function buildCubeIndex(systems: StarSystem[]): CubeIndex {
  const cubes = new Map<string, StarSystem[]>();
  const populatedCubeKeys = new Set<string>();

  for (const system of systems) {
    const key = cubeKey(system.coords);
    const list = cubes.get(key);
    if (list) {
      list.push(system);
    } else {
      cubes.set(key, [system]);
    }
    if (system.population > 0) {
      populatedCubeKeys.add(key);
    }
  }

  return { cubes, populatedCubeKeys };
}

export function neighborCubeKeys(key: string): string[] {
  const [x, y, z] = parseCubeKey(key);
  const keys: string[] = [];
  for (let dx = -1; dx <= 1; dx += 1) {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dz = -1; dz <= 1; dz += 1) {
        keys.push(`${x + dx},${y + dy},${z + dz}`);
      }
    }
  }
  return keys;
}

export function warnIfLargeDataset(count: number, threshold = 200000): void {
  if (count > threshold) {
    console.error(
      `Warning: ${count} systems exceed the recommended limit (${threshold}). ` +
        "Consider reducing scope with --max-dist-sol.",
    );
  }
}

export function findEligibleCandidatesWithNearest(
  systems: StarSystem[],
  options: CandidateSearchOptions,
): EligibleCandidatesResult {
  const solName = options.solName ?? "Sol";
  const sol = options.sol ?? systems.find((system) => system.name === solName);
  if (!sol) {
    throw new Error(`Missing system for Sol lookup: ${solName}`);
  }

  const maxDistSol = options.maxDistSol;
  const filtered = typeof maxDistSol === "number"
    ? systems.filter((system) => distance(system.coords, sol.coords) <= maxDistSol)
    : systems;

  warnIfLargeDataset(filtered.length);

  const cubeIndex = buildCubeIndex(filtered);
  const { cubes } = cubeIndex;

  const populatedByCube = new Map<string, StarSystem[]>();
  for (const [key, list] of cubes.entries()) {
    const populated = list.filter((system) => system.population > 0);
    if (populated.length > 0) {
      populatedByCube.set(key, populated);
    }
  }

  const seen = new Set<number>();
  const candidates: EligibleCandidate[] = [];

  for (const system of filtered) {
    if (system.population > 0) {
      continue;
    }
    const planetCount = system.bodies.filter((body) => body.type.toLowerCase() === "planet").length;
    if (planetCount === 0) {
      continue;
    }

    const key = cubeKey(system.coords);
    const neighborKeys = neighborCubeKeys(key);
    let withinRange = false;
    let nearestName: string | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const neighborKey of neighborKeys) {
      const populatedSystems = populatedByCube.get(neighborKey);
      if (!populatedSystems) {
        continue;
      }
      for (const populated of populatedSystems) {
        const candidateDistance = distance(system.coords, populated.coords);
        if (candidateDistance <= 15) {
          withinRange = true;
          if (
            candidateDistance < nearestDistance ||
            (candidateDistance === nearestDistance &&
              populated.name.localeCompare(nearestName ?? populated.name) < 0)
          ) {
            nearestDistance = candidateDistance;
            nearestName = populated.name;
          }
        }
      }
    }

    if (withinRange && !seen.has(system.id64) && nearestName) {
      seen.add(system.id64);
      candidates.push({ system, nearestPopulatedName: nearestName });
    }
  }

  return { candidates, cubeIndex };
}

export function findEligibleCandidates(
  systems: StarSystem[],
  options: CandidateSearchOptions,
): StarSystem[] {
  return findEligibleCandidatesWithNearest(systems, options).candidates.map((candidate) => candidate.system);
}

export function sortCandidates(candidates: SettlementCandidate[]): SettlementCandidate[] {
  return [...candidates].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    return a.name.localeCompare(b.name);
  });
}
