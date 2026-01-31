import { describe, expect, test } from "bun:test";

const expected = [
  {
    name: "Beta",
    nearestPopulatedName: "Alpha",
    distanceToSol: 10,
    totalScore: 14,
    scoreBreakdown: {
      stars: { count: 1, points: 1 },
      neutronStars: { count: 0, points: 0 },
      planets: { count: 1, points: 5 },
      gasGiants: { count: 0, points: 0 },
      landable: { count: 0, points: 0 },
      waterWorlds: { count: 1, points: 8 },
      terraformable: { count: 0, points: 0 },
      highMetalContent: { count: 0, points: 0 },
    },
    icyRings: 0,
  },
];

describe("CLI gzip input", () => {
  test("reads gzip JSON array input", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        "tests/integration/fixtures/galaxy.fixture.array.json.gz",
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(result.exitCode).toBe(0);
    const output = result.stdout.toString();
    const parsed = JSON.parse(output);
    expect(parsed).toEqual(expected);
  });

  test("rejects gzip JSONL input", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        "tests/integration/fixtures/galaxy.fixture.jsonl.gz",
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(result.exitCode).not.toBe(0);
    const stderr = result.stderr.toString();
    expect(stderr).toContain("Input must be a JSON array");
  });
});
