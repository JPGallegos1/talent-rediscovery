# Blocked Issue Stacking Rule

When a GitHub Issue brief contains `Blocked by`, do not treat it as an independent implementation on top of `main`.

Default workflow:

- Implement the blocking issue first on its own branch.
- If the blocked issue must proceed before the blocker is merged, base it on the blocking issue branch and create a stacked PR.
- If the blocked issue can be partially prepared without the blocker, limit the work to compatible pure modules, checks, or documentation.
- Do not invent temporary domain models, fake UI hooks, or placeholder integration paths that will be replaced by the blocker.
- If the blocked issue requires unavailable behavior from the blocker and cannot be safely prepared, stop and report the blocker.

Before dispatching agents in parallel, classify each `ready-for-agent` issue as one of:

- `independent`: can branch from `main`.
- `stacked`: must branch from another issue branch.
- `preparatory-only`: may add isolated modules/checks, but no dependent UI wiring.
- `blocked`: should not be implemented yet.

For stacked work, the PR body must say which PR or branch it is stacked on.
