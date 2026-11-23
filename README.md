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

It adds one system-prompt section, no tools, no network. It ships a settings page for picking the preset, switching sections, rewriting the wording and previewing the exact injected text.

## What it injects

Sections appear in this order and are numbered consecutively at build time — switch
one off and the rest renumber.

| Section | Switch | Effect |
|---------|--------|--------|
| Visibility | `taskLine` | The **first** reply to a new task starts with a `[Task]` line; follow-ups, later replies and short answers do not. Unconfirmed premises go on an `[Assumption]` line (always on) |
| Refine once | `refine` | Colloquial requests are compressed into one task statement that becomes the execution instruction — no second rewrite |
| Strict mode | `strictMode` | ≥3 constraints, ≥2 subsystems or about ≥5 files, irreversible work, >10 min, or an explicit "be rigorous" → constraint list + per-item acceptance. No list when not triggered |
| Capability routing | `skillRouting` | Requests are matched semantically against available skills and tools, loaded before acting, chained when useful |
| Ask before acting | `clarify` | Five triggers; all questions at once, at most 3, with options and a recommendation. Never ask what can be looked up, what is reversible and cheap, or after "just do it". Subagents and background runs do not ask — they proceed on `[Assumption]`s |
| └ Research confirm | `researchClarify` | Research work confirms scope, definitions and output format before starting (without re-asking what was specified) |
| Team | `teamPolicy` | Teams only for genuinely complex work |
| Efficiency & safety | always on | Parallelize independent work, back up before destructive edits, search before reading large files, reply in the user's language, conclusion first |
| Delivery self-check | `deliveryCheck` | Six silent questions; printed item by item only in strict mode |
| Additional rules | `extraRules` | Your own clauses, appended last |

The protocol opens by stating that an explicit user instruction always wins over it.

## Install

**From the plugin market** (Discover → search "work protocol"). The bundle adds one
host row named `agent-protocol`; no profile files are edited.

**From a local directory** (development):

1. Settings → Plugins → Add plugin → pick this directory, or
2. Agent-side: `plugin_manager` `install_bundle` with this directory as `target`.

**From npm:** add `dsh-agent-protocol` as a dependency of the profile and list it
under `dsh.profile.bundles` in that profile's `package.json` — exactly what the
plugin manager does for you.

## Settings page

After installing, the sidebar gains a **Work protocol** entry (the same page is also a
section in Settings). On it you can:

- switch the preset and the language of the injected text;
- flip each section — a switch you changed is marked "set explicitly", and one click
  makes it follow the preset again;
- rewrite the body of any section and the opening sentence, and restore the default;
- maintain additional rules, one per line;
- preview the full injected text live, with character and estimated token counts.

**Save & apply** makes every session use the new text from its next model request —
running sessions included, no restart. Edits are stored in
`$DSH_HOME/agent-protocol/overrides.json` and layer on top of the row config below;
**Reset everything** empties that file.

## Configure

The row config lives on the `agent-protocol` row in **Settings → Plugins** (or your
profile patch) and is the base layer under the settings page; changing it takes a restart.

| Key | Default | Meaning |
|-----|---------|---------|
| `language` | `zh` | `zh` or `en` — language of the injected text (replies always follow the user) |
| `preset` | `standard` | Preset, see below |
| `sectionOrder` | `150` | Position of the section in the system prompt (any finite number) |
| `extraRules` | `[]` | Additional rules, an array of strings |
| `sectionText` | `{}` | Per-section body overrides, keyed by `intro`, `visibility`, `refine`, `strict`, `routes`, `clarify`, `team`, `safety`, `check` |
| `taskLine` | preset | `[Task]` line on the first reply |
| `refine` | preset | One-pass request refinement |
| `strictMode` | preset | Strict mode |
| `skillRouting` | preset | Semantic capability routing |
| `clarify` | preset | Ask before acting |
| `researchClarify` | preset | Mandatory confirmation for research work (requires `clarify`) |
| `teamPolicy` | preset | Team only for complex work |
| `deliveryCheck` | preset | Delivery self-check |

### Presets

| Switch | `lite` | `standard` | `strict` |
|---|---|---|---|
| `taskLine` | off | on | on |
| `refine` | on | on | on |
| `strictMode` | off | when triggered | **every non-trivial task** |
| `skillRouting` | on | on | on |
| `clarify` | on | on | on |
| `researchClarify` | off | on | on |
| `teamPolicy` | off | on | on |
| `deliveryCheck` | off | on | on |

An explicit switch always overrides the preset:

    config:
      preset: standard
      taskLine: false
      extraRules:
        - Run the tests before committing
        - Never touch vendor/

If the protocol feels heavy, try `preset: lite` first: refinement, routing and
clarification only, with no visible formatting requirements.

The efficiency & safety section and the `[Assumption]` line are always present —
they are the floor, not an option.

## How it works

`lib/index.js` exports a Cordis plugin. On apply it registers exactly one system
prompt section:

    ctx.systemPrompt.section({
      name: 'agent-protocol',
      order: sectionOrder,      // default 150
      text: () => live.text,    // a cached string, replaced only on save
    })

- `lib/texts.js` — the Chinese and English wording, pure data.
- `lib/protocol.js` — pure logic. `resolveOptions` takes the preset and layers explicit
  switches on top; `buildText` picks the template, drops disabled sections, applies
  per-section overrides, numbers the rest and appends a version + preset banner.
- `lib/index.js` — the plugin entry. Merges the row config with the settings page's
  override layer, registers the section, and serves the page's three endpoints under
  `/api/agent-protocol/{state,save,reset}`.
- `client/client.js` — the settings page, plain JS with no build step.

The text is rebuilt only on save and is byte-stable between steps, so it does not
disturb prompt caching. A schemastery `Config` is exported to validate the row config.
There is no hook into tool execution.

## Scope, limits, privacy

- **Guidance, not a gate.** This is model instruction text. A model can still
  deviate; the plugin does not block tool calls or validate output.
- **Profile-scoped.** Only agents in the profile that installed the bundle see it.
- **Subagents see it too.** DSH keeps the system prompt uniform across parents and
  children, which is why the protocol has an explicit "cannot reach the user" rule.
- **One file written.** Saving on the settings page writes `$DSH_HOME/agent-protocol/overrides.json`; nothing is written to your profile, and there is no network access or telemetry. Delete that file by hand after uninstalling.
- **Compatibility.** `engines.dsh` requires `>=0.2.2-rc.1 <0.3.0-0`.

## Development

    git clone <this repo>
    npm test        # node --test, no dependencies

After editing `lib/` or `client/`, restart DSH to load the new code. The version lives
only in `package.json`; the banner reads it from there.

Chinese documentation: [README.zh-CN.md](README.zh-CN.md).

## License

MIT — see [LICENSE](LICENSE).
