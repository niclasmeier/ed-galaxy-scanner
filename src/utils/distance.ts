import type { Coords, StarSystem } from "../domain/types.js";

export function distance(a: Coords, b: Coords): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function distanceToSol(system: StarSystem, solCoords: Coords): number {
  return distance(system.coords, solCoords);
}
