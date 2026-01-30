import { describe, it, expect } from "bun:test";
import {
  SAGITTARIUS_A,
  getSystemQuadrant,
  parseQuadrants,
  isSystemInQuadrants,
  type QuadrantName,
} from "../../src/utils/quadrant.js";

describe("quadrant utilities", () => {
  describe("SAGITTARIUS_A constant", () => {
    it("should have correct coordinates", () => {
      expect(SAGITTARIUS_A.x).toBe(25.21875);
      expect(SAGITTARIUS_A.y).toBe(-20.90625);
      expect(SAGITTARIUS_A.z).toBe(25899.96875);
    });
  });

  describe("getSystemQuadrant", () => {
    it("should return NW for west and north of Sagittarius A*", () => {
      const nwSystem = { x: 0, y: 0, z: 0 }; // Sol - west and north
      expect(getSystemQuadrant(nwSystem)).toBe("NW");
    });

    it("should return NE for east and north of Sagittarius A*", () => {
      const neSystem = { x: 100, y: 100, z: 0 };
      expect(getSystemQuadrant(neSystem)).toBe("NE");
    });

    it("should return SW for west and south of Sagittarius A*", () => {
      const swSystem = { x: 0, y: -100, z: 0 };
      expect(getSystemQuadrant(swSystem)).toBe("SW");
    });

    it("should return SE for east and south of Sagittarius A*", () => {
      const seSystem = { x: 100, y: -100, z: 0 };
      expect(getSystemQuadrant(seSystem)).toBe("SE");
    });

    it("should ignore Z coordinate", () => {
      const sw1 = { x: 0, y: -100, z: 0 };
      const sw2 = { x: 0, y: -100, z: 50000 };
      expect(getSystemQuadrant(sw1)).toBe(getSystemQuadrant(sw2));
    });

    it("should return null for null/undefined input", () => {
      expect(getSystemQuadrant(null)).toBeNull();
      expect(getSystemQuadrant(undefined)).toBeNull();
    });

    it("should handle boundary cases correctly", () => {
      // Just at the boundary - slightly above should be NW, slightly below SE
      const atXBoundary = { x: SAGITTARIUS_A.x, y: 0, z: 0 };
      expect(getSystemQuadrant(atXBoundary)).toBe("NE"); // x is not less than, so NE
      
      const atYBoundary = { x: 0, y: SAGITTARIUS_A.y, z: 0 };
      expect(getSystemQuadrant(atYBoundary)).toBe("SW"); // y is not greater than, so SW
    });
  });

  describe("parseQuadrants", () => {
    it("should parse single quadrant", () => {
      const result = parseQuadrants("NW");
      expect(result).not.toBeNull();
      expect(result?.has("NW")).toBe(true);
      expect(result?.size).toBe(1);
    });

    it("should parse comma-separated quadrants", () => {
      const result = parseQuadrants("NW,SE");
      expect(result).not.toBeNull();
      expect(result?.has("NW")).toBe(true);
      expect(result?.has("SE")).toBe(true);
      expect(result?.size).toBe(2);
    });

    it("should handle whitespace around quadrants", () => {
      const result = parseQuadrants("NW , SE , NE");
      expect(result).not.toBeNull();
      expect(result?.has("NW")).toBe(true);
      expect(result?.has("SE")).toBe(true);
      expect(result?.has("NE")).toBe(true);
      expect(result?.size).toBe(3);
    });

    it("should parse 'all' as all four quadrants", () => {
      const result = parseQuadrants("all");
      expect(result).not.toBeNull();
      expect(result?.has("NW")).toBe(true);
      expect(result?.has("NE")).toBe(true);
      expect(result?.has("SW")).toBe(true);
      expect(result?.has("SE")).toBe(true);
      expect(result?.size).toBe(4);
    });

    it("should be case-insensitive", () => {
      const lower = parseQuadrants("nw");
      const upper = parseQuadrants("NW");
      const mixed = parseQuadrants("Nw");
      expect(lower).not.toBeNull();
      expect(upper).not.toBeNull();
      expect(mixed).not.toBeNull();
      expect(lower?.has("NW")).toBe(true);
      expect(upper?.has("NW")).toBe(true);
      expect(mixed?.has("NW")).toBe(true);
    });

    it("should return null for invalid quadrant names", () => {
      expect(parseQuadrants("INVALID")).toBeNull();
      expect(parseQuadrants("NW,INVALID")).toBeNull();
      expect(parseQuadrants("XX")).toBeNull();
    });

    it("should return null for empty input", () => {
      expect(parseQuadrants("")).toBeNull();
      expect(parseQuadrants("   ")).toBeNull();
    });

    it("should handle all case variations", () => {
      const allCases = parseQuadrants("ALL");
      expect(allCases).not.toBeNull();
      expect(allCases?.size).toBe(4);
    });
  });

  describe("isSystemInQuadrants", () => {
    it("should return true when system is in specified quadrant", () => {
      const swSystem = { x: 0, y: -100, z: 0 };
      const quadrants = new Set<QuadrantName>(["SW"]);
      expect(isSystemInQuadrants(swSystem, quadrants)).toBe(true);
    });

    it("should return false when system is not in specified quadrant", () => {
      const swSystem = { x: 0, y: -100, z: 0 };
      const quadrants = new Set<QuadrantName>(["NE"]);
      expect(isSystemInQuadrants(swSystem, quadrants)).toBe(false);
    });

    it("should return true if system matches any quadrant in set", () => {
      const swSystem = { x: 0, y: -100, z: 0 };
      const quadrants = new Set<QuadrantName>(["NW", "SW", "SE"]);
      expect(isSystemInQuadrants(swSystem, quadrants)).toBe(true);
    });

    it("should return false for null/undefined coords", () => {
      const quadrants = new Set<QuadrantName>(["SW"]);
      expect(isSystemInQuadrants(null, quadrants)).toBe(false);
      expect(isSystemInQuadrants(undefined, quadrants)).toBe(false);
    });
  });
});
