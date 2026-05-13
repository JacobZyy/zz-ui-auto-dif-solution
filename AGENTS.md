# ui_diff_plugins Development Guide

## Scope

- This file applies to the whole repository.
- Default agent behavior for this repository:
  - Always use the external `$pua` skill at `/Users/jacobzha/.agents/skills/pua/SKILL.md` for every task and every conversation in this repo.
  - When a task edits `doc/自动化走查工具-部门分享沉淀版.md`, automatically also use the repo-local skill `.codex/skills/ui-diff-share-sync/SKILL.md`.
- Use it together with the nearest task-specific knowledge entry:
  - repository architecture: `doc/repo-architecture.md`
  - repository coding style: `.codex/skills/ui-differ-coding-style/SKILL.md`
  - Chrome host guidance: `.codex/skills/chrome-extension-dev/SKILL.md`
  - MasterGo host guidance: `.codex/skills/mastergo-plugin-dev/SKILL.md`
  - Slidev share development: `.codex/skills/slidev-share-dev/SKILL.md`
  - share doc / Slidev sync guidance: `.codex/skills/ui-diff-share-sync/SKILL.md`

## Knowledge Source Priority

- Prefer current code and config over generated documentation or old share materials.
- Treat most of `doc/` as mixed-quality background material unless a file is explicitly maintained as current architecture context, such as `doc/repo-architecture.md`. Cross-check implementation details against actual files under `packages/`, `scripts/`, and root config.
- If a document conflicts with code, follow code and update the knowledge sink instead of following the stale document.

## Repository Shape

- This repository is a `pnpm workspace` monorepo rooted at `packages/*`.
- Stable layering is:
  1. `@ui-differ/core`: normalization, matching, diff, shared models
  2. `@ui-differ/connection-tools`: upload/auth/reporting and other external integrations
  3. host packages such as `plugin-chrome`, `plugin-master-go`, and `web-tester`
- Do not treat host packages as independent algorithm systems. Their main job is to adapt host runtime events, message bridges, and UI shells to the shared core pipeline.

## Working Rules

- Read the full chain before editing a local function:
  - entry point
  - message flow
  - data flow
  - side effects
- Prefer extending existing processing chains over introducing a new abstraction layer.
- Keep core domain types explicit. `NodeInfo`, diff results, message payloads, and config stores are first-class concepts in this repo.
- Reuse existing handlers, utils, stores, and barrel exports before creating new modules.
- Keep boundary compromises at the boundary. Browser APIs, plugin host APIs, and weakly typed message payloads should not leak deep into core modules.

## Package-Specific Expectations

- Changes under `packages/ui-differ-core` should preserve the stage-based processing model.
- Changes under `packages/plugin-chrome` must verify the full bridge when relevant:
  - content script
  - background/service worker
  - devtools or popup/sidepanel if involved
- Changes under `packages/plugin-master-go` must verify both sides when relevant:
  - `lib/` main-thread runtime
  - `ui/` iframe UI
  - message contract in `messages/`
- Changes under `packages/slidev-ui-diff-share` should keep the deck as a first-class workspace package, with `slides.md` as entry, chapter content under `pages/`, deck-level config under `setup/`/`styles/`, and no nested generated package root.
- Changes under `packages/slidev-ui-diff-share` should also follow these share-structure defaults:
  - The deck title should default to `转转自动化ui走查工具分享`.
  - The deck must include a dedicated cover slide and a dedicated agenda slide.
  - The agenda slide should list only the top-level chapters of the share.
  - Each top-level chapter should start with its own standalone section-title slide.
  - With the current `light-icons` theme, do not assume a theme-provided `cover` layout exists. The locally installed theme package currently documents `intro` and `image-header-intro` as the preferred cover-style layouts, so prefer one of those for the cover slide.
- Changes that affect reporting, upload, or external persistence should also inspect `packages/connection-tools`.

## Documentation Deposition Rules

- Put durable, cross-repo rules in this `AGENTS.md`.
- Put verifiable repository context in `doc/repo-architecture.md`.
- Put host-platform and share-workflow operational knowledge in `.agent/skills/`.
- Do not promote a share document into a hard rule unless the behavior is confirmed by current code.
- When you discover a stable new rule, update the smallest correct knowledge sink instead of adding duplicate guidance in multiple places.

## Validation Expectations

- For code changes, validate not only the direct file but also adjacent stages and upstream/downstream message bridges.
- For Chrome-related changes, check manifest entrypoints, background/content/devtools routing, and any host permission implications.
- For MasterGo-related changes, check `mg` main-thread behavior, UI messaging, and any selection/export side effects.
- For architecture or documentation changes, keep statements conservative and tie them back to current code or config.
