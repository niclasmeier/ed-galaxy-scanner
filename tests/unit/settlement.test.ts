import { describe, expect, test } from "bun:test";
import { findEligibleCandidates, sortCandidates } from "../../src/domain/settlement.js";
import type { SettlementCandidate, StarSystem } from "../../src/domain/types.js";

const sol: StarSystem = {
  id64: 1,
  name: "Sol",
  coords: { x: 0, y: 0, z: 0 },
  population: 1000,
  bodies: [{ id64: 100, bodyId: 0, name: "Sol", type: "Star" }],
};

const populatedNear: StarSystem = {
  id64: 2,
  name: "Alpha",
  coords: { x: 5, y: 0, z: 0 },
  population: 10,
  bodies: [{ id64: 101, bodyId: 0, name: "Alpha Star", type: "Star" }],
};

const emptyClose: StarSystem = {
  id64: 3,
  name: "Beta",
  coords: { x: 15, y: 0, z: 0 },
  population: 0,
  bodies: [{ id64: 200, bodyId: 0, name: "Beta I", type: "Planet" }],
};

const emptyFar: StarSystem = {
  id64: 4,
  name: "Gamma",
  coords: { x: 40, y: 0, z: 0 },
  population: 0,
  bodies: [{ id64: 300, bodyId: 0, name: "Gamma I", type: "Planet" }],
};

describe("findEligibleCandidates", () => {
  test("returns empty systems within 15 LY of populated systems", () => {
    const systems = [sol, populatedNear, emptyClose, emptyFar];
    const candidates = findEligibleCandidates(systems, {
      maxDistSol: 1000,
      solName: "Sol",
    });

    expect(candidates.map((system) => system.name)).toEqual(["Beta"]);
  });
});

describe("sortCandidates", () => {
  test("orders by score descending, then name ascending", () => {
    const list: SettlementCandidate[] = [
      {
        name: "Zeta",
        nearestPopulatedName: "Alpha",
        distanceToSol: 10,
        totalScore: 10,
        scoreBreakdown: {
          stars: { count: 0, points: 0 },
          neutronStars: { count: 0, points: 0 },
          planets: { count: 0, points: 0 },
          gasGiants: { count: 0, points: 0 },
          landable: { count: 0, points: 0 },
          waterWorlds: { count: 0, points: 0 },
          terraformable: { count: 0, points: 0 },
          highMetalContent: { count: 0, points: 0 },
        },
      },
      {
        name: "Alpha",
        nearestPopulatedName: "Alpha",
        distanceToSol: 10,
        totalScore: 10,
        scoreBreakdown: {
          stars: { count: 0, points: 0 },
          neutronStars: { count: 0, points: 0 },
          planets: { count: 0, points: 0 },
          gasGiants: { count: 0, points: 0 },
          landable: { count: 0, points: 0 },
          waterWorlds: { count: 0, points: 0 },
          terraformable: { count: 0, points: 0 },
          highMetalContent: { count: 0, points: 0 },
        },
      },
    ];

    const sorted = sortCandidates(list);
    expect(sorted.map((item) => item.name)).toEqual(["Alpha", "Zeta"]);
  });
});
