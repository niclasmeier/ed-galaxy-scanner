export interface Coords {
  x: number;
  y: number;
  z: number;
}

export interface Ring {
  name: string;
  type?: string;
  ringClass: string; // e.g., "Icy", "Rocky", etc.
  reserveLevel?: string; // e.g., "Pristine", "Major", "Common", "Low"
  mass?: number;
  innerRadius?: number;
  outerRadius?: number;
  id64?: number;
  signals?: unknown;
}

export interface Body {
  id64: number;
  bodyId: number;
  name: string;
  type: string;
  subType?: string;
  isLandable?: boolean;
  terraformingState?: string;
  rings?: Ring[];
  belts?: Ring[];
}

export interface StarSystem {
  id64: number;
  name: string;
  coords: Coords;
  population: number;
  bodies: Body[];
  bodyCount?: number;
  allegiance?: string | null;
  stations?: unknown[];
}

export interface SpaceSelectionStrategy {
  mode: "sphere" | "cube" | "area";
  maxDistSol?: number;
  cubeFromName?: string;
  cubeToName?: string;
  areaFromName?: string;
  areaToName?: string;
}

export interface SelectionBounds {
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
  source: "sphere" | "cube" | "area";
}

export interface ScoreComponent {
  count: number;
  points: number;
}

export interface ScoreBreakdown {
  stars: ScoreComponent;
  neutronStars: ScoreComponent;
  planets: ScoreComponent;
  gasGiants: ScoreComponent;
  landable: ScoreComponent;
  waterWorlds: ScoreComponent;
  terraformable: ScoreComponent;
  highMetalContent: ScoreComponent;
}

export interface SettlementCandidate {
  name: string;
  nearestPopulatedName: string;
  distanceToSol: number;
  totalScore: number;
  scoreBreakdown: ScoreBreakdown;
  starsCount?: number;
  bodyCount?: number;
  icyRings?: number;
  stationCount?: number;
}

export interface ParsedRecord<T> {
  value: T;
  lineNumber?: number;
}

// Scoring Strategy Types
export type ScoringStrategyName = "industrial" | "agriculture" | "tritium";

export interface ScoringBreakdownItem {
  count: number;
  points: number;
}

export interface ScoringResult {
  total: number;
  breakdown: Record<string, ScoringBreakdownItem>;
}

export interface ScoringFunction {
  name: ScoringStrategyName;
  score: (system: StarSystem) => ScoringResult;
  shouldInclude?: (system: StarSystem) => boolean;
}

// Sorting Strategy Types
export type SortField = "score" | "dsol";
export type SortDirection = "asc" | "desc";

export interface SortCriterion {
  field: SortField;
  direction: SortDirection;
}

export type SortSpec = SortCriterion[];
