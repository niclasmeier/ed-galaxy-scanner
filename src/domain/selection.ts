import type { Coords, SelectionBounds, SpaceSelectionStrategy, StarSystem } from "./types.js";
import { distance } from "../utils/distance.js";

// Default coordinate constants
export const SOL_COORDS: Coords = { x: 0, y: 0, z: 0 };
export const COLONIA_COORDS: Coords = { x: -9530.5, y: -910.28125, z: 19808.125 };

export interface SpaceSelectionResult {
  systems: StarSystem[];
  skippedMissingCoords: number;
  bounds?: SelectionBounds;
  cubeFrom?: StarSystem;
  cubeTo?: StarSystem;
  areaFrom?: StarSystem;
  areaTo?: StarSystem;
}

/**
 * Parse coordinate string in format "x/y/z" (e.g., "-9530.5/-910.28125/19808.125")
 * Whitespace around slashes is optional and trimmed
 */
export function parseCoordinateString(coordStr: string): { status: "parsed" | "invalid"; coords?: Coords } {
  const parts = coordStr.split("/").map((s) => s.trim());
  if (parts.length !== 3) {
    return { status: "invalid" };
  }
  const x = Number(parts[0]);
  const y = Number(parts[1]);
  const z = Number(parts[2]);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
    return { status: "invalid" };
  }
  return { status: "parsed", coords: { x, y, z } };
}

export function normalizeSystemName(name: string): string {
  return name.trim().toLowerCase();
}

export function buildNameIndex(systems: StarSystem[]): Map<string, StarSystem[]> {
  const index = new Map<string, StarSystem[]>();
  for (const system of systems) {
    if (!system.name) {
      continue;
    }
    const key = normalizeSystemName(system.name);
    const list = index.get(key);
    if (list) {
      list.push(system);
    } else {
      index.set(key, [system]);
    }
  }
  return index;
}

export function resolveSystemByName(
  index: Map<string, StarSystem[]>,
  name: string,
): { status: "resolved" | "not_found" | "ambiguous"; matches: StarSystem[] } {
  const key = normalizeSystemName(name);
  const matches = index.get(key) ?? [];
  if (matches.length === 0) {
    return { status: "not_found", matches };
  }
  if (matches.length > 1) {
    return { status: "ambiguous", matches };
  }
  return { status: "resolved", matches };
}

/**
 * Resolve an endpoint which can be either a system name or coordinate string
 * Returns either resolved coordinates or an error status
 */
export function resolveEndpoint(
  input: string,
  index: Map<string, StarSystem[]>,
  endpointType: string,
): { status: "resolved" | "not_found" | "ambiguous" | "invalid_coords"; coords?: Coords; system?: StarSystem } {
  // Try parsing as coordinate string first
  const coordResult = parseCoordinateString(input);
  if (coordResult.status === "parsed") {
    return { status: "resolved", coords: coordResult.coords };
  }

  // If not a coordinate string, try resolving as system name
  const nameResult = resolveSystemByName(index, input);
  if (nameResult.status === "not_found") {
    return { status: "not_found" };
  }
  if (nameResult.status === "ambiguous") {
    return { status: "ambiguous" };
  }

  const system = nameResult.matches[0];
  if (!system.coords || !hasValidCoords(system.coords)) {
    return { status: "invalid_coords" };
  }

  return { status: "resolved", coords: system.coords, system };
}

export function computeCubeBounds(from: Coords, to: Coords): SelectionBounds {
  const minX = Math.min(from.x, to.x);
  const minY = Math.min(from.y, to.y);
  const minZ = Math.min(from.z, to.z);
  const maxX = Math.max(from.x, to.x);
  const maxY = Math.max(from.y, to.y);
  const maxZ = Math.max(from.z, to.z);
  return { minX, minY, minZ, maxX, maxY, maxZ, source: "cube" };
}

export function computeAreaBounds(from: Coords, to: Coords): SelectionBounds {
  const minX = Math.min(from.x, to.x);
  const minY = Math.min(from.y, to.y);
  const maxX = Math.max(from.x, to.x);
  const maxY = Math.max(from.y, to.y);
  return {
    minX,
    minY,
    minZ: Number.NEGATIVE_INFINITY,
    maxX,
    maxY,
    maxZ: Number.POSITIVE_INFINITY,
    source: "area",
  };
}

