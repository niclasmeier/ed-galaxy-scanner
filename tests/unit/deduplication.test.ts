import { describe, it, expect } from "bun:test";
import { findEligibleCandidatesWithNearest } from "../../src/domain/settlement";
import type { StarSystem } from "../../src/domain/types";

const createSystem = (
  id: number,
  name: string,
  x: number,
  y: number,
  z: number,
  population: number = 0
): StarSystem => ({
  id64: id,
  name,
  coords: { x, y, z },
  population,
  bodyCount: 1,
  bodies: [
    {
      id64: id * 1000,
      bodyId: 1,
      name: `${name} A`,
      type: "Star",
    },
    {
      id64: id * 1000 + 1,
      bodyId: 2,
      name: `${name} I`,
      type: "Planet",
    },
  ],
});

describe("Deduplication & Nearest-Populated Tracking", () => {
  it("should not return duplicate candidates with same id64", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const populated1 = createSystem(1, "Alpha", 10, 0, 0, 1);
    const candidate = createSystem(2, "Candidate", 5, 0, 0);

    const systems = [sol, populated1, candidate];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });

    // Candidate should appear exactly once
    const candidateCount = result.candidates.filter((c) => c.system.id64 === 2).length;
    expect(candidateCount).toBe(1);
  });

  it("should track nearest populated system for a candidate", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const near = createSystem(1, "Near", 5, 0, 0, 1);
    const far = createSystem(2, "Far", 12, 0, 0, 1);
    const candidate = createSystem(3, "Candidate", 8, 0, 0);

    const systems = [sol, near, far, candidate];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });
    const cand = result.candidates.find((c) => c.system.id64 === 3);

    expect(cand).toBeDefined();
    expect(cand!.nearestPopulatedName).toBe("Near"); // 3 LY closer than Far
  });

  it("should use lexicographic tie-breaker when distances are equal", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    // Create two populated systems equidistant from candidate
    // Place them far from Sol so candidate is nearer to them than to Sol
    const sysA = createSystem(1, "Alpha", 100, 10, 0, 1);
    const sysZ = createSystem(2, "Zebra", 100, -10, 0, 1); // Both 10 LY away from candidate

    // Candidate positioned to be 10 LY from both, and far from Sol
    const candidate = createSystem(3, "Candidate", 90, 0, 0);

    const systems = [sol, sysA, sysZ, candidate];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });
    const cand = result.candidates.find((c) => c.system.id64 === 3);

    // Should pick "Alpha" (comes before "Zebra" alphabetically)
    expect(cand!.nearestPopulatedName).toBe("Alpha");
  });

  it("should not include candidates with no planets", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const populated = createSystem(1, "Alpha", 10, 0, 0, 1);

    // Create empty system with no planets (only star)
    const emptyNoplanets: StarSystem = {
      id64: 2,
      name: "EmptyNoplanets",
      coords: { x: 5, y: 0, z: 0 },
      population: 0,
      bodyCount: 1,
      bodies: [
        {
          id64: 2000,
          bodyId: 1,
          name: "EmptyNoplanets A",
          type: "Star",
        },
      ],
    };

    const systems = [sol, populated, emptyNoplanets];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });

    const included = result.candidates.some((c) => c.system.id64 === 2);
    expect(included).toBe(false);
  });

  it("should not include populated systems in candidate results", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const populated = createSystem(1, "Alpha", 10, 0, 0, 1); // population > 0

    const systems = [sol, populated];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });

    const included = result.candidates.some((c) => c.system.name === "Alpha");
    expect(included).toBe(false);
  });

  it("should track multiple candidates with their nearest populated systems", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const pop1 = createSystem(1, "Pop1", 10, 0, 0, 1);
    const pop2 = createSystem(2, "Pop2", 0, 10, 0, 1);

    const cand1 = createSystem(3, "Cand1", 8, 0, 0); // Near Pop1
    const cand2 = createSystem(4, "Cand2", 0, 8, 0); // Near Pop2

    const systems = [sol, pop1, pop2, cand1, cand2];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });

    const c1 = result.candidates.find((c) => c.system.id64 === 3);
    const c2 = result.candidates.find((c) => c.system.id64 === 4);

    expect(c1!.nearestPopulatedName).toBe("Pop1");
    expect(c2!.nearestPopulatedName).toBe("Pop2");
  });

  it("should handle large candidate lists without duplicates", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const populated = createSystem(1, "Alpha", 10, 0, 0, 1);

    // Create 50 candidate systems in a grid
    const candidates: StarSystem[] = [];
    for (let i = 0; i < 50; i++) {
      const x = (i % 10) * 2;
      const y = Math.floor(i / 10) * 2;
      candidates.push(createSystem(i + 2, `Cand${i}`, x, y, 0));
    }

    const systems = [sol, populated, ...candidates];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });

    // Check no duplicates by comparing id64
    const ids = result.candidates.map((c) => c.system.id64);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length); // All unique
  });

  it("should handle case where candidate is equidistant from multiple populated systems", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);

    // Place populated systems far from Sol so they are the nearest
    const pop1 = createSystem(1, "Pop1", 100, 100, 0, 1);
    const pop2 = createSystem(2, "Pop2", 90, 115, 0, 1); // Equidistant from candidate
    const pop3 = createSystem(3, "Pop3", 110, 115, 0, 1); // Equidistant from candidate

    const candidate = createSystem(4, "Candidate", 100, 125, 0);

    const systems = [sol, pop1, pop2, pop3, candidate];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });
    const cand = result.candidates.find((c) => c.system.id64 === 4);

    // Should pick one deterministically (alphabetically first)
    expect(cand).toBeDefined();
    expect(cand!.nearestPopulatedName).toBeDefined();
    expect(["Pop1", "Pop2", "Pop3"]).toContain(cand!.nearestPopulatedName);
  });

  it("should correctly identify nearest when two populated systems are at exact same distance", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    // Both exactly 10 LY from candidate, placed far from Sol
    const sysA = createSystem(1, "SystemA", 100, 10, 0, 1);
    const sysB = createSystem(2, "SystemB", 100, -10, 0, 1);
    const candidate = createSystem(3, "Candidate", 90, 0, 0);

    const systems = [sol, sysA, sysB, candidate];

    const result = findEligibleCandidatesWithNearest(systems, { solName: "Sol" });
    const cand = result.candidates.find((c) => c.system.id64 === 3);

    // SystemA comes before SystemB alphabetically
    expect(cand!.nearestPopulatedName).toBe("SystemA");
  });
});
