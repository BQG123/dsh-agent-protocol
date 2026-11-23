# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-11-22

Behaviour change: the injected text is different for every existing install. The
goal of this release is less friction — fewer forced questions, less visible ceremony.

### Added

- `preset`: `lite` | `standard` | `strict`. A preset sets the section switches; an
  explicit switch still overrides it. `strict` applies strict mode to every
  non-trivial task.
- `researchClarify` switch (default on): the research-work trigger is now separate
  from the other clarification triggers and no longer re-asks what the user specified.
- `extraRules`: deployment-specific rules appended as a final section.
- Settings page (sidebar entry "Work protocol", also a Settings section): preset,
  language, per-section switches, per-section prompt editing with restore, extra
  rules, and a live preview with character and estimated token counts. Saving applies
  to every session from its next model request, without a restart.
- `sectionText`: per-section body overrides (the page edits these). Page edits are
  stored in `$DSH_HOME/agent-protocol/overrides.json` as a layer over the row config.
- "Cannot reach the user" rule: subagents, background and scheduled runs proceed on
  `[Assumption]`s instead of asking or stalling.
- Exported `Config` schema (schemastery, optional peer) for the settings UI.
- Test suite (`npm test`, `node --test`) and a GitHub Actions workflow.

### Changed

- Task line once per task: on the first reply only, not on follow-ups, not after the
  user answers a question, and not on the final delivery.
- A loaded skill is announced with its own `[Skill]` line in the reply that loads it,
  instead of being appended to a task line that was already written.
- Clarification: vague wording triggers a question only when context cannot resolve
  it; reversible, cheap-to-fix ambiguity proceeds on an `[Assumption]`; "just do it"
  stops further questions; questions go through the host's question tool when present.
  A history guard comes first: anything already asked and answered (including the
  question tool's result) is confirmed, at most one round of questions per task.
  The "rework cost" trigger is folded into the "several interpretations" trigger.
- Strict mode is its own section; file threshold raised from ≥3 to about ≥5 files;
  no constraint list when it is not triggered.
- Delivery self-check is silent outside strict mode and gains the sixth question the
  docs already promised (verified rather than assumed).
- Replies follow the user's language in both `zh` and `en` texts (the `zh` text used
  to force Chinese); "use tables" became "use a table when comparing or enumerating".
- The protocol states that an explicit user instruction overrides it.
- Sections are numbered consecutively whatever is switched off.
- English task line length is no longer "15–40 words" (twice the Chinese length).
- The banner shows the preset; the version is read from `package.json`.
- `cordis.patch.yml` lists `language`, `preset`, `sectionOrder`, `extraRules` only, so
  the preset decides the switches. Existing rows with explicit switches keep working.

### Fixed

- `refine` was documented but missing from the defaults and the bundle patch.
- With `refine: false`, the strict-mode bullet was left dangling under section 0.
- With `taskLine: false`, `[Assumption]` was referenced but never defined.
- String switch values such as `"false"` were treated as enabled.
- `{{…}}` in user-supplied rules can no longer break the host's prompt interpolation.

## [0.1.0] - 2026-11-19

### Added

- Bundle `dsh-agent-protocol` that injects one `agent-protocol` system-prompt section
  (`order: 150`) into every agent of the installing profile.
- Six protocol sections: visibility/task line, one-pass refinement, strict mode,
  capability routing, forced clarification (7 triggers), team policy, efficiency &
  safety, delivery self-check.
- Chinese and English protocol texts (`language`: `zh` | `en`).
- Per-section switches: `taskLine`, `refine`, `strictMode`, `skillRouting`,
  `clarify`, `teamPolicy`, `deliveryCheck`, plus `sectionOrder`.
- Marketplace metadata (`locale/zh.json`, `locale/en.json`), icon and preview assets.
- Documentation: `README.md`, `README.zh-CN.md`, `docs/DETAIL.md`, `docs/DETAIL.zh.md`.

[Unreleased]: https://github.com/BQG123/dsh-agent-protocol/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/BQG123/dsh-agent-protocol/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/BQG123/dsh-agent-protocol/releases/tag/v0.1.0
