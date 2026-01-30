import type { Body, ScoreBreakdown, StarSystem, ScoringStrategyName } from "./types.js";

export interface ScoreResult {
  total: number;
  breakdown: ScoreBreakdown;
}

// ===== Helper functions =====

const POINTS = {
  star: 1,
  neutronStar: 2,
  planet: 5,
  gasGiant: 4,
  landable: 7,
  waterWorld: 8,
  terraformable: 9,
  highMetalContent: 10,
};

function isStar(body: Body): boolean {
  return body.type.toLowerCase() === "star";
}

function isPlanet(body: Body): boolean {
  return body.type.toLowerCase() === "planet";
}

function subTypeIncludes(body: Body, text: string): boolean {
  return body.subType?.toLowerCase().includes(text) ?? false;
}

function isTerraformable(body: Body): boolean {
  return body.terraformingState?.toLowerCase().includes("terraformable") ?? false;
}

/**
 * Gets the ring class/type from a ring, checking both ringClass and type attributes.
 * ringClass is preferred, but falls back to type if ringClass is not available.
 *
 * @param ring - The ring object to check
 * @returns The ring class/type value, or undefined if neither attribute exists
 */
function getRingClassType(ring: any): string | undefined {
  return ring.ringClass ?? ring.type;
}

// ===== Scoring Functions =====

/**
 * Industrial scoring strategy - uses the current algorithm based on star types and planet characteristics.
 * This is the default strategy and maintains backward compatibility with the existing scoring system.
 *
 * @param system - The star system to score
 * @returns A scoring result with total points and breakdown by category
 */
export function computeIndustrialScore(system: StarSystem): ScoreResult {
  const breakdown: ScoreBreakdown = {
    stars: { count: 0, points: 0 },
    neutronStars: { count: 0, points: 0 },
    planets: { count: 0, points: 0 },
    gasGiants: { count: 0, points: 0 },
    landable: { count: 0, points: 0 },
    waterWorlds: { count: 0, points: 0 },
    terraformable: { count: 0, points: 0 },
    highMetalContent: { count: 0, points: 0 },
  };

  for (const body of system.bodies) {
    if (isStar(body)) {
      breakdown.stars.count += 1;
      breakdown.stars.points += POINTS.star;

      if (subTypeIncludes(body, "neutron")) {
        breakdown.neutronStars.count += 1;
        breakdown.neutronStars.points += POINTS.neutronStar;
      }
    }

    if (isPlanet(body)) {
      breakdown.planets.count += 1;
      breakdown.planets.points += POINTS.planet;

      if (subTypeIncludes(body, "gas giant")) {
        breakdown.gasGiants.count += 1;
        breakdown.gasGiants.points += POINTS.gasGiant;
      }

      if (body.isLandable) {
        breakdown.landable.count += 1;
        breakdown.landable.points += POINTS.landable;
      }

      if (subTypeIncludes(body, "water world")) {
        breakdown.waterWorlds.count += 1;
        breakdown.waterWorlds.points += POINTS.waterWorld;
      }

      if (isTerraformable(body)) {
        breakdown.terraformable.count += 1;
        breakdown.terraformable.points += POINTS.terraformable;
      }

      if (subTypeIncludes(body, "high metal content")) {
        breakdown.highMetalContent.count += 1;
        breakdown.highMetalContent.points += POINTS.highMetalContent;
      }
    }
  }

  const total = Object.values(breakdown).reduce((sum, component) => sum + component.points, 0);
  return { total, breakdown };
}

/**
 * Agriculture strategy - MVP version uses identical scoring to industrial.
 * This can be extended in the future with different scoring criteria.
 *
 * @param system - The star system to score
 * @returns A scoring result (identical to industrial in MVP)
 */
export function computeAgricultureScore(system: StarSystem): ScoreResult {
  // MVP: Agriculture uses identical scoring to industrial
  // Future enhancement: Could add agricultural-specific criteria
  return computeIndustrialScore(system);
}

