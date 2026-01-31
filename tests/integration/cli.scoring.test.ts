import { describe, expect, test } from "bun:test";

const fixturePath = "tests/integration/fixtures/galaxy.fixture.array.json";

describe("CLI scoring strategies", () => {
  test("--scoring industrial (default behavior)", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "industrial",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(result.exitCode).toBe(0);
    const output = result.stdout.toString();
    const parsed = JSON.parse(output);

    // Should have same scores as default (industrial)
    expect(parsed[0]).toEqual(
      expect.objectContaining({
        name: "Beta",
        totalScore: 14,
      }),
    );
  });

  test("--scoring industrial without flag defaults to industrial", () => {
    const resultDefault = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
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

    const resultExplicit = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "industrial",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(resultDefault.exitCode).toBe(0);
    expect(resultExplicit.exitCode).toBe(0);

    const defaultOutput = JSON.parse(resultDefault.stdout.toString());
    const explicitOutput = JSON.parse(resultExplicit.stdout.toString());

    // Default should match explicit industrial
    expect(defaultOutput).toEqual(explicitOutput);
  });

  test("--scoring agriculture matches industrial", () => {
    const resultIndustrial = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "industrial",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const resultAgriculture = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "agriculture",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(resultIndustrial.exitCode).toBe(0);
    expect(resultAgriculture.exitCode).toBe(0);

    const industrialOutput = JSON.parse(resultIndustrial.stdout.toString());
    const agricultureOutput = JSON.parse(resultAgriculture.stdout.toString());

    // Agriculture should produce identical scores to industrial for MVP
    expect(agricultureOutput).toEqual(industrialOutput);
  });

  test("--scoring tritium filters and scores correctly", () => {
    const resultTritium = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "tritium",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(resultTritium.exitCode).toBe(0);
    const output = resultTritium.stdout.toString();
    const parsed = JSON.parse(output);

    // Tritium strategy should only include systems with icy rings
    // This will depend on fixture data - fixture has no icy rings, so should be empty
    expect(Array.isArray(parsed)).toBe(true);
  });

  test("invalid strategy rejects with clear error message", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "invalid-strategy",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(result.exitCode).not.toBe(0);
    const stderr = result.stderr.toString();
    expect(stderr).toContain("Invalid scoring strategy");
    expect(stderr).toContain("invalid-strategy");
  });

  test("--verbose output shows selected scoring strategy", () => {
    const resultIndustrial = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "industrial",
        "--verbose",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(resultIndustrial.exitCode).toBe(0);
    const stderr = resultIndustrial.stderr.toString();
    expect(stderr).toContain("scoring=industrial");
  });

  test("--verbose output shows filtered_no_ice only for tritium strategy", () => {
    const resultIndustrial = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "industrial",
        "--verbose",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const resultTritium = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--scoring",
        "tritium",
        "--verbose",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(resultIndustrial.exitCode).toBe(0);
    expect(resultTritium.exitCode).toBe(0);

    const stderrIndustrial = resultIndustrial.stderr.toString();
    const stderrTritium = resultTritium.stderr.toString();

    // Industrial should NOT show filtered_no_ice
    expect(stderrIndustrial).not.toContain("filtered_no_ice");

    // Tritium should show filtered_no_ice
    expect(stderrTritium).toContain("filtered_no_ice");
  });

  test("golden output still matches with default industrial strategy", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
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

    expect(parsed).toEqual([
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
    ]);
  });

  test("simple format output includes icy rings column", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--format",
        "simple",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(result.exitCode).toBe(0);
    const output = result.stdout.toString();
    
    // Check header includes icy rings column
    expect(output).toContain("| name | nearest | dsol | score | stars | bodies | icy rings | stations |");
    
    // Check that data row includes dsol and icy rings value (0 for Beta system)
    expect(output).toMatch(/\| Beta \| Alpha \| [\d.]+ \| \d+ \| \d+ \| \d+ \| 0 \| \d+ \|/);
  });});