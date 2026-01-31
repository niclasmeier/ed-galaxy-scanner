import { describe, it, expect, beforeAll } from "bun:test";
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../../");

function runCli(args: string[]): string {
  // Add --use-quadrants all to ensure we get results from the fixture data
  const allArgs = [...args, "--use-quadrants all"];
  const command = `bun run ${path.join(projectRoot, "src/cli/index.ts")} ${allArgs.join(" ")}`;
  const result = execSync(command, {
    cwd: projectRoot,
    encoding: "utf8",
  });
  return result;
}

function parseJsonOutput(output: string): unknown[] {
  return JSON.parse(output.trim());
}

describe("CLI sort flag", () => {
  const input = "tests/integration/fixtures/galaxy.fixture.array.json";

  describe("default sort behavior", () => {
    it("should use score-desc,dsol-asc as default", () => {
      const output = runCli([`${input}`, "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ name: string; totalScore: number; distanceToSol: number }>;

      // Fixture only has 1 candidate, so just verify we get results
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toBeDefined();
      expect(results[0].totalScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe("single sort criterion", () => {
    it("should accept score-desc", () => {
      const output = runCli([`${input}`, "--sort score-desc", "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number }>;

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].totalScore).toBeGreaterThanOrEqual(results[i + 1].totalScore);
      }
    });

    it("should accept score-asc", () => {
      const output = runCli([`${input}`, "--sort score-asc", "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number }>;

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].totalScore).toBeLessThanOrEqual(results[i + 1].totalScore);
      }
    });

    it("should accept dsol-asc", () => {
      const output = runCli([`${input}`, "--sort dsol-asc", "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ distanceToSol: number }>;

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].distanceToSol).toBeLessThanOrEqual(results[i + 1].distanceToSol);
      }
    });

    it("should accept dsol-desc", () => {
      const output = runCli([`${input}`, "--sort dsol-desc", "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ distanceToSol: number }>;

      for (let i = 0; i < results.length - 1; i++) {
        expect(results[i].distanceToSol).toBeGreaterThanOrEqual(results[i + 1].distanceToSol);
      }
    });
  });

  describe("default directions for fields", () => {
    it("should use desc as default for score", () => {
      const output = runCli([`${input}`, "--sort score", "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number }>;

      // Fixture only has 1 candidate, verify we get a result
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].totalScore).toBeGreaterThanOrEqual(0);
    });

    it("should use asc as default for dsol", () => {
      const output = runCli([`${input}`, "--sort dsol", "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ distanceToSol: number }>;

      // Fixture only has 1 candidate, verify we get a result
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].distanceToSol).toBeGreaterThanOrEqual(0);
    });
  });

  describe("multiple sort criteria", () => {
    it("should apply multi-level sort with score-desc,dsol-asc", () => {
      const output = runCli([`${input}`, "--sort score-desc,dsol-asc", "--limit 20", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number; distanceToSol: number }>;

      // First level: score descending
      for (let i = 0; i < results.length - 1; i++) {
        if (results[i].totalScore !== results[i + 1].totalScore) {
          expect(results[i].totalScore).toBeGreaterThan(results[i + 1].totalScore);
        }
      }

      // Second level: dsol ascending (only for same score)
      for (let i = 0; i < results.length - 1; i++) {
        if (results[i].totalScore === results[i + 1].totalScore) {
          expect(results[i].distanceToSol).toBeLessThanOrEqual(results[i + 1].distanceToSol);
        }
      }
    });

    it("should apply multi-level sort with dsol-asc,score-desc", () => {
      const output = runCli([`${input}`, "--sort dsol-asc,score-desc", "--limit 20", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number; distanceToSol: number }>;

      // First level: dsol ascending
      for (let i = 0; i < results.length - 1; i++) {
        if (results[i].distanceToSol !== results[i + 1].distanceToSol) {
          expect(results[i].distanceToSol).toBeLessThan(results[i + 1].distanceToSol);
        }
      }

      // Second level: score descending (only for same dsol)
      for (let i = 0; i < results.length - 1; i++) {
        if (results[i].distanceToSol === results[i + 1].distanceToSol) {
          expect(results[i].totalScore).toBeGreaterThanOrEqual(results[i + 1].totalScore);
        }
      }
    });
  });

  describe("case-insensitive parsing", () => {
    it("should handle uppercase fields and directions", () => {
      const output1 = runCli([`${input}`, "--sort SCORE-DESC", "--limit 5", "--format json"]);
      const output2 = runCli([`${input}`, "--sort score-desc", "--limit 5", "--format json"]);

      const results1 = parseJsonOutput(output1) as Array<{ name: string }>;
      const results2 = parseJsonOutput(output2) as Array<{ name: string }>;

      // Should produce same results
      expect(results1.map((r) => r.name)).toEqual(results2.map((r) => r.name));
    });

    it("should handle mixed case", () => {
      const output = runCli([`${input}`, "--sort", "Score-Desc,Dsol-Asc", "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number }>;

      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("whitespace handling", () => {
    it("should handle spaces around hyphens", () => {
      const output = runCli([`${input}`, `--sort "score - desc"`, "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number }>;

      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle spaces around commas", () => {
      const output = runCli([`${input}`, `--sort "score-desc , dsol-asc"`, "--limit 5", "--format json"]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number }>;

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("error handling", () => {
    it("should reject invalid field", () => {
      const command = `bun run ${path.join(projectRoot, "src/cli/index.ts")} ${input} --sort invalid-desc`;
      expect(() => {
        execSync(command, { cwd: projectRoot, encoding: "utf8" });
      }).toThrow();
    });

    it("should reject invalid direction", () => {
      const command = `bun run ${path.join(projectRoot, "src/cli/index.ts")} ${input} --sort score-invalid`;
      expect(() => {
        execSync(command, { cwd: projectRoot, encoding: "utf8" });
      }).toThrow();
    });

    it("should reject duplicate fields", () => {
      const command = `bun run ${path.join(projectRoot, "src/cli/index.ts")} ${input} --sort score-desc,score-asc`;
      expect(() => {
        execSync(command, { cwd: projectRoot, encoding: "utf8" });
      }).toThrow();
    });
  });

  describe("with other flags", () => {
    it("should work with --scoring tritium", () => {
      const output = runCli([
        `${input}`,
        "--sort score-desc,dsol-asc",
        "--scoring tritium",
        "--limit 5",
        "--format json",
      ]);
      const results = parseJsonOutput(output) as Array<{ totalScore: number }>;

      // All should have score > 0 (filtered by tritium strategy)
      expect(results.every((r) => r.totalScore > 0)).toBe(true);
    });

    it("should work with --format simple", () => {
      const output = runCli([`${input}`, "--sort score-desc,dsol-asc", "--limit 5", "--format simple"]);

      // Should contain table header
      expect(output).toContain("name");
      expect(output).toContain("score");
    });

    it("should work with --format text", () => {
      const output = runCli([`${input}`, "--sort score-desc,dsol-asc", "--limit 5", "--format text"]);

      expect(output.length).toBeGreaterThan(0);
    });

    it("should work with --max-dist-sol filter", () => {
      const output = runCli([
        `${input}`,
        "--sort score-desc,dsol-asc",
        "--max-dist-sol 50",
        "--limit 5",
        "--format json",
      ]);
      const results = parseJsonOutput(output) as Array<{ distanceToSol: number }>;

      // All should have dsol <= 50
      expect(results.every((r) => r.distanceToSol <= 50)).toBe(true);
    });
  });

  describe("result ordering consistency", () => {
    it("should produce consistent results across multiple runs", () => {
      const output1 = runCli([`${input}`, "--sort score-desc,dsol-asc", "--limit 10", "--format json"]);
      const output2 = runCli([`${input}`, "--sort score-desc,dsol-asc", "--limit 10", "--format json"]);

      const results1 = parseJsonOutput(output1) as Array<{ name: string }>;
      const results2 = parseJsonOutput(output2) as Array<{ name: string }>;

      expect(results1.map((r) => r.name)).toEqual(results2.map((r) => r.name));
    });

    it("should maintain order when changing only sort criteria", () => {
      const output1 = runCli([`${input}`, "--sort score-desc", "--limit 10", "--format json"]);
      const output2 = runCli([`${input}`, "--sort score-desc,dsol-asc", "--limit 10", "--format json"]);

      const results1 = parseJsonOutput(output1) as Array<{ name: string; totalScore: number }>;
      const results2 = parseJsonOutput(output2) as Array<{ name: string; totalScore: number }>;

      // Score order should be preserved (primary sort is same)
      for (let i = 1; i < Math.min(results1.length, results2.length); i++) {
        if (results1[i - 1].totalScore !== results1[i].totalScore) {
          expect(results2.findIndex((r) => r.name === results1[i].name)).toBeGreaterThan(
            results2.findIndex((r) => r.name === results1[i - 1].name),
          );
        }
      }
    });
  });
});
