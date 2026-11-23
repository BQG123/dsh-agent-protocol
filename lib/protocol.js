/**
 * Pure protocol logic: normalize config, build sections, render the text.
 * No I/O and no host APIs, so everything here is unit-testable in plain Node.
 */
import { createRequire } from 'node:module'

import { EN, ZH } from './texts.js'

/** Single source of truth: the version printed in the banner is package.json's. */
export const VERSION = createRequire(import.meta.url)('../package.json').version

/** Switches a preset decides. An explicit config value always wins over the preset. */
export const SWITCHES = [
  'taskLine',
  'refine',
  'strictMode',
  'skillRouting',
  'clarify',
  'researchClarify',
  'teamPolicy',
  'deliveryCheck',
]

/**
 * Sections in render order. `switch` is the option that turns the section on;
 * sections without one are the always-on floor.
 */
export const SECTIONS = [
  { id: 'visibility' },
  { id: 'refine', switch: 'refine' },
  { id: 'strict', switch: 'strictMode' },
  { id: 'routes', switch: 'skillRouting' },
  { id: 'clarify', switch: 'clarify' },
  { id: 'team', switch: 'teamPolicy' },
  { id: 'safety' },
  { id: 'check', switch: 'deliveryCheck' },
]

/** Keys of `sectionText`: every section body, plus the opening sentence. */
export const TEXT_KEYS = ['intro', ...SECTIONS.map((section) => section.id)]

const all = (value) => Object.fromEntries(SWITCHES.map((key) => [key, value]))

export const PRESETS = {
  /** Low-friction: routing + clarification only, no visible ceremony. */
  lite: {
    ...all(false),
    refine: true,
    skillRouting: true,
    clarify: true,
  },
  /** Everything on, strict mode only when its triggers fire. */
  standard: all(true),
  /** Everything on, strict mode for every non-trivial task. */
  strict: all(true),
}

export const DEFAULTS = {
  language: 'zh',
  preset: 'standard',
  sectionOrder: 150,
  extraRules: [],
  sectionText: {},
}

/** Upper bound for one user-written section, to keep a paste accident out of the prompt. */
export const MAX_SECTION_CHARS = 8000

/** Accept real booleans plus the strings/numbers a hand-edited YAML tends to produce. */
export function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const text = value.trim().toLowerCase()
    if (['false', '0', 'off', 'no'].includes(text)) return false
    if (['true', '1', 'on', 'yes'].includes(text)) return true
  }
  return undefined
}

/**
 * The host interpolates `{{name}}` groups and has no escape syntax, so a
 * literal pair in user text would make prompt rendering throw.
 */
export const sanitize = (text) => String(text ?? '').replace(/\{\{/g, '{ {').replace(/\}\}/g, '} }')

function toRules(value) {
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split('\n') : []
  return items.map((item) => sanitize(item).trim().replace(/^[-*]\s+/, '')).filter(Boolean)
}

function toSectionText(value) {
  const out = {}
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return out
  for (const key of TEXT_KEYS) {
    if (typeof value[key] !== 'string') continue
    const text = sanitize(value[key]).replace(/\r\n?/g, '\n').trim().slice(0, MAX_SECTION_CHARS)
    if (text) out[key] = text
  }
  return out
}

/** Normalize raw config into a complete option set: preset first, explicit switches on top. */
export function resolveOptions(config = {}) {
  const raw = config || {}
  const presetName = String(raw.preset ?? DEFAULTS.preset).trim().toLowerCase()
  const preset = Object.hasOwn(PRESETS, presetName) ? presetName : DEFAULTS.preset
  const order = raw.sectionOrder === null || raw.sectionOrder === '' ? NaN : Number(raw.sectionOrder)
  const options = {
    language: String(raw.language ?? DEFAULTS.language).trim().toLowerCase().startsWith('en') ? 'en' : 'zh',
    preset,
    sectionOrder: Number.isFinite(order) ? order : DEFAULTS.sectionOrder,
    extraRules: toRules(raw.extraRules),
    sectionText: toSectionText(raw.sectionText),
  }
  for (const key of SWITCHES) options[key] = toBoolean(raw[key]) ?? PRESETS[preset][key]
  // The research trigger is one of the clarification triggers; it cannot outlive them.
  if (!options.clarify) options.researchClarify = false
  return options
}

