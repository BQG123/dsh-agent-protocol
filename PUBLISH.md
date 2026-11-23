# Releasing dsh-agent-protocol

## Every release in six steps

1. **Bump `version` in `package.json`** — the only place. The banner in the injected
   text reads it from there, and `npm test` asserts they agree. Run the tests:

       npm test

2. **Add a `CHANGELOG.md` entry** under a new `## [x.y.z] - YYYY-MM-DD` heading, and
   point the `[Unreleased]`/`[x.y.z]` link refs at the new tag.
3. **Verify the payload**: `pnpm pack --dry-run` — the file list must match the
   preflight list below and nothing else.
4. **Test locally**: start a new session (or restart DSH) and read the protocol banner —
   it must show the new version and preset. A linked install picks the change up without reinstalling;
   a versioned install needs reinstall.
5. **Commit, tag, push** — annotated tags only, `--follow-tags` ignores lightweight ones:

       git commit -am "release: v0.1.1"
       git tag -a v0.1.1 -m "v0.1.1"
       git push origin main --follow-tags

6. **Publish to npm** (only when the marketplace should see it):

       pnpm publish --access public --no-git-checks

Consumers then update differently: npm/market users follow the npm `latest` tag; a
`github:` dependency follows the branch or tag it pinned (pin `#v0.1.1` for stability).

## Which version number?

| Change | Bump |
|---|---|
| Typo, comment, docs only | **patch** |
| Section wording, new switch, new trigger, changed default | **minor** |
| Removed switch, renamed section, changed section contract | **major** |

While the plugin is `0.x`, minor is the safe default for any behaviour change: a user
reading `CHANGELOG` must be able to tell that the injected text changed.

## Two independent channels

Neither requires the other:

| Channel | What it buys | Gate |
|---|---|---|
| **npm** | the plugin market installs and auto-updates it | `npm publish` |
| **GitHub** | source, issues, stars, and the `repository` link on the npm page | first push |

### Do I need both?

No. Being listed in the market does **not** require a repository under your own
account. What the market actually consumes:

- **Freshness and update checks** come from the npm registry: the market reads
  `<registry>/<package>/latest`.
- **Installation** also accepts a git target (`github:owner/repo`, resolved to a
  commit-pinned codeload tarball), so a GitHub-only plugin is installable — it just
  does not get npm's version-driven update path, and its card is shown as
  GitHub-only.
- **Being listed at all** depends on the curated catalog in
  [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin),
  shipped as `dsh-plugin-catalog/index.json`. Getting in means opening a PR there —
  a GitHub *account*, not a repository of your own.

| You want | `npm publish` | your own repo | catalog PR |
|---|---|---|---|
| Market install + automatic updates | required | optional | required |
| Market install from source only | optional | required | required |
| Source browsing, issues, stars | optional | required | optional |
| Private trial without the catalog | — | — | not needed (custom index URL) |

Recommended order: create the GitHub repo first, then fill the `repository` /
`homepage` / `bugs` fields, then publish to npm — so the very first published
version already points at a live repository.

## 0. Preflight

- [ ] `version` in `package.json` is not already on npm
      (`npm view dsh-agent-protocol version` → 404 means the name is free)
- [ ] `CHANGELOG.md` has an entry for that version
- [ ] `npm test` passes
- [ ] payload is right: `pnpm pack --dry-run` (or `npm pack --dry-run`) lists
      `lib/`, `cordis.patch.yml`, `locale/*.json`, `docs/`, `icon.svg`,
      `README.md`, `README.zh-CN.md`, `CHANGELOG.md`, `LICENSE` — and nothing else
- [ ] `engines.dsh` matches the DSH version actually tested
- [ ] installed locally and verified: Settings → Plugins shows the `agent-protocol`
      row, and a **new** session's system prompt carries the protocol text

## 1. Publish to npm

Authenticate once (either works):

    npm login
    # or, non-interactive:
    echo '//registry.npmjs.org/:_authToken=YOUR_TOKEN' >> ~/.npmrc

Then publish from this directory:

    pnpm publish --access public --no-git-checks
    # equivalent when npm is installed:
    npm publish --access public

Verify:

    npm view dsh-agent-protocol version dist-tags

Notes:

- `--no-git-checks` is needed when the working tree is dirty — pnpm refuses otherwise.
- A published version can only be unpublished within 72 hours, and only while nothing
  depends on it. Treat `publish` as irreversible.
- Bump `version` for every release; the market's update check compares the installed
  version against the npm `latest` tag.

## 2. Create the GitHub repository

    git init
    git config user.name  "Your Name"
    git config user.email "you@example.com"
    git add -A
    git commit -m "feat: initial release of dsh-agent-protocol 0.1.0"
    git tag -a v0.1.0 -m "v0.1.0"

Create the remote (web UI, or `gh repo create`) as `<owner>/dsh-agent-protocol`, public,
no template. Then:

    git remote add origin https://github.com/<owner>/dsh-agent-protocol.git
    git branch -M main
    git push -u origin main
    git push origin v0.1.0

Fill the fields the npm page reads, in `package.json`:

    "repository": { "type": "git", "url": "git+https://github.com/<owner>/dsh-agent-protocol.git" },
    "homepage": "https://github.com/<owner>/dsh-agent-protocol#readme",
    "bugs": { "url": "https://github.com/<owner>/dsh-agent-protocol/issues" }

Commit and push again **before** the first `publish`, so 0.1.0 ships with a working link.

## 3. List it in the plugin market

The market (`dshmarket`) reads the community catalog published by
[awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin) and serves
it as `dsh-plugin-catalog/index.json`.

1. Open a PR against `awesome-dsh-plugin` following that repository's contribution
   guide. The entry is normally the npm package name plus a one-line bilingual
   description, e.g.:

       dsh-agent-protocol — Inject one consistent work protocol (task line, refine
       once, skill routing, forced clarification, strict mode, delivery self-check)
       into every DSH agent. / 把统一工作协议注入每个 DSH 智能体。

2. Wait for review; the site and the in-DSH market pick it up automatically
   (usually within a day).

3. To test without the catalog: **Plugins → Discover → Index sources** accepts a
   custom format-1 index URL, so a self-hosted `index.json` works for a private audience.

## 4. Update flow

Follow "Every release in six steps" at the top. Users receive the update through the
market's per-plugin version check; an installed bundle needs a DSH restart to load a
fresh JS module generation.

## 5. Safety checklist before publishing

- [ ] no credentials, tokens, absolute local paths or personal data in the payload
- [ ] `pnpm pack --dry-run` output matches the intended file list
- [ ] icon and preview are original or licence-compatible; no fonts, scripts or
      remote resources inside the SVGs
- [ ] `README` examples still run (install, config keys)
- [ ] local install verified end-to-end in a fresh session
