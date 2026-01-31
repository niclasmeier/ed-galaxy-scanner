import { describe, it, expect } from "bun:test";
import { cubeKey, findReachableCubeKeysBySolDistance } from "../../src/domain/settlement";
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
  ],
});

describe("Reachability: Sol 150 LY cube filter", () => {
  it("marks Sol's cube as reachable", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const reachable = findReachableCubeKeysBySolDistance([sol], sol.coords, 150);

    expect(reachable.has(cubeKey(sol.coords))).toBe(true);
  });

  it("marks cubes with systems within 150 LY of Sol", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const nearby = createSystem(1, "Nearby", 100, 0, 0, 0);
    const reachable = findReachableCubeKeysBySolDistance([sol, nearby], sol.coords, 150);

    expect(reachable.has(cubeKey(nearby.coords))).toBe(true);
  });

  it("does not mark cubes for systems beyond 150 LY of Sol", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const far = createSystem(1, "FarSystem", 200, 0, 0, 0);
    const reachable = findReachableCubeKeysBySolDistance([sol, far], sol.coords, 150);

    expect(reachable.has(cubeKey(far.coords))).toBe(false);
  });

  it("includes systems at exactly 150 LY", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const boundary = createSystem(1, "Boundary", 150, 0, 0, 0);
    const reachable = findReachableCubeKeysBySolDistance([sol, boundary], sol.coords, 150);

    expect(reachable.has(cubeKey(boundary.coords))).toBe(true);
  });

  it("collapses multiple systems in the same cube", () => {
    const sol = createSystem(0, "Sol", 0, 0, 0, 1);
    const a = createSystem(1, "A", 10, 0, 0, 0);
    const b = createSystem(2, "B", 12, 1, 0, 0);
    const reachable = findReachableCubeKeysBySolDistance([sol, a, b], sol.coords, 150);

    expect(reachable.has(cubeKey(a.coords))).toBe(true);
    expect(reachable.has(cubeKey(b.coords))).toBe(true);
    expect(reachable.size).toBeGreaterThanOrEqual(1);
  });
});
