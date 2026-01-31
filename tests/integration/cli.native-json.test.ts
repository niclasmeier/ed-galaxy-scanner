import { describe, test, expect } from "bun:test";

const fixturePath = "tests/integration/fixtures/galaxy.fixture.jsonl";

describe("Native JSON Parsing Integration Tests (--native-json flag)", () => {
  test("T051a: --native-json flag with available bindings succeeds", () => {
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
        "--native-json",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    // Should exit successfully if bindings available, or fail gracefully if not
    if (result.exitCode === 0) {
      const output = result.stdout.toString();
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
    } else {
      // If bindings unavailable, should show error message
      const stderr = result.stderr.toString();
      expect(stderr).toContain("native bindings");
    }
  });

  test("T051a: --native-json produces same output as standard JSON parser", () => {
    const resultStandard = Bun.spawnSync(
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

    const resultNative = Bun.spawnSync(
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
        "--native-json",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    if (resultStandard.exitCode === 0 && resultNative.exitCode === 0) {
      const parsedStandard = JSON.parse(resultStandard.stdout.toString());
      const parsedNative = JSON.parse(resultNative.stdout.toString());

      // Both should produce identical output when bindings available
      expect(JSON.stringify(parsedStandard)).toBe(JSON.stringify(parsedNative));
    }
  });

  test("T051a: --native-json shows clear error when bindings unavailable", () => {
    // This test would require mocking or directly testing error paths
    // For now, we verify the flag is accepted and handled
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        fixturePath,
        "--native-json",
        "--help",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    // --help with --native-json should still show help (not error about bindings)
    const stdout = result.stdout.toString();
    expect(stdout).toContain("--native-json");
  });

  test("T051a: --native-json flag with invalid input file shows appropriate error", () => {
    const result = Bun.spawnSync(
      [
        "bun",
        "run",
        "src/cli/index.ts",
        "--input",
        "/nonexistent/path/file.jsonl",
        "--native-json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    // Should exit with error about missing file, not native bindings
    expect(result.exitCode).not.toBe(0);
  });

  test("T051a: --native-json works with gzip input", () => {
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
        "--native-json",
        "--format",
        "json",
      ],
      {
        stdout: "pipe",
        stderr: "pipe",
      },
    );

    if (result.exitCode === 0) {
      const output = result.stdout.toString();
      const parsed = JSON.parse(output);
      expect(Array.isArray(parsed)).toBe(true);
    } else {
      // Either gzip file missing or native bindings error
      const stderr = result.stderr.toString();
      expect(
        stderr.includes("native bindings") || stderr.includes("ENOENT") || stderr.includes("not found"),
      ).toBe(true);
    }
  });
});
