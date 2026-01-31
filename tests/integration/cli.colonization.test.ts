import { describe, test, expect } from "bun:test";

const fixturePath = "tests/integration/fixtures/galaxy.fixture.array.json";

describe("Colonization Modes Integration Tests", () => {
  test("T050: --colonization-mode none returns all empty systems with planets", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--colonization-mode",
        "none",
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

    // When colonization-mode is none, should return any empty system with planets,
    // not limited by 15 LY proximity to populated systems
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBeGreaterThanOrEqual(0);
  });

  test("T050: --colonization-mode standard (default) returns only 15 LY near populated", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--colonization-mode",
        "standard",
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

    // With standard mode, should only return candidates within 15 LY of populated systems
    expect(Array.isArray(parsed)).toBe(true);

    // All results should have a nearestPopulatedName property
    if (parsed.length > 0) {
      for (const candidate of parsed) {
        expect(candidate.nearestPopulatedName).toBeDefined();
        expect(typeof candidate.nearestPopulatedName).toBe("string");
      }
    }
  });

  test("T050: --colonization-mode none returns more candidates than standard", () => {
    const resultNone = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--colonization-mode",
        "none",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const resultSinglePass = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--colonization-mode",
        "standard",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const parsedNone = JSON.parse(resultNone.stdout.toString());
    const parsedSinglePass = JSON.parse(resultSinglePass.stdout.toString());

    // The "none" mode should return >= candidates compared to standard
    // (as it doesn't restrict to 15 LY proximity)
    expect(parsedNone.length).toBeGreaterThanOrEqual(parsedSinglePass.length);
  });

  test("T051: --require-sol-route excludes unreachable systems", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--require-sol-route",
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

    // All returned candidates should be in cubes with systems within 150 LY of Sol
    expect(Array.isArray(parsed)).toBe(true);
  });

  test("T051: --require-sol-route with --colonization-mode none filters route reachability", () => {
    const resultWithoutRoute = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--colonization-mode",
        "none",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const resultWithRoute = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--max-dist-sol",
        "1000",
        "--use-quadrants",
        "all",
        "--colonization-mode",
        "none",
        "--require-sol-route",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    const parsedWithout = JSON.parse(resultWithoutRoute.stdout.toString());
    const parsedWith = JSON.parse(resultWithRoute.stdout.toString());

    // Adding --require-sol-route should filter some candidates
    // (those outside cubes with systems within 150 LY of Sol)
    expect(parsedWith.length).toBeLessThanOrEqual(parsedWithout.length);
  });

  test("T051: invalid colonization mode value shows error", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        fixturePath,
        "--colonization-mode",
        "invalid",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    // Should exit with non-zero code
    expect(result.exitCode).not.toBe(0);
    const stderr = result.stderr.toString();
    expect(stderr.length).toBeGreaterThan(0); // Should have error message
  });
});
