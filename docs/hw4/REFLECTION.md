# HW4 Reflection — Claude Code Workflow & TDD

*Xinlai Chen · Team 10 · TipFair*

## How Explore → Plan → Implement → Commit compared to my previous approach

Before this assignment, my usual way of using an AI assistant was to describe a feature and accept whatever code came back, then fix problems as I found them. The result usually worked, but I often didn't know which files had changed or why, and my commits mixed unrelated changes.

Splitting the work into four phases changed that. In the **Explore** phase I asked Claude Code not to write anything, only to search and read the codebase and describe what already existed. (That session had no dedicated Glob/Grep tools, so it used `find` and `grep` through Bash plus the Read tool, and told me so.) That summary showed me things I had forgotten, such as which helpers in the split engine were exported and which folders were still empty, and it meant the plan was built on the real codebase rather than on assumptions.

The **Plan** phase was the most valuable. Plan mode surfaced two decisions I hadn't thought about. First, my prompt asked for "one commit per step," but my own CLAUDE.md requires separate red and green commits for business logic; Claude noticed the conflict and asked which rule to follow. Second, it asked where each staff member's points should come from on the form. Answering those questions before any code existed was much cheaper than discovering the problem in review. The final plan also cited the Next.js 16 docs bundled with the framework, which matters because Next.js 16 changed several conventions.

During **Implement** and **Commit**, every step ended in a small, focused commit, so the git history now reads like a description of the work. Claude also reported what it couldn't do, such as the missing role check before authentication exists, instead of quietly skipping it.

The main cost is speed: a small feature takes longer when you stop to explore and plan. For anything touching money or more than one layer of the app, I think that cost is worth it.

## TDD through Claude Code

Strict TDD worked better with an AI than I expected, as long as the prompt said "write ONLY the failing tests." Claude stopped at the red step and showed that every failure came from the stub, not from a typo. In one round, four of the five new tests already passed because the existing formula handled them; only the $0-total, zero-hours case failed (it produced NaN). Claude explained why each one passed and kept them as characterization tests instead of inventing code. With a coverage report it also pointed out the one uncovered branch and two edge cases (floating-point tie-breaks and NaN input) that I will turn into issues for Project 3.

## Context-management strategies that worked best

- **CLAUDE.md with `@imports`.** Importing `docs/PRD.md` and `AGENTS.md` kept the rules (integer cents, managers excluded from the pool, TDD commits) in every session without repeating them. The Plan-mode question about red/green commits showed that the file actually shapes behavior, not just documentation.
- **`/clear` between phases.** Starting the TDD phase and the feature phase with a clean context kept earlier setup discussions from influencing the code.
- **`/compact` with a focus instruction.** Telling Claude what to keep ("the project setup decisions and the PRD rules") preserved the important parts; afterwards it re-read the PRD and could still state the split rules.
- **`claude --continue` and `claude --resume`.** These let me pick up after closing the terminal. I also learned to be careful: I once typed `claude -- continue` with a space, and Claude treated "continue" as an instruction and started writing a new helper on its own. Because nothing was committed, `git status` showed the stray files and I removed them, but it taught me to check the working tree after any unexpected session.
- **Permissions as a safety net.** Allowing tests and local commits while requiring approval for installs and pushes (and denying `.env` reads and `rm -rf`) let me work in auto mode without worrying about destructive commands.

## What I would do differently

I spent a long time on environment problems (an unsupported Node 23 release, an npm bug and peer-dependency conflicts between Vitest and its plugins). Next time I will pin a supported Node LTS version at the start and record it in CLAUDE.md, so both humans and Claude use the same toolchain.