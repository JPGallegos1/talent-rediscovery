# Related PR Context Rule

When creating a pull request that is not directly tied to an issue, include the surrounding context in the PR body instead of presenting it as isolated work.

Default workflow:

- Add a `Related context` section to the PR body.
- Reference prior PRs, issues, ADRs, or design notes only when they are actually relevant to the change.
- State in one line why the PR is related to that prior context.
- If the change is intentionally standalone, say `Related context: None`.
- Do not invent relationships or link unrelated tickets just to fill the section.

Use this rule especially for follow-up fixes, review-driven patches, and branch work that depends on earlier product or design decisions.
