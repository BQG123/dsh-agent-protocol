# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/BQG123/dsh-agent-protocol/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/BQG123/dsh-agent-protocol/releases/tag/v0.1.0
