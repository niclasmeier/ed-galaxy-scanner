# Settlement Planner CLI

A command-line tool for ranking Elite Dangerous settlement candidates.

## Run via bunx

```bash
bunx settlement-planner --help
bunx settlement-planner --input galaxy.json
```

## Local usage (Bun)

```bash
bun run src/cli/index.ts --help
bun run src/cli/index.ts --input galaxy.json
```

## Using bunx vs. local installation

- **bunx**: Zero-install execution for one-off runs or CI.
- **Local**: Faster iteration when developing locally.

## Troubleshooting

- **Command not found: bunx** → Install Bun from https://bun.sh
- **Permission denied** → Run `chmod +x src/cli/index.ts`

## Notes

Bun is required to run the CLI. The bin entry points to `src/cli/index.ts` and uses a Bun shebang.

## Release process

1. Bump version in `package.json` following SemVer.
2. Create a GitHub release tag (e.g., `v0.1.1`).
3. Ensure `NPM_TOKEN` is set in repository secrets for the publish workflow.
4. The publish workflow runs `bun test` and publishes to npm.
