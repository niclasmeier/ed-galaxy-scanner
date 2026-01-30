import { describe, expect, test } from "bun:test";
import { findEligibleCandidates } from "../../src/domain/settlement.js";
import type { StarSystem } from "../../src/domain/types.js";

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
  coords: { x: 10, y: 0, z: 0 },
  population: 0,
  bodies: [{ id64: 200, bodyId: 0, name: "Beta I", type: "Planet" }],
};

describe("max distance to Sol filtering", () => {
  test("excludes systems beyond the max distance", () => {
    const systems = [sol, populatedNear, emptyClose];
    const candidates = findEligibleCandidates(systems, {
      maxDistSol: 5,
      solName: "Sol",
    });

    expect(candidates).toHaveLength(0);
  });
});