function hasValidCoords(coords: Coords | null | undefined): coords is Coords {
  if (!coords) {
    return false;
  }
  return (
    Number.isFinite(coords.x) &&
    Number.isFinite(coords.y) &&
    Number.isFinite(coords.z)
  );
}

function filterSystemsByBounds(
  systems: StarSystem[],
  bounds: SelectionBounds,
): { systems: StarSystem[]; skippedMissingCoords: number } {
  const selected: StarSystem[] = [];
  let skippedMissingCoords = 0;

  for (const system of systems) {
    if (!hasValidCoords(system.coords)) {
      skippedMissingCoords += 1;
      continue;
    }
    if (
      system.coords.x < bounds.minX ||
      system.coords.x > bounds.maxX ||
      system.coords.y < bounds.minY ||
      system.coords.y > bounds.maxY ||
      system.coords.z < bounds.minZ ||
      system.coords.z > bounds.maxZ
    ) {
      continue;
    }
    selected.push(system);
  }

  return { systems: selected, skippedMissingCoords };
}

function filterSystemsBySphere(
  systems: StarSystem[],
  solCoords: Coords,
  maxDistSol: number,
): { systems: StarSystem[]; skippedMissingCoords: number } {
  const selected: StarSystem[] = [];
  let skippedMissingCoords = 0;

  for (const system of systems) {
    if (!hasValidCoords(system.coords)) {
      skippedMissingCoords += 1;
      continue;
    }
    if (distance(system.coords, solCoords) <= maxDistSol) {
      selected.push(system);
    }
  }

  return { systems: selected, skippedMissingCoords };
}

function filterSystemsByArea(
  systems: StarSystem[],
  bounds: SelectionBounds,
): { systems: StarSystem[]; skippedMissingCoords: number } {
  const selected: StarSystem[] = [];
  let skippedMissingCoords = 0;

  for (const system of systems) {
    if (!hasValidCoords(system.coords)) {
      skippedMissingCoords += 1;
      continue;
    }
    // Area selection: only check X and Y coordinates, ignore Z
    if (
      system.coords.x < bounds.minX ||
      system.coords.x > bounds.maxX ||
      system.coords.y < bounds.minY ||
      system.coords.y > bounds.maxY
    ) {
      continue;
    }
    selected.push(system);
  }

  return { systems: selected, skippedMissingCoords };
}