/** Which switches the raw config sets explicitly (as opposed to inheriting from the preset). */
export function explicitSwitches(config = {}) {
  const raw = config || {}
  return Object.fromEntries(SWITCHES.map((key) => [key, toBoolean(raw[key]) !== undefined]))
}

const language = (options) => (options.language === 'en' ? EN : ZH)

/** Built-in bullets of one section under the given options. */
function defaultBullets(id, options) {
  const L = language(options)
  switch (id) {
    case 'visibility': {
      const bullets = []
      if (options.taskLine) bullets.push(L.visibility.taskLine)
      if (options.skillRouting) bullets.push(L.visibility.skillTag)
      bullets.push(L.visibility.assumption)
      return bullets
    }
    case 'refine':
      return L.refine.bullets
    case 'strict':
      return options.preset === 'strict'
        ? [L.strict.always, ...L.strict.bullets]
        : [L.strict.trigger, ...L.strict.bullets, L.strict.notTriggered]
    case 'routes':
      return L.routes.bullets
    case 'clarify': {
      const triggers = [...L.clarify.triggers]
      if (options.researchClarify) triggers.push(L.clarify.research)
      return [
        L.clarify.history,
        L.clarify.lead + L.list(triggers),
        L.clarify.how,
        L.clarify.dontAsk,
        options.strictMode ? L.clarify.afterStrict : L.clarify.after,
        L.clarify.noUser,
      ]
    }
    case 'team':
      return L.team.bullets
    case 'safety':
      return L.safety.bullets
    case 'check': {
      const questions = [
        options.skillRouting ? L.check.skills : '',
        L.check.acceptance,
        L.check.paths,
        L.check.rollback,
        options.clarify ? L.check.asked : '',
        L.check.verified,
      ].filter(Boolean)
      return [(options.strictMode ? L.check.leadStrict : L.check.lead) + questions.join(' ')]
    }
    default:
      return []
  }
}

const asBody = (bullets) => bullets.map((bullet) => `- ${bullet}`).join('\n')

/**
 * Describe every section — enabled or not — with its built-in body and the
 * body actually in effect. The settings page edits from this.
 */
export function describeSections(config = {}) {
  const options = resolveOptions(config)
  const L = language(options)
  return SECTIONS.map((section) => {
    const enabled = section.switch === undefined || options[section.switch]
    // A disabled section still shows the text it would have, so it can be edited before it is switched on.
    const defaultBody = asBody(defaultBullets(section.id, enabled ? options : { ...options, [section.switch]: true }))
    const override = options.sectionText[section.id]
    return {
      id: section.id,
      switch: section.switch ?? null,
      title: L[section.id].title,
      enabled,
      defaultBody,
      body: override ?? defaultBody,
      overridden: override !== undefined,
    }
  })
}

/** Render the protocol text. Accepts raw config; sections are numbered in the order they survive. */
export function buildText(config = {}) {
  const options = resolveOptions(config)
  const L = language(options)
  const parts = [`${L.title}\n\n${options.sectionText.intro ?? L.intro}`]
  let index = 0
  for (const section of describeSections(options)) {
    if (section.enabled) parts.push(`## ${++index}. ${section.title}\n${section.body}`)
  }
  if (options.extraRules.length) parts.push(`## ${++index}. ${L.extraTitle}\n${asBody(options.extraRules)}`)
  parts.push(`> protocol: dsh-agent-protocol v${VERSION} (${options.preset})`)
  return parts.join('\n\n')
}

/** Built-in opening sentence for the given language. */
export const defaultIntro = (config = {}) => language(resolveOptions(config)).intro

/**
 * Rough token estimate for display only: CJK characters are close to one token
 * each on common tokenizers, other text close to four characters per token.
 */
export function estimateTokens(text) {
  const cjk = (text.match(/[　-鿿＀-￯]/g) ?? []).length
  return Math.round(cjk * 0.8 + (text.length - cjk) / 4)
}
