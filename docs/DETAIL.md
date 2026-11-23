![Work protocol flow: task line, refine once, route capabilities, ask before acting, deliver with a self-check](preview.svg)

# The work protocol in detail

## Why a protocol at all

A coding agent's behaviour is mostly decided by what its system prompt says before
the first user turn. Profiles accumulate skills, tools and MCP servers, but rarely a
*consistent* answer to four questions:

1. What should the user see first?
2. When is a request clear enough to execute?
3. When must the agent stop and ask?
4. What must be true before the agent says "done"?

`dsh-agent-protocol` answers those four questions once, in one system-prompt section,
so every agent in the profile behaves the same way on the first turn — not after the
user has corrected it three times.

## Section by section

### 0. Visibility

Each substantive reply opens with a task line: `[Task] <15–40 words>` (Chinese:
`【任务】...`). When a skill was loaded this turn it appends `| Skills: <names>`;
when the agent must ask first it appends `| Confirm: <N> questions`; when it proceeds
with an unknown it adds an explicit `[Assumption]` line instead of hiding the guess.

Why: a scrolling transcript is hard to audit. A one-line statement of intent per
reply makes "what did this turn actually do" answerable at a glance, and makes
silent scope changes visible.

### 1. Refine once

Colloquial input ("make the docs better", "fix that thing") is compressed into a
single 15–40 word statement containing action, object, constraints and the capability
being used. That statement *is* the execution instruction. Writing a second, expanded
version is explicitly forbidden — it is the most common way agents burn a turn.

A structured clarification block (goal / inputs / constraints / steps / acceptance /
rollback) is only added when material ambiguity survives the compression.

### 1b. Strict mode

Triggers on any of: ≥3 constraints; ≥3 files or ≥2 subsystems; irreversible or
high-risk work; an estimated >10 minutes or multiple iterations; or the user
explicitly asking for rigour.

When triggered, three things are mandatory:

- a **constraints table** with a *decidable* acceptance criterion per row;
- confirming gaps **before** starting (never an `[Assumption]` shortcut);
- an **item-by-item** self-check at delivery — each row marked met/unmet with evidence.

Note what is *not* required: a question. Strict mode governs output shape. Asking is
governed by §3 and only happens when a real gap exists.

### 2. Capability routing

Skills and tools are matched **semantically, by capability**, not by literal keyword,
and loaded before the agent acts. Chaining is allowed and encouraged. Before replying,
the agent checks whether it silently skipped an available capability, and when a
dependency is missing it must say so and offer a fallback rather than quietly bypass it.

### 3. Ask before acting

Seven triggers, each concrete enough to be auditable:

1. two or more plausible interpretations of the deliverable;
2. missing key values, ranges or units;
3. vague wording ("optimize it", "do that thing", "whatever");
4. irreversible work with an unclear target or blast radius;
5. rework cost above one round of conversation;
6. the user explicitly asks to confirm first;
7. the task is research work (literature, simulation, experiment design, analysis,
   paper/proposal, group-meeting or defence material).

At most three questions, each with options and a recommended default. The counterweight
matters as much as the list: **anything decidable by reading files, searching, or
inspecting the environment must not be asked.** A config value that is in
`package.json` is not a question — it is a read.

### 4. Team

Teams are expensive and only worth it for ≥4 steps, independent parallel subtasks, a
research→implement→verify split, long runtimes, or an explicit request. Member briefs
carry task, skills, acceptance criteria and artifact paths.

### 5. Efficiency and safety

Always on, no switch: parallelize independent subtasks; back up or state impact before
modifying or deleting; search large files before reading them in chunks; answer in the
user's language, conclusion first, tables over prose, no irrelevant log dumps.

### 6. Delivery self-check

Six questions before "done": declared skills == loaded skills? acceptance met? artifact
paths given? rollback stated for overwrite/delete? did you ask what should have been
asked? did you verify the result rather than assume it?

## Worked example

Request: *"Update both locale files, add the missing config to the README, bump the
version, then publish."*

- **Strict mode?** 4 requirements (≥3), 4 files (≥3), and `publish` is irreversible →
  three triggers fire at once.
- **Clarify?** Yes, one question: *"patch or minor? Adding a documented config key is a
  feature → I recommend a minor bump."* (Key value that changes the artifact, per
  trigger 2.)
- **Constraints table** — locale keys valid JSON / README lists all keys / version
  distinct from npm latest / tarball contains `lib`, `docs`, `icon.svg`.
- **Delivery** — four rows marked met with evidence (file line, command output),
  plus the rollback note (published versions cannot be unpublished after 72 h;
  the local backup path is recorded).

If nothing had been missing, the same task would produce the table, execute, and
deliver with **zero questions**.

## FAQ

**Is it a hard gate?** No. It is system-prompt text. A model can still deviate; the
plugin never blocks a tool call or validates output.

**Does it slow every turn down?** Only strict-mode tasks pay the table cost. A single
factual question gets a one-line task statement and an answer.

**Can I disable one section?** Yes — nine switches, editable in Settings → Plugins
without reinstalling. Section 5 has no switch.

**Does it work in English?** Yes: `language: en` swaps the whole protocol text.

**Does it write anything to my profile?** No. Installing adds one host row; uninstalling
removes the text with no residue.

## Compatibility

`engines.dsh`: `>=0.2.2-rc.1 <0.3.0-0`. Verified on DSH 0.2.2-rc.5 (Windows desktop).
No network access, no telemetry, no data collection.
