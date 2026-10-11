# Specs

One file per change, named `YYYY-MM-DD-<short-name>.md`. Copy `TEMPLATE.md` to start a new one.

To run a spec in Claude Code:

    Read docs/specs/<file>.md and follow the workflow in CLAUDE.md.
    Start with exploration and stop for my review before proposing a plan.

When a spec is finished, its status is set to `done` and an Outcome section is added. Finished specs stay here as detailed notes and as context for later work. The release log itself is `CHANGELOG.md` in the repository root: one short entry per sync to `main`, linking to the spec where there is one.
