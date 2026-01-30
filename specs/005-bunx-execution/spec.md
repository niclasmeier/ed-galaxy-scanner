# Feature Specification: Bunx Execution Support

**Feature Branch**: `005-bunx-execution`  
**Created**: 2026-01-30  
**Status**: Draft  
**Input**: User request: "Enable execution of the settlement planner CLI via `bunx` as a convenient distribution and execution mechanism."

## Overview

Enable users to execute the settlement planner CLI directly via `bunx` without installing the package locally. This allows one-off runs from anywhere via `bunx settlement-planner` or from a GitHub repository.

## Context

Currently, the settlement planner requires local installation/setup. The `bunx` tool (Bun's equivalent to `npx`) allows direct execution of binaries published to npm or in GitHub repositories, improving accessibility and friction-free usage.

## User Scenarios & Testing

### User Story 1 - Execute via bunx from npm (Priority: P1)

As a player, I want to run the settlement planner without local installation by typing `bunx settlement-planner` so I can use it immediately for one-off analysis.

**Acceptance Scenarios**:

1. **Given** the package is published to npm, **When** I run `bunx settlement-planner --input galaxy.json`, **Then** the tool executes and returns results.
2. **Given** I run the tool via bunx, **When** I provide `--help`, **Then** the CLI help text is displayed.
3. **Given** an invalid input, **When** I run via bunx, **Then** errors are properly reported to stderr.

---

### User Story 2 - Execute via GitHub repository (Priority: P2)

As a developer, I want to run the settlement planner directly from the GitHub repository via `bunx github.com/owner/repo` so I can test the latest version without npm publication.

**Acceptance Scenarios**:

1. **Given** the repository has a valid `bin` field in package.json, **When** I run `bunx github.com/owner/settlement-planner`, **Then** the tool executes correctly.
2. **Given** a branch is specified (e.g., `main`), **When** I run `bunx github.com/owner/settlement-planner@main`, **Then** that branch version is used.

---

### User Story 3 - Preserve all CLI functionality (Priority: P1)

As a user, I want all CLI features to work identically via bunx as they do when run directly so that the distribution method is transparent.

**Acceptance Scenarios**:

1. **Given** the tool runs via bunx, **When** I use all CLI flags (`--input`, `--scoring`, `--sort`, `--verbose`, etc.), **Then** they work as documented.
2. **Given** stdin/stdout piping, **When** I use bunx, **Then** piping works correctly.

---

## Functional Requirements

### FR-001: Package Metadata
The `package.json` MUST include:
- `"bin"` field specifying the CLI entry point (e.g., `"settlement-planner": "./src/cli/index.ts"`)
- `"name"` field matching the npm package name (e.g., `"settlement-planner"`)
- `"version"` field for version tracking
- `"description"` field for clarity

### FR-002: CLI Entry Point Shebang
The CLI entry point (`src/cli/index.ts` or compiled output) MUST include a shebang line:
```javascript
#!/usr/bin/env bun
```
This allows the script to be executed directly as a binary via Bun.

### FR-003: Executable Permissions
The entry point MUST have executable permissions (mode `0755`) after packaging.

### FR-004: Build Process (if used)
If a build/compilation step is used, it MUST:
- Preserve the shebang in the compiled output
- Ensure the entry point is executable

### FR-005: Bun Compatibility
The CLI MUST be executable on Bun (current stable) when invoked via bunx, with all dependencies properly resolved.

### FR-006: Help Text & Documentation
The CLI help text (`--help`) MUST:
- Be accessible and display correctly when run via bunx
- Document all supported flags and options
- Include usage examples
- Reference npm package name for ease of discovery

### FR-007: Error Handling
When errors occur:
- Exit codes MUST be non-zero for failures (consistent with direct execution)
- Error messages MUST be printed to stderr
- User-friendly messages MUST guide troubleshooting

### FR-008: Environment Compatibility
The tool MUST work correctly when invoked via:
- `bunx <package-name>`
- `bunx github.com/owner/repo`
- `bunx github.com/owner/repo@branch`

### FR-009: stdin/stdout Piping
The tool MUST:
- Support piping input via stdin (if applicable)
- Support piping output to other commands via stdout
- Preserve output formatting for JSON and text modes

## Key Entities

### Package Metadata
```json
{
  "name": "settlement-planner",
  "version": "1.0.0",
  "description": "Elite Dangerous settlement ranking CLI",
  "bin": {
    "settlement-planner": "./src/cli/index.ts"
  }
}
```

### Build Artifacts
- **Source**: `src/cli/index.ts`
- **Compiled (optional)**: `dist/cli/index.js` (with shebang)
- **Entry Point**: Executable Bun script

## Assumptions

1. The package will be published to npm or accessible via GitHub
2. The build process (if used) is part of the CI/CD pipeline
3. Bun (current stable) is available on users' systems (bunx handles runtime)

## Dependencies

- Bun (current stable) for bunx execution environment
- TypeScript compiler (only if building a compiled output)

## Testing Strategy

### Unit Tests
- Verify shebang presence in compiled output
- Verify build process preserves executable flag

### Integration Tests
- Test execution via `bunx` (requires local npm registry or GitHub access)
- Test all CLI flags work via bunx
- Test stdin/stdout piping via bunx
- Test error handling and exit codes via bunx

### Manual Testing
- `bunx settlement-planner --help`
- `bunx settlement-planner --input galaxy.json`
- `bunx settlement-planner --input galaxy.json --format json | jq .`
- `echo '{"systems":[...]}' | bunx settlement-planner --format json`

## Success Criteria

### Measurable Outcomes

- **SC-001**: Users can execute `bunx settlement-planner` without error after package publication
- **SC-002**: All CLI features work identically via bunx as when run directly
- **SC-003**: Help text is accessible and informative
- **SC-004**: Error handling and exit codes are consistent
- **SC-005**: The tool can be distributed and invoked via `bunx` from npm or GitHub

## Edge Cases

- User runs bunx on a system without Bun installed (bunx should provide clear error)
- User specifies an invalid package name (npm registry provides clear error)
- Build process fails to mark entry point as executable (manual fix or CI error)
- stdin is not a TTY (tool should handle gracefully, not prompt interactively)

## Clarifications

### Session 2026-01-30

**Q: Should we publish to npm or just support GitHub execution?**
- A: Support both; GitHub as testing path, npm for production distribution (priority: npm)

**Q: How does this interact with the Bun runtime decision?**
- A: Compatible; bunx executes the CLI with Bun, matching the project runtime

**Q: Do we need a wrapper script or symlink?**
- A: No; the shebang in the entry point is sufficient

---

## Notes

This feature treats bunx as a distribution mechanism; the runtime remains Bun (current stable). Users can still use `bun run` directly if desired.
