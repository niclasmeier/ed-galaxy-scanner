import type { Coords } from "../domain/types.js";

// Sagittarius A* - the galactic center
export const SAGITTARIUS_A: Coords = { x: 25.21875, y: -20.90625, z: 25899.96875 };

export type QuadrantName = "NW" | "NE" | "SW" | "SE";

/**
 * Determines which quadrant a system is in based on X and Y coordinates
 * relative to Sagittarius A* (Z coordinate is ignored)
 *
 * Quadrant boundaries (using Sagittarius A* as origin):
 * - NW (North-West): x < 25.21875 AND y > -20.90625
 * - NE (North-East): x > 25.21875 AND y > -20.90625
 * - SW (South-West): x < 25.21875 AND y < -20.90625
 * - SE (South-East): x > 25.21875 AND y < -20.90625
 */
export function getSystemQuadrant(coords: Coords | null | undefined): QuadrantName | null {
  if (!coords) {
    return null;
  }

  const isWest = coords.x < SAGITTARIUS_A.x;
  const isNorth = coords.y > SAGITTARIUS_A.y;

  if (isWest && isNorth) return "NW";
  if (!isWest && isNorth) return "NE";
  if (isWest && !isNorth) return "SW";
  return "SE";
}

/**
 * Parses a comma-separated list of quadrant names
 * Returns null if parsing fails, otherwise returns the set of valid quadrants
 */
export function parseQuadrants(input: string): Set<QuadrantName> | null {
  const trimmed = input.trim();

  if (trimmed.toLowerCase() === "all") {
    return new Set(["NW", "NE", "SW", "SE"]);
  }

  const quadrants = trimmed.split(",").map((q) => q.trim().toUpperCase());
  const validQuadrants = new Set<QuadrantName>();

  for (const q of quadrants) {
    if (q === "NW" || q === "NE" || q === "SW" || q === "SE") {
      validQuadrants.add(q as QuadrantName);
    } else {
      return null; // Invalid quadrant name
    }
  }

  return validQuadrants.size > 0 ? validQuadrants : null;
}

/**
 * Checks if a system is in one of the requested quadrants
 */
export function isSystemInQuadrants(coords: Coords | null | undefined, quadrants: Set<QuadrantName>): boolean {
  const systemQuadrant = getSystemQuadrant(coords);
  return systemQuadrant !== null && quadrants.has(systemQuadrant);
}
