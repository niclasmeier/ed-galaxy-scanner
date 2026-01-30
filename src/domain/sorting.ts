import type { SettlementCandidate, SortCriterion, SortDirection, SortField, SortSpec } from "./types.js";

/**
 * Default sort specification: score descending, then distance to Sol ascending
 */
export const DEFAULT_SORT_SPEC: SortSpec = [
  { field: "score", direction: "desc" },
  { field: "dsol", direction: "asc" },
];

/**
 * Valid sort field names
 */
const VALID_SORT_FIELDS: readonly SortField[] = ["score", "dsol"];

/**
 * Valid sort directions
 */
const VALID_SORT_DIRECTIONS: readonly SortDirection[] = ["asc", "desc"];

/**
 * Default sort direction for each field
 */
const DEFAULT_SORT_DIRECTIONS: Record<SortField, SortDirection> = {
  score: "desc",
  dsol: "asc",
};

/**
 * Parses a sort specification string into a structured SortSpec array.
 *
 * Format: `field[-direction][,field[-direction]...]`
 * Examples:
 * - `score-desc` → `[{ field: "score", direction: "desc" }]`
 * - `dsol-asc` → `[{ field: "dsol", direction: "asc" }]`
 * - `score-desc,dsol-asc` → `[{ field: "score", direction: "desc" }, { field: "dsol", direction: "asc" }]`
 * - `score` → `[{ field: "score", direction: "desc" }]` (default direction)
 * - `dsol` → `[{ field: "dsol", direction: "asc" }]` (default direction)
 *
 * @param input - The sort specification string from `--sort` flag
 * @returns Parsed SortSpec array
 * @throws Error if parsing fails
 */
export function parseSortSpec(input: string): SortSpec {
  if (!input || input.trim().length === 0) {
    return [];
  }

  const criteria = input.split(",").map((part) => part.trim());
  const spec: SortSpec = [];

  for (const criterion of criteria) {
    if (!criterion) continue; // Skip empty criteria

    // Replace hyphens with spaces, split on whitespace/hyphens
    const normalized = criterion.replace(/\s*-\s*/g, "-");
    const parts = normalized.toLowerCase().split("-");
    const fieldName = parts[0]?.trim();
    const directionSuffix = parts.length > 1 ? parts.slice(1).join("-") : undefined;

    if (!fieldName) continue;

    // Validate field name
    const field = fieldName as SortField;
    if (!VALID_SORT_FIELDS.includes(field)) {
      throw new Error(
        `Invalid sort field: "${fieldName}". Valid fields are: ${VALID_SORT_FIELDS.join(", ")}`
      );
    }

    // Determine direction
    let direction: SortDirection;
    if (directionSuffix) {
      if (!VALID_SORT_DIRECTIONS.includes(directionSuffix as SortDirection)) {
        throw new Error(
          `Invalid sort direction: "${directionSuffix}". Valid directions are: ${VALID_SORT_DIRECTIONS.join(", ")}`
        );
      }
      direction = directionSuffix as SortDirection;
    } else {
      // Use default direction for this field
      direction = DEFAULT_SORT_DIRECTIONS[field];
    }

    spec.push({ field, direction });
  }

  return spec;
}

/**
 * Validates a SortSpec array for correctness.
 *
 * @param spec - The sort specification to validate
 * @throws Error if spec is invalid
 */
export function validateSortSpec(spec: SortSpec): void {
  if (!Array.isArray(spec)) {
    throw new Error("Sort specification must be an array");
  }

  const seenFields = new Set<SortField>();

  for (const criterion of spec) {
    if (!criterion.field || !VALID_SORT_FIELDS.includes(criterion.field)) {
      throw new Error(
        `Invalid sort field: "${criterion.field}". Valid fields are: ${VALID_SORT_FIELDS.join(
          ", "
        )}`
      );
    }

    if (!criterion.direction || !VALID_SORT_DIRECTIONS.includes(criterion.direction)) {
      throw new Error(
        `Invalid sort direction: "${criterion.direction}". Valid directions are: ${VALID_SORT_DIRECTIONS.join(
          ", "
        )}`
      );
    }

    // Check for duplicate fields
    if (seenFields.has(criterion.field)) {
      throw new Error(`Duplicate sort field: "${criterion.field}"`);
    }
    seenFields.add(criterion.field);
  }
}

/**
 * Applies a sort specification to a list of settlement candidates.
 * Uses stable multi-level sorting where equal values at one level
 * are broken by the next criterion in the list.
 *
 * @param candidates - The settlement candidates to sort
 * @param spec - The sort specification to apply
 * @returns A new sorted array of candidates
 */
export function applySortSpec(
  candidates: SettlementCandidate[],
  spec: SortSpec
): SettlementCandidate[] {
  // Create a copy to avoid mutating the original
  const sorted = [...candidates];

  // Sort using all criteria in reverse order (stable sort)
  // This ensures earlier criteria take precedence
  for (let i = spec.length - 1; i >= 0; i--) {
    const criterion = spec[i];
    sorted.sort((a, b) => {
      let comparison = 0;

      if (criterion.field === "score") {
        comparison = a.totalScore - b.totalScore;
      } else if (criterion.field === "dsol") {
        comparison = a.distanceToSol - b.distanceToSol;
      }

      // Apply direction (negate for descending)
      if (criterion.direction === "desc") {
        comparison = -comparison;
      }

      return comparison;
    });
  }

  return sorted;
}