/**
 * Tritium strategy - scores systems based on icy rings in their planets.
 * Awards points for each icy ring found, with higher points for pristine rings.
 *
 * @param system - The star system to score
 * @returns A scoring result with icy ring counts and points
 */
export function computeTritiumScore(
  system: StarSystem,
): { total: number; breakdown: Record<string, { count: number; points: number }> } {
  const breakdown: Record<string, { count: number; points: number }> = {
    regular: { count: 0, points: 0 },
    pristine: { count: 0, points: 0 },
  };

  for (const body of system.bodies) {
    const rings = [...(body.rings && Array.isArray(body.rings) ? body.rings : []),
    ...(body.belts && Array.isArray(body.belts) ? body.belts : [])];
    for (const ring of rings) {
      // Check if ring is icy type (ringClass or type attribute, case-insensitive)
      const ringType = getRingClassType(ring);
      if (ringType?.toLowerCase() === "icy") {
        if (ring.reserveLevel?.toLowerCase() === "pristine") {
          breakdown.pristine.count += 1;
          breakdown.pristine.points += 10;
        } else {
          breakdown.regular.count += 1;
          breakdown.regular.points += 5;
        }
      }
    }
  }

  const total = breakdown.regular.points + breakdown.pristine.points;
  return { total, breakdown };
}

/**
 * Determines if a system should be included in tritium strategy results.
 * Systems with no icy rings are filtered out during read phase for memory efficiency.
 *
 * @param system - The star system to check
 * @returns true if system has at least 1 icy ring, false otherwise
 */
export function shouldIncludeTritium(system: StarSystem): boolean {
  return system.bodies.some(
    (body) => body.rings && Array.isArray(body.rings) && body.rings.some((ring) => getRingClassType(ring)?.toLowerCase() === "icy"),
  );
}

/**
 * Counts the total number of icy rings/belts in a system.
 * Checks both rings and belts arrays (data may use either attribute name).
 * Uses case-insensitive matching for ringClass="Icy".
 *
 * @param system - The star system to check
 * @returns Total count of icy rings/belts (regular + pristine)
 */
export function countIcyRings(system: StarSystem): number {
  let count = 0;
  for (const body of system.bodies) {
    // Check rings array
    if (body.rings && Array.isArray(body.rings)) {
      for (const ring of body.rings) {
        const ringType = getRingClassType(ring);
        if (ringType?.toLowerCase() === "icy") {
          count += 1;
        }
      }
    }
    // Check belts array (alternative attribute name in some data)
    const bodyAny = body as any;
    if (bodyAny.belts && Array.isArray(bodyAny.belts)) {
      for (const belt of bodyAny.belts) {
        const beltType = getRingClassType(belt);
        if (beltType?.toLowerCase() === "icy") {
          count += 1;
        }
      }
    }
  }
  return count;
}

/**
 * Routes to the appropriate scoring function based on the strategy name.
 * This is the main entry point for scoring system - calling this function will dispatch
 * to the correct strategy implementation.
 *
 * @param system - The star system to score
 * @param strategy - The scoring strategy to use (default: "industrial")
 * @returns A scoring result from the selected strategy
 */
export function computeScore(system: StarSystem, strategy: ScoringStrategyName = "industrial"): ScoreResult {
  switch (strategy) {
    case "industrial":
      return computeIndustrialScore(system);
    case "agriculture":
      return computeAgricultureScore(system);
    case "tritium": {
      // Convert tritium result to ScoreResult format for backward compatibility
      const tritiumResult = computeTritiumScore(system);
      return {
        total: tritiumResult.total,
        breakdown: tritiumResult.breakdown as ScoreBreakdown,
      };
    }
    default:
      const _exhaustive: never = strategy;
      throw new Error(`Unknown scoring strategy: ${_exhaustive}`);
  }
}
