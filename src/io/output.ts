import type { SettlementCandidate } from "../domain/types.js";

export type OutputFormat = "json" | "text" | "simple";

export function formatCandidates(
  candidates: SettlementCandidate[],
  format: OutputFormat,
): string {
  if (format === "json") {
    const payload = candidates.map((candidate) => ({
      name: candidate.name,
      nearestPopulatedName: candidate.nearestPopulatedName,
      distanceToSol: candidate.distanceToSol,
      totalScore: candidate.totalScore,
      scoreBreakdown: candidate.scoreBreakdown,
      icyRings: candidate.icyRings,
    }));
    return JSON.stringify(payload, null, 2);
  }

  if (candidates.length === 0) {
    return "No settlement candidates found.";
  }

  if (format === "simple") {
    const lines: string[] = [];
    const header =
      "| name | nearest | dsol | score | stars | bodies | icy rings | stations |";
    const separator =
      "| --- | --- | --- | --- | --- | --- | --- | --- |";
    lines.push(header, separator);
    for (const row of candidates) {
      lines.push(
        `| ${row.name} | ${row.nearestPopulatedName} | ${row.distanceToSol.toFixed(2)} | ${row.totalScore} | ` +
          `${row.starsCount ?? 0} | ${row.bodyCount ?? 0} | ${row.icyRings ?? 0} | ${row.stationCount ?? 0} |`,
      );
    }
    return lines.join("\n");
  }

  const lines: string[] = [];
  for (const candidate of candidates) {
    const breakdown = candidate.scoreBreakdown;
    lines.push(
      `${candidate.name} | nearest=${candidate.nearestPopulatedName} | score=${candidate.totalScore} | dist=${candidate.distanceToSol.toFixed(2)} LY`,
    );
    lines.push(
      `  stars=${breakdown.stars.count}(${breakdown.stars.points}), ` +
        `neutron=${breakdown.neutronStars.count}(${breakdown.neutronStars.points}), ` +
        `planets=${breakdown.planets.count}(${breakdown.planets.points}), ` +
        `gas=${breakdown.gasGiants.count}(${breakdown.gasGiants.points}), ` +
        `landable=${breakdown.landable.count}(${breakdown.landable.points}), ` +
        `water=${breakdown.waterWorlds.count}(${breakdown.waterWorlds.points}), ` +
        `terraformable=${breakdown.terraformable.count}(${breakdown.terraformable.points}), ` +
        `hmc=${breakdown.highMetalContent.count}(${breakdown.highMetalContent.points})`,
    );
  }

  return lines.join("\n");
}