export function applySpaceSelection(
  systems: StarSystem[],
  strategy: SpaceSelectionStrategy,
  options: {
    solCoords?: Coords;
    cubeFromDefault?: string;
    cubeToDefault?: string;
    areaFromDefault?: string;
    areaToDefault?: string;
  } = {},
): SpaceSelectionResult {
  if (strategy.mode === "sphere") {
    if (!options.solCoords) {
      throw new Error("Missing Sol coordinates for spherical selection");
    }
    if (typeof strategy.maxDistSol !== "number") {
      throw new Error("Missing --max-dist-sol for spherical selection");
    }
    const { systems: selected, skippedMissingCoords } = filterSystemsBySphere(
      systems,
      options.solCoords,
      strategy.maxDistSol,
    );
    return {
      systems: selected,
      skippedMissingCoords,
      bounds: {
        minX: Number.NEGATIVE_INFINITY,
        minY: Number.NEGATIVE_INFINITY,
        minZ: Number.NEGATIVE_INFINITY,
        maxX: Number.POSITIVE_INFINITY,
        maxY: Number.POSITIVE_INFINITY,
        maxZ: Number.POSITIVE_INFINITY,
        source: "sphere",
      },
    };
  }

  const index = buildNameIndex(systems);

  if (strategy.mode === "cube") {
    // Use constants if no endpoints provided, otherwise resolve from input
    let cubeFromCoords: Coords;
    let cubeToCoords: Coords;
    let cubeFromSystem: StarSystem | undefined;
    let cubeToSystem: StarSystem | undefined;

    if (strategy.cubeFromName) {
      const fromResult = resolveEndpoint(strategy.cubeFromName, index, "cube-from");
      if (fromResult.status === "not_found") {
        throw new Error(`Cube endpoint not found: ${strategy.cubeFromName}`);
      }
      if (fromResult.status === "ambiguous") {
        throw new Error(`Cube endpoint is ambiguous: ${strategy.cubeFromName}`);
      }
      if (fromResult.status === "invalid_coords") {
        throw new Error(`Cube endpoint has invalid coordinates: ${strategy.cubeFromName}`);
      }
      cubeFromCoords = fromResult.coords!;
      cubeFromSystem = fromResult.system;
    } else {
      cubeFromCoords = options.cubeFromDefault ? 
        (parseCoordinateString(options.cubeFromDefault).coords ?? SOL_COORDS) : 
        SOL_COORDS;
    }

    if (strategy.cubeToName) {
      const toResult = resolveEndpoint(strategy.cubeToName, index, "cube-to");
      if (toResult.status === "not_found") {
        throw new Error(`Cube endpoint not found: ${strategy.cubeToName}`);
      }
      if (toResult.status === "ambiguous") {
        throw new Error(`Cube endpoint is ambiguous: ${strategy.cubeToName}`);
      }
      if (toResult.status === "invalid_coords") {
        throw new Error(`Cube endpoint has invalid coordinates: ${strategy.cubeToName}`);
      }
      cubeToCoords = toResult.coords!;
      cubeToSystem = toResult.system;
    } else {
      cubeToCoords = options.cubeToDefault ? 
        (parseCoordinateString(options.cubeToDefault).coords ?? COLONIA_COORDS) : 
        COLONIA_COORDS;
    }

    const bounds = computeCubeBounds(cubeFromCoords, cubeToCoords);
    const { systems: selected, skippedMissingCoords } = filterSystemsByBounds(systems, bounds);
    return {
      systems: selected,
      skippedMissingCoords,
      bounds,
      cubeFrom: cubeFromSystem,
      cubeTo: cubeToSystem,
    };
  }

  if (strategy.mode === "area") {
    // Use constants if no endpoints provided, otherwise resolve from input
    let areaFromCoords: Coords;
    let areaToCoords: Coords;
    let areaFromSystem: StarSystem | undefined;
    let areaToSystem: StarSystem | undefined;

    if (strategy.areaFromName) {
      const fromResult = resolveEndpoint(strategy.areaFromName, index, "area-from");
      if (fromResult.status === "not_found") {
        throw new Error(`Area endpoint not found: ${strategy.areaFromName}`);
      }
      if (fromResult.status === "ambiguous") {
        throw new Error(`Area endpoint is ambiguous: ${strategy.areaFromName}`);
      }
      if (fromResult.status === "invalid_coords") {
        throw new Error(`Area endpoint has invalid coordinates: ${strategy.areaFromName}`);
      }
      areaFromCoords = fromResult.coords!;
      areaFromSystem = fromResult.system;
    } else {
      areaFromCoords = options.areaFromDefault ? 
        (parseCoordinateString(options.areaFromDefault).coords ?? SOL_COORDS) : 
        SOL_COORDS;
    }

    if (strategy.areaToName) {
      const toResult = resolveEndpoint(strategy.areaToName, index, "area-to");
      if (toResult.status === "not_found") {
        throw new Error(`Area endpoint not found: ${strategy.areaToName}`);
      }
      if (toResult.status === "ambiguous") {
        throw new Error(`Area endpoint is ambiguous: ${strategy.areaToName}`);
      }
      if (toResult.status === "invalid_coords") {
        throw new Error(`Area endpoint has invalid coordinates: ${strategy.areaToName}`);
      }
      areaToCoords = toResult.coords!;
      areaToSystem = toResult.system;
    } else {
      areaToCoords = options.areaToDefault ? 
        (parseCoordinateString(options.areaToDefault).coords ?? COLONIA_COORDS) : 
        COLONIA_COORDS;
    }

    const bounds = computeAreaBounds(areaFromCoords, areaToCoords);
    const { systems: selected, skippedMissingCoords } = filterSystemsByArea(systems, bounds);
    return {
      systems: selected,
      skippedMissingCoords,
      bounds,
      areaFrom: areaFromSystem,
      areaTo: areaToSystem,
    };
  }

  throw new Error(`Unknown selection strategy: ${strategy.mode}`);
}
