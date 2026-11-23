# dsh-agent-protocol

**One work protocol, injected into the system prompt of every agent in your DSH profile.**

[![npm version](https://img.shields.io/npm/v/dsh-agent-protocol.svg)](https://www.npmjs.com/package/dsh-agent-protocol)
[![license](https://img.shields.io/npm/l/dsh-agent-protocol.svg)](LICENSE)
![DSH](https://img.shields.io/badge/DSH-0.2.x-informational)

Agents drift. One session opens with a crisp task line, the next dumps raw output;
one asks before touching a config file, the next overwrites it. This plugin removes
that variance by giving every agent in the profile the *same* written protocol:
what to show first, how to compress a vague request, when to load a skill, when to
ask instead of guessing, and what to check before saying "done".

It is text-only: one system-prompt section, no tools, no files written, no network.

## What it injects

| § | Section | Effect |
|---|---------|--------|
| 0 | Visibility | Every substantive reply starts with a visible task line (15–40 chars), plus skill / assumption markers when relevant |
| 1 | Refine once | Colloquial requests are compressed into one task statement that becomes the execution instruction — no second rewrite |
| 1 | Strict mode | ≥3 constraints, ≥3 files / ≥2 subsystems, irreversible work, >10 min, or an explicit "be rigorous" → constraints table + per-item acceptance + item-by-item self-check at delivery |
| 2 | Capability routing | Requests are matched semantically against available skills and tools, loaded before acting, and chained when useful |
| 3 | Ask before acting | Seven concrete triggers force 1–3 questions with options and a recommendation; anything answerable by reading files or the environment must not be asked |
| 4 | Team | Teams only for genuinely complex work (≥4 steps, parallel subtasks, research→build→verify, long runtime, explicit request) |
| 5 | Efficiency & safety | Parallelize independent work, back up before destructive edits, search before reading large files, conclusion first, tables over prose |
| 6 | Delivery self-check | Declared skills == loaded skills, acceptance met, artifact paths given, rollback stated |

## Install

**From the plugin market** (Discover → search "work protocol"). The bundle adds one
host row named `agent-protocol`; no profile files are edited.

**From a local directory** (development):

1. Settings → Plugins → Add plugin → pick this directory, or
2. Agent-side: `plugin_manager` `install_bundle` with this directory as `target`.

**From npm:** add `dsh-agent-protocol` as a dependency of the profile and list it
under `dsh.profile.bundles` in that profile's `package.json` — exactly what the
plugin manager does for you.

## Configure

All switches live on the `agent-protocol` row in **Settings → Plugins** (or your
profile patch) and take effect without reinstalling.

| Key | Default | Meaning |
|-----|---------|---------|
| `language` | `zh` | `zh` or `en` — the language of the injected protocol text |
| `sectionOrder` | `150` | Position of the section in the system prompt (any finite number) |
| `taskLine` | `true` | Visible task line at the top of each reply |
| `refine` | `true` | One-pass request refinement |
| `strictMode` | `true` | Strict-mode triggers and the constraints/acceptance table |
| `skillRouting` | `true` | Semantic capability routing |
| `clarify` | `true` | Forced clarification with the seven triggers |
| `teamPolicy` | `true` | Team only for complex work |
| `deliveryCheck` | `true` | Delivery self-check |

Section 5 (efficiency & safety) is always present — it is the floor, not an option.

## How it works

`lib/index.js` exports a Cordis plugin. On apply it registers exactly one system
prompt section:

    ctx.systemPrompt.section({
      name: 'agent-protocol',
      order: sectionOrder,      // default 150
      interpolate: false,
      text: buildText(options),
    })

`buildText` picks the Chinese or English template, drops the blocks whose switch is
`false`, and appends a version banner. There is no state, no storage, and no hook
into tool execution: removing the bundle removes the text.

## Scope, limits, privacy

- **Guidance, not a gate.** This is model instruction text. A model can still
  deviate; the plugin does not block tool calls or validate output.
- **Profile-scoped.** Only agents in the profile that installed the bundle see it.
- **No side effects.** No writes to your profile, no network access, no telemetry.
- **Compatibility.** `engines.dsh` requires `>=0.2.2-rc.1 <0.3.0-0`; verified on
  DSH 0.2.2-rc.5.

## Development

    git clone <this repo>
    # link it into a profile, or use Settings → Plugins → Add plugin

Edit `lib/index.js`, then start a **new session** — the injected text is built at
apply time, so an existing session keeps the old generation until it restarts.

Chinese documentation: [README.zh-CN.md](README.zh-CN.md).

## License

MIT — see [LICENSE](LICENSE).
