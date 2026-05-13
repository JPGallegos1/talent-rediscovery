# Session Skill Source Rule

Agents working in this project must use only project-local skills from `.agents/skills/*`.

Superpowers skills are restricted to the following capabilities only, which are the sole ones required by this project:

- `subagent-driven-development`
- `executing-plans`
- `finishing-a-development-branch`
- `verification-before-completion`
- `writing-plans`

Do not install, load, or execute any Superpowers skill outside this list, nor any global user-level skills.

If a workflow needs a skill, first check whether the corresponding project-local skill exists under `.agents/skills/`. If it does not exist there, ask before proceeding.
