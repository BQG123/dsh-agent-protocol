/**
 * dsh-agent-protocol — inject a portable work protocol into every agent's
 * system prompt.
 *
 * The protocol is guidance for the model, not a hard gate: keep the wording
 * short, and let each deployment switch sections off.
 *
 * Config has two layers. The plugin row (bundle patch / Settings → Plugins) is
 * the base; edits made on the plugin's own page are stored as overrides in
 * `$DSH_HOME/agent-protocol/overrides.json` and win over the base. The section
 * text is a provider that returns a cached string, so the prompt prefix stays
 * byte-stable between steps and only changes when the user saves.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

import {
  buildText,
  DEFAULTS,
  defaultIntro,
  describeSections,
  estimateTokens,
  explicitSwitches,
  MAX_SECTION_CHARS,
  PRESETS,
  resolveOptions,
  sanitize,
  SWITCHES,
  TEXT_KEYS,
  toBoolean,
  VERSION,
} from './protocol.js'

export { buildText, DEFAULTS, describeSections, PRESETS, resolveOptions, SWITCHES, VERSION }

export const name = 'agent-protocol'
export const inject = ['systemPrompt']

const RPC_PREFIX = '/api/agent-protocol'
const MAX_RULES = 50

/** Same precedence as the host: `$DSH_HOME` when set and non-blank, else `~/.dsh`. */
export function overridesPath(env = process.env) {
  const home = typeof env.DSH_HOME === 'string' && env.DSH_HOME.trim() ? env.DSH_HOME.trim() : join(homedir(), '.dsh')
  return join(home, 'agent-protocol', 'overrides.json')
}

/**
 * Reduce an untrusted overrides object to the keys and shapes the page may set.
 * `null` on a switch means "stop overriding, follow the layer below".
 */
export function cleanOverrides(input) {
  const raw = input !== null && typeof input === 'object' && !Array.isArray(input) ? input : {}
  const out = {}
  if (raw.language === 'zh' || raw.language === 'en') out.language = raw.language
  if (typeof raw.preset === 'string' && Object.hasOwn(PRESETS, raw.preset)) out.preset = raw.preset
  for (const key of SWITCHES) {
    if (raw[key] === null) out[key] = null
    else if (toBoolean(raw[key]) !== undefined) out[key] = toBoolean(raw[key])
  }
  if (Array.isArray(raw.extraRules)) {
    out.extraRules = raw.extraRules
      .filter((item) => typeof item === 'string')
      .map((item) => sanitize(item).trim().slice(0, MAX_SECTION_CHARS))
      .filter(Boolean)
      .slice(0, MAX_RULES)
  }
  if (raw.sectionText !== null && typeof raw.sectionText === 'object' && !Array.isArray(raw.sectionText)) {
    const texts = {}
    for (const key of TEXT_KEYS) {
      const value = raw.sectionText[key]
      if (typeof value === 'string' && value.trim()) texts[key] = sanitize(value).trim().slice(0, MAX_SECTION_CHARS)
    }
    out.sectionText = texts
  }
  return out
}

/** Base row config with the page's overrides on top; a `null` override removes the key. */
export function mergeConfig(base = {}, overrides = {}) {
  const merged = { ...(base || {}) }
  for (const [key, value] of Object.entries(overrides || {})) {
    if (value === null) delete merged[key]
    else merged[key] = value
  }
  return merged
}

/** File-backed overrides. A missing or unreadable file is simply "no overrides". */
export function createStore(path = overridesPath()) {
  return {
    path,
    read() {
      try {
        return cleanOverrides(JSON.parse(readFileSync(path, 'utf8')).overrides)
      } catch {
        return {}
      }
    },
    write(overrides) {
      const clean = cleanOverrides(overrides)
      mkdirSync(dirname(path), { recursive: true })
      const temp = `${path}.${process.pid}.tmp`
      writeFileSync(temp, `${JSON.stringify({ version: 1, overrides: clean }, null, 2)}\n`, { mode: 0o600 })
      renameSync(temp, path)
      return clean
    },
  }
}

/** Everything the settings page needs to render, for a base config and a set of overrides. */
export function describeState(base, overrides, extra = {}) {
  const merged = mergeConfig(base, overrides)
  const options = resolveOptions(merged)
  const text = buildText(merged)
  const intro = defaultIntro(merged)
  return {
    version: VERSION,
    options,
    overrides,
    base: resolveOptions(base),
    explicit: explicitSwitches(merged),
    presets: PRESETS,
    switches: SWITCHES,
    sections: describeSections(merged),
    intro: { defaultBody: intro, body: options.sectionText.intro ?? intro, overridden: options.sectionText.intro !== undefined },
    text,
    stats: { chars: text.length, tokens: estimateTokens(text), lines: text.split('\n').length },
    limits: { sectionChars: MAX_SECTION_CHARS, rules: MAX_RULES },
    ...extra,
  }
}

