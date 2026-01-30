# Research: Bunx Execution Support

**Date**: 2026-01-30  
**Input**: Feature spec for bunx execution support  
**Goal**: Resolve runtime, packaging, and execution details for bunx compatibility.

## Decisions

### Runtime & Shebang
- **Decision**: Use Bun (current stable) as the runtime for bunx execution and add `#!/usr/bin/env bun` to the CLI entry point.
- **Rationale**: Aligns with the project constitution and existing Bun-based scripts; bunx executes packages with Bun, so this is the most direct path.
- **Alternatives considered**:
  - Use `#!/usr/bin/env node` and require Node.js LTS (conflicts with constitution).
  - Provide dual entry points for Bun and Node (adds complexity without clear benefit).

### Entry Point & Bin Mapping
- **Decision**: Point `package.json` `bin` to `./src/cli/index.ts` and run TypeScript directly with Bun.
- **Rationale**: The project already uses Bun to run TypeScript directly; avoids a mandatory build step and keeps distribution simple.
- **Alternatives considered**:
  - Compile to `dist/cli/index.js` and point `bin` to compiled output (adds build step and tooling).
  - Bundle into a single file (not required for bunx use case).

### Build Step
- **Decision**: Treat compilation as optional; if a build is introduced later, it must preserve the shebang and executable bit.
- **Rationale**: Bun can execute TypeScript without compilation, reducing setup and failure points.
- **Alternatives considered**:
  - Require `tsc` build before publish (more setup, no immediate benefit).

### Executable Permissions
- **Decision**: Enforce executable permissions via `postinstall` (or a build step if added).
- **Rationale**: Ensures `bin` is runnable on macOS/Linux; avoids “permission denied” issues.
- **Alternatives considered**:
  - Rely on repo file permissions alone (fragile across environments).

### Distribution Channels
- **Decision**: Support npm as the primary distribution and GitHub as an optional alternative for testing.
- **Rationale**: npm provides discoverability and predictable installs; GitHub is useful for pre-release testing.
- **Alternatives considered**:
  - GitHub-only distribution (less discoverable, more friction for users).

### stdin/stdout Piping
- **Decision**: Keep stdin/stdout behavior identical across direct execution and bunx.
- **Rationale**: CLI already supports piping; bunx should remain transparent to users.
- **Alternatives considered**:
  - Separate “bunx mode” behavior (unnecessary and confusing).

## Open Questions Resolved

- **Runtime mismatch**: Resolved in favor of Bun to satisfy the constitution and current project setup.
- **Build requirement**: Optional; direct TS execution preferred.
- **Distribution requirement**: npm primary, GitHub optional.

Bunx execution support is straightforward to implement using standard npm conventions. The key requirements are:

1. Bun shebang in the CLI entry point
2. Correct `"bin"` field in package.json
3. Executable permissions
4. Publishing to npm (optional, GitHub fallback)

No runtime changes required beyond Bun compatibility. Bunx acts as a convenient distribution and execution layer over Bun.

