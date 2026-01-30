import { describe, it, expect } from "bun:test";
import {
  DEFAULT_SORT_SPEC,
  parseSortSpec,
  validateSortSpec,
  applySortSpec,
} from "../../src/domain/sorting.js";
import type { SettlementCandidate } from "../../src/domain/types.js";

describe("sorting", () => {
  const mockCandidates: SettlementCandidate[] = [
    {
      name: "Alpha Centauri A",
      nearestPopulatedName: "Sol",
      distanceToSol: 4.37,
      totalScore: 50,
      scoreBreakdown: { industrial: 50 },
      starsCount: 1,
      bodyCount: 3,
      icyRings: 2,
      stationCount: 1,
    },
    {
      name: "Barnard's Star",
      nearestPopulatedName: "Sol",
      distanceToSol: 5.96,
      totalScore: 75,
      scoreBreakdown: { industrial: 75 },
      starsCount: 1,
      bodyCount: 2,
      icyRings: 1,
      stationCount: 0,
    },
    {
      name: "Wolf 359",
      nearestPopulatedName: "Sol",
      distanceToSol: 7.78,
      totalScore: 75,
      scoreBreakdown: { industrial: 75 },
      starsCount: 1,
      bodyCount: 1,
      icyRings: 3,
      stationCount: 2,
    },
    {
      name: "Sirius",
      nearestPopulatedName: "Sol",
      distanceToSol: 8.6,
      totalScore: 100,
      scoreBreakdown: { industrial: 100 },
      starsCount: 2,
      bodyCount: 5,
      icyRings: 0,
      stationCount: 3,
    },
  ];

  describe("DEFAULT_SORT_SPEC", () => {
    it("should be score-desc then dsol-asc", () => {
      expect(DEFAULT_SORT_SPEC).toEqual([
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
    });
  });

  describe("parseSortSpec", () => {
    it("should parse single criterion with direction", () => {
      const result = parseSortSpec("score-desc");
      expect(result).toEqual([{ field: "score", direction: "desc" }]);
    });

    it("should parse single criterion without direction using default", () => {
      const result = parseSortSpec("score");
      expect(result).toEqual([{ field: "score", direction: "desc" }]);
    });

    it("should parse single criterion dsol without direction using default", () => {
      const result = parseSortSpec("dsol");
      expect(result).toEqual([{ field: "dsol", direction: "asc" }]);
    });

    it("should parse multiple criteria separated by comma", () => {
      const result = parseSortSpec("score-desc,dsol-asc");
      expect(result).toEqual([
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
    });

    it("should handle whitespace around commas", () => {
      const result = parseSortSpec("score-desc , dsol-asc");
      expect(result).toEqual([
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
    });

    it("should handle whitespace within criteria", () => {
      const result = parseSortSpec("score - desc");
      expect(result).toEqual([{ field: "score", direction: "desc" }]);
    });

    it("should be case-insensitive for fields", () => {
      const result = parseSortSpec("SCORE-desc");
      expect(result).toEqual([{ field: "score", direction: "desc" }]);
    });

    it("should be case-insensitive for directions", () => {
      const result = parseSortSpec("score-DESC");
      expect(result).toEqual([{ field: "score", direction: "desc" }]);
    });

    it("should handle mixed case", () => {
      const result = parseSortSpec("SCORE-DESC,DSOL-ASC");
      expect(result).toEqual([
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
    });

    it("should parse multiple criteria with defaults", () => {
      const result = parseSortSpec("score,dsol");
      expect(result).toEqual([
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
    });

    it("should handle trailing/leading whitespace", () => {
      const result = parseSortSpec("  score-desc,dsol-asc  ");
      expect(result).toEqual([
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
    });

    it("should handle empty input as empty array", () => {
      const result = parseSortSpec("");
      expect(result).toEqual([]);
    });
  });

  describe("validateSortSpec", () => {
    it("should not throw for valid single criterion", () => {
      expect(() => validateSortSpec([{ field: "score", direction: "desc" }])).not.toThrow();
    });

    it("should not throw for valid multiple criteria", () => {
      expect(() =>
        validateSortSpec([
          { field: "score", direction: "desc" },
          { field: "dsol", direction: "asc" },
        ]),
      ).not.toThrow();
    });

    it("should throw for invalid field", () => {
      expect(() => validateSortSpec([{ field: "invalid" as never, direction: "desc" }])).toThrow(
        "Invalid sort field",
      );
    });

    it("should throw for invalid direction", () => {
      expect(() => validateSortSpec([{ field: "score", direction: "invalid" as never }])).toThrow(
        "Invalid sort direction",
      );
    });

    it("should throw for duplicate fields", () => {
      expect(() =>
        validateSortSpec([
          { field: "score", direction: "desc" },
          { field: "score", direction: "asc" },
        ]),
      ).toThrow(/duplicate/i);
    });

    it("should not throw for empty spec", () => {
      expect(() => validateSortSpec([])).not.toThrow();
    });
  });

  describe("applySortSpec", () => {
    it("should sort by score descending (default)", () => {
      const result = applySortSpec(mockCandidates, [{ field: "score", direction: "desc" }]);
      expect(result[0].name).toBe("Sirius");
      expect(result[1].name).toBe("Barnard's Star");
      expect(result[2].name).toBe("Wolf 359");
      expect(result[3].name).toBe("Alpha Centauri A");
    });

    it("should sort by score ascending", () => {
      const result = applySortSpec(mockCandidates, [{ field: "score", direction: "asc" }]);
      expect(result[0].name).toBe("Alpha Centauri A");
      expect(result[1].name).toBe("Barnard's Star");
      expect(result[2].name).toBe("Wolf 359");
      expect(result[3].name).toBe("Sirius");
    });

    it("should sort by dsol ascending", () => {
      const result = applySortSpec(mockCandidates, [{ field: "dsol", direction: "asc" }]);
      expect(result[0].name).toBe("Alpha Centauri A");
      expect(result[1].name).toBe("Barnard's Star");
      expect(result[2].name).toBe("Wolf 359");
      expect(result[3].name).toBe("Sirius");
    });

    it("should sort by dsol descending", () => {
      const result = applySortSpec(mockCandidates, [{ field: "dsol", direction: "desc" }]);
      expect(result[0].name).toBe("Sirius");
      expect(result[1].name).toBe("Wolf 359");
      expect(result[2].name).toBe("Barnard's Star");
      expect(result[3].name).toBe("Alpha Centauri A");
    });

    it("should apply stable multi-level sort (score desc, then dsol asc)", () => {
      const result = applySortSpec(mockCandidates, [
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
      // Sirius (100, 8.6) should be first
      expect(result[0].name).toBe("Sirius");
      // Barnard's Star (75, 5.96) and Wolf 359 (75, 7.78) both have score 75
      // Should be sorted by dsol ascending, so Barnard's Star comes first
      expect(result[1].name).toBe("Barnard's Star");
      expect(result[2].name).toBe("Wolf 359");
      expect(result[3].name).toBe("Alpha Centauri A");
    });

    it("should apply stable multi-level sort (score desc, then dsol desc)", () => {
      const result = applySortSpec(mockCandidates, [
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "desc" },
      ]);
      expect(result[0].name).toBe("Sirius");
      // For score 75, should sort by dsol descending
      expect(result[1].name).toBe("Wolf 359");
      expect(result[2].name).toBe("Barnard's Star");
      expect(result[3].name).toBe("Alpha Centauri A");
    });

    it("should handle empty candidates array", () => {
      const result = applySortSpec([], [{ field: "score", direction: "desc" }]);
      expect(result).toEqual([]);
    });

    it("should handle empty sort spec", () => {
      const result = applySortSpec(mockCandidates, []);
      // Order should be preserved (original order)
      expect(result).toEqual(mockCandidates);
    });

    it("should not mutate original candidates array", () => {
      const original = [...mockCandidates];
      applySortSpec(mockCandidates, [{ field: "score", direction: "desc" }]);
      expect(mockCandidates).toEqual(original);
    });

    it("should handle candidates with same score and dsol", () => {
      const identical: SettlementCandidate[] = [
        {
          name: "System A",
          nearestPopulatedName: "Sol",
          distanceToSol: 5.0,
          totalScore: 50,
          scoreBreakdown: { industrial: 50 },
          starsCount: 1,
          bodyCount: 1,
          icyRings: 0,
          stationCount: 0,
        },
        {
          name: "System B",
          nearestPopulatedName: "Sol",
          distanceToSol: 5.0,
          totalScore: 50,
          scoreBreakdown: { industrial: 50 },
          starsCount: 1,
          bodyCount: 1,
          icyRings: 0,
          stationCount: 0,
        },
      ];
      const result = applySortSpec(identical, [
        { field: "score", direction: "desc" },
        { field: "dsol", direction: "asc" },
      ]);
      // Order should remain stable (original order preserved)
      expect(result[0].name).toBe("System A");
      expect(result[1].name).toBe("System B");
    });
  });
});