const json = (value, status = 200) => Response.json(value, { status, headers: { 'cache-control': 'no-store' } })
const fail = (code, message, status = 200) => json({ ok: false, error: { code, message } }, status)

/**
 * Route handlers, separated from registration so they can be tested with plain
 * `Request` objects. `live` is the `{ base, overrides, apply }` holder.
 */
export function createHandlers(live, store) {
  const info = () => ({ storagePath: store.path })
  const guard = (handler) => async (request) => {
    try {
      return await handler((await request.json().catch(() => ({}))) ?? {})
    } catch (error) {
      return fail('agent-protocol/internal', error instanceof Error ? error.message : String(error))
    }
  }
  const saved = () => json({ ok: true, value: describeState(live.base, live.overrides, { ...info(), saved: true }) })
  return {
    /** Current state, or — with `draft` — what the state would be, without saving. */
    state: guard((input) => {
      if (input.draft === undefined) return saved()
      return json({ ok: true, value: describeState(live.base, cleanOverrides(input.draft), { ...info(), saved: false }) })
    }),
    /** Persist overrides and swap the injected text. */
    save: guard((input) => {
      if (input.overrides === null || typeof input.overrides !== 'object') return fail('agent-protocol/bad-request', 'missing overrides', 400)
      live.apply(store.write(input.overrides))
      return saved()
    }),
    /** Drop every override and fall back to the plugin row config. */
    reset: guard(() => {
      live.apply(store.write({}))
      return saved()
    }),
  }
}

/**
 * Settings schema. schemastery is provided by the DSH host; when the plugin is
 * loaded somewhere it cannot be resolved (plain Node, tests), the plugin still
 * works and simply exposes no schema.
 */
async function loadSchema() {
  let z
  try {
    z = (await import('@deepseek-ai/schemastery')).default
  } catch {
    return undefined
  }
  if (typeof z?.object !== 'function') return undefined
  const flag = (text) => z.boolean().description(text)
  return z.object({
    language: z.union(['zh', 'en']).default(DEFAULTS.language).description('注入文本的语言 / Language of the injected text'),
    preset: z.union(['lite', 'standard', 'strict']).default(DEFAULTS.preset).description('档位：lite 低打扰 / standard 默认 / strict 全程严格模式'),
    sectionOrder: z.number().default(DEFAULTS.sectionOrder).description('该段在系统提示中的排序 / Section order'),
    taskLine: flag('首条回复写【任务】行（留空=跟随档位）'),
    refine: flag('一次精炼（留空=跟随档位）'),
    strictMode: flag('严格模式（留空=跟随档位）'),
    skillRouting: flag('能力路由（留空=跟随档位）'),
    clarify: flag('先问后做（留空=跟随档位）'),
    researchClarify: flag('科研任务开工前必须确认（留空=跟随档位，需 clarify 开启）'),
    teamPolicy: flag('团队仅用于复杂任务（留空=跟随档位）'),
    deliveryCheck: flag('交付自检（留空=跟随档位）'),
    extraRules: z.array(z.string()).default([]).description('附加规则，每项一条 / Extra rules, one per item'),
    sectionText: z.dict(z.string()).default({}).description('按段覆盖提示词正文 / Per-section prompt overrides'),
  })
}

export const Config = await loadSchema()

function registerRoutes(ctx, handlers) {
  if (typeof ctx.inject !== 'function') return
  ctx.inject(['connection'], (connCtx) => {
    const fetchRegistry = connCtx.get('connection')?.fetch
    const register = fetchRegistry?.register?.bind(fetchRegistry)
    if (register === undefined) return
    for (const [route, handler] of Object.entries(handlers)) {
      const path = `${RPC_PREFIX}/${route}`
      try {
        connCtx.effect(() => register({ path, methods: ['POST'], requestBody: 'buffered', fetch: handler }), `agent-protocol: ${path}`)
      } catch (error) {
        ctx.logger?.warn?.('agent-protocol: route %s failed (%s)', path, error instanceof Error ? error.message : String(error))
      }
    }
  })
}

export function apply(ctx, config = {}, { store = createStore() } = {}) {
  const live = {
    base: config || {},
    overrides: store.read(),
    text: '',
    apply(overrides) {
      this.overrides = overrides
      this.text = buildText(mergeConfig(this.base, overrides))
    },
  }
  live.apply(live.overrides)

  const section = {
    name: 'agent-protocol',
    // The order is fixed at registration; changing it takes a restart.
    order: resolveOptions(mergeConfig(live.base, live.overrides)).sectionOrder,
    text: () => live.text,
  }
  if (typeof ctx.effect === 'function') ctx.effect(() => ctx.systemPrompt.section(section), 'agent-protocol.section()')
  else ctx.systemPrompt.section(section)

  registerRoutes(ctx, createHandlers(live, store))
}
