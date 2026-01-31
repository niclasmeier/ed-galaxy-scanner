import { describe, expect, test } from "bun:test";

const fixturePath = "tests/integration/fixtures/galaxy.fixture.jsonl";

describe("CLI verbose output", () => {
  test("prints live stats during read", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--use-quadrants",
        "all",
        "--format",
        "json",
        "--verbose",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    expect(result.exitCode).toBe(0);
    const stderr = result.stderr.toString();
    expect(stderr).toContain("Reading systems=");
    expect(stderr).toContain("populated=");
    expect(stderr).toContain("discarded_quadrants=");
    expect(stderr).toContain("discarded_other=");
    expect(stderr).toMatch(/Reading systems=\d{1,3}(,\d{3})*/);
  });
});
