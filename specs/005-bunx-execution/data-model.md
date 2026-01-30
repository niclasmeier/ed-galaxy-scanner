# Data Model: Bunx Execution Support

## Entities

### PackageMetadata
Represents npm package metadata required for bunx execution.

| Field | Type | Required | Notes |
|---|---|---|---|
| name | string | نعم | npm package name (e.g., `settlement-planner`) |
| version | string | نعم | SemVer version (e.g., `1.0.0`) |
| description | string | نعم | Short description for registry |
| bin | Record<string, string> | نعم | Command name → entry path (e.g., `settlement-planner` → `./src/cli/index.ts`) |
| main | string | optional | Only if a main entry is needed; not required for bunx |
| scripts | Record<string, string> | optional | Build/test/postinstall scripts |

### BinEntry
Executable mapping used by bunx.

| Field | Type | Required | Notes |
|---|---|---|---|
| command | string | نعم | The CLI command name (`settlement-planner`) |
| path | string | نعم | Path to entry file (TypeScript or compiled JS) |
| shebang | string | نعم | `#!/usr/bin/env bun` |
| executable | boolean | نعم | Must be executable on Unix-like systems |

### ExecutionEnvironment
Describes the runtime environment for bunx.

| Field | Type | Required | Notes |
|---|---|---|---|
| runtime | string | نعم | `bun` (current stable) |
| platform | string | optional | macOS/Linux/Windows |
| bunxInvocation | string | نعم | `bunx <package-name>` or `bunx github.com/owner/repo` |

### DistributionChannel
Where the package is executed from.

| Field | Type | Required | Notes |
|---|---|---|---|
| type | enum | نعم | `npm` or `github` |
| reference | string | نعم | npm package name or GitHub URL |
| versionTag | string | optional | npm version or GitHub ref (e.g., `@main`) |

## Validation Rules

- `bin` must include `settlement-planner` pointing to a valid entry path.
- Entry point must include `#!/usr/bin/env bun` as the first line.
- Entry point must be executable (`0755`) on macOS/Linux.
- `runtime` must be `bun` for bunx execution.
