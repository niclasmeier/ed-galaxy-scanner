import { describe, expect, test } from "bun:test";
import { computeScore } from "../../src/domain/scoring.js";
import type { StarSystem } from "../../src/domain/types.js";

describe("computeScore", () => {
  test("counts stars, neutron stars, and planet types", () => {
    const system: StarSystem = {
      id64: 1,
      name: "Test System",
      coords: { x: 0, y: 0, z: 0 },
      population: 0,
      bodies: [
        { id64: 10, bodyId: 0, name: "Primary", type: "Star", subType: "K" },
        { id64: 11, bodyId: 1, name: "Neutron", type: "Star", subType: "Neutron Star" },
        { id64: 20, bodyId: 2, name: "Gas", type: "Planet", subType: "Gas Giant" },
        { id64: 21, bodyId: 3, name: "Water", type: "Planet", subType: "Water World" },
        {
          id64: 22,
          bodyId: 4,
          name: "HMC",
          type: "Planet",
          subType: "High Metal Content World",
          isLandable: true,
          terraformingState: "Terraformable",
        },
      ],
    };

    const score = computeScore(system);

    expect(score.breakdown.stars).toEqual({ count: 2, points: 2 });
    expect(score.breakdown.neutronStars).toEqual({ count: 1, points: 2 });
    expect(score.breakdown.planets).toEqual({ count: 3, points: 15 });
    expect(score.breakdown.gasGiants).toEqual({ count: 1, points: 4 });
    expect(score.breakdown.waterWorlds).toEqual({ count: 1, points: 8 });
    expect(score.breakdown.landable).toEqual({ count: 1, points: 7 });
    expect(score.breakdown.terraformable).toEqual({ count: 1, points: 9 });
    expect(score.breakdown.highMetalContent).toEqual({ count: 1, points: 10 });
    expect(score.total).toBe(57);
  });
});
