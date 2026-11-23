import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  apply,
  buildText,
  cleanOverrides,
  createHandlers,
  createStore,
  describeSections,
  describeState,
  mergeConfig,
  overridesPath,
  PRESETS,
  resolveOptions,
  VERSION,
} from '../lib/index.js'

const SWITCHES = Object.keys(PRESETS.standard)
const headings = (text) => text.split('\n').filter((line) => line.startsWith('## '))
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

/** Every on/off combination of the eight switches. */
function* combinations() {
  for (let mask = 0; mask < 2 ** SWITCHES.length; mask++) {
    yield Object.fromEntries(SWITCHES.map((key, bit) => [key, Boolean(mask & (1 << bit))]))
  }
}

test('banner version comes from package.json', () => {
  const pkg = JSON.parse(read('../package.json'))
  assert.equal(VERSION, pkg.version)
  assert.match(buildText(), new RegExp(`dsh-agent-protocol v${pkg.version.replaceAll('.', '\\.')} \\(standard\\)$`))
})

test('sections are numbered 1..n without gaps for every switch combination', () => {
  for (const language of ['zh', 'en']) {
    for (const switches of combinations()) {
      const found = headings(buildText({ language, ...switches }))
      found.forEach((line, index) => assert.ok(line.startsWith(`## ${index + 1}. `), `${language} ${JSON.stringify(switches)}: ${line}`))
    }
  }
})

test('zh and en render the same structure for every switch combination', () => {
  const shape = (text) => text.split('\n').map((line) => (line.startsWith('## ') ? '#' : line.startsWith('- ') ? '-' : '')).join('')
  for (const switches of combinations()) {
    assert.equal(shape(buildText({ language: 'en', ...switches })), shape(buildText({ language: 'zh', ...switches })))
  }
})

test('the always-on floor survives with every switch off', () => {
  const text = buildText({ ...Object.fromEntries(SWITCHES.map((key) => [key, false])) })
  assert.deepEqual(headings(text), ['## 1. 可见性', '## 2. 效率与安全'])
  assert.match(text, /【假设】/)
})

test('assumption line stays defined when the task line is off', () => {
  const text = buildText({ taskLine: false })
  assert.doesNotMatch(text, /【任务】</)
  assert.match(text, /单列一行「【假设】/)
})

test('task line is written once per task and the skill line does not depend on it', () => {
  assert.match(buildText(), /每项任务只写一次/)
  assert.match(buildText(), /最后交付结果的回复/)
  assert.match(buildText({ taskLine: false }), /单列一行「【技能】/)
  assert.match(buildText({ language: 'en' }), /the final delivery/)
  assert.doesNotMatch(buildText({ skillRouting: false }), /【技能】</)
})

test('strict mode is its own section and does not depend on refine', () => {
  const text = buildText({ refine: false })
  assert.ok(headings(text).some((line) => line.endsWith('严格模式')))
  assert.ok(!headings(text).some((line) => line.includes('一次精炼')))
})

test('research clarification is a separate switch, on by default, tied to clarify', () => {
  assert.match(buildText(), /科研类/)
  assert.doesNotMatch(buildText({ researchClarify: false }), /科研类/)
  assert.match(buildText({ researchClarify: false }), /先问后做/)
  assert.doesNotMatch(buildText({ clarify: false, researchClarify: true }), /科研类/)
  assert.equal(resolveOptions({ clarify: false, researchClarify: true }).researchClarify, false)
})

test('clarification tells an agent with no user to proceed on assumptions', () => {
  assert.match(buildText(), /无法向用户提问时/)
  assert.match(buildText({ language: 'en' }), /cannot reach the user/)
})

test('clarification forbids re-asking what was already answered', () => {
  const zh = buildText()
  assert.match(zh, /提问前先看对话历史/)
  assert.match(zh, /最多集中问一轮/)
  assert.ok(zh.indexOf('提问前先看对话历史') < zh.indexOf('必须先问'), 'the history guard comes before the triggers')
  assert.match(buildText({ language: 'en' }), /never ask it again/)
})

test('presets set defaults and explicit switches override them', () => {
  const lite = resolveOptions({ preset: 'lite' })
  assert.equal(lite.taskLine, false)
  assert.equal(lite.strictMode, false)
  assert.equal(lite.clarify, true)
  assert.equal(resolveOptions({ preset: 'lite', taskLine: true }).taskLine, true)
  assert.equal(resolveOptions({ preset: 'nonsense' }).preset, 'standard')

  assert.match(buildText({ preset: 'strict' }), /所有非琐碎任务启用严格模式/)
  assert.doesNotMatch(buildText({ preset: 'strict' }), /触发条件（任一）/)
  assert.match(buildText({ preset: 'standard' }), /触发条件（任一）/)
  assert.ok(buildText({ preset: 'lite' }).length < buildText().length)
})

test('string and numeric switch values are coerced', () => {
  assert.equal(resolveOptions({ taskLine: 'false' }).taskLine, false)
  assert.equal(resolveOptions({ taskLine: 'off' }).taskLine, false)
  assert.equal(resolveOptions({ taskLine: 0 }).taskLine, false)
  assert.equal(resolveOptions({ preset: 'lite', taskLine: 'true' }).taskLine, true)
  assert.equal(resolveOptions({ taskLine: 'maybe' }).taskLine, true)
  assert.equal(resolveOptions({ taskLine: null }).taskLine, true)
})

test('language and section order fall back safely', () => {
  assert.equal(resolveOptions({ language: 'EN-us' }).language, 'en')
  assert.equal(resolveOptions({ language: 'fr' }).language, 'zh')
  assert.equal(resolveOptions({ sectionOrder: '90' }).sectionOrder, 90)
  for (const bad of ['abc', null, '', undefined, NaN]) assert.equal(resolveOptions({ sectionOrder: bad }).sectionOrder, 150)
  assert.equal(resolveOptions(null).preset, 'standard')
})

test('extra rules become the last numbered section and cannot break interpolation', () => {
  const text = buildText({ extraRules: ['- 提交前跑测试', '  ', '路径用 {{cwd}} 表示'] })
  const found = headings(text)
  assert.match(found.at(-1), /^## \d+\. 附加规则$/)
  assert.match(text, /\n- 提交前跑测试\n/)
  assert.doesNotMatch(text, /\{\{|\}\}/)
  assert.match(buildText({ extraRules: 'a\nb' }), /\n- a\n- b\n/)
  assert.doesNotMatch(buildText({ extraRules: [] }), /附加规则/)
})

test('no built-in text contains an interpolation group', () => {
  for (const language of ['zh', 'en']) {
    for (const preset of Object.keys(PRESETS)) assert.doesNotMatch(buildText({ language, preset }), /\{\{|\}\}/)
  }
})

test('resolveOptions is idempotent', () => {
  const once = resolveOptions({ preset: 'lite', language: 'en', extraRules: 'x', deliveryCheck: 'on' })
  assert.deepEqual(resolveOptions(once), once)
})

/** A store that never touches the real DSH home. */
function tempStore() {
  const dir = mkdtempSync(join(tmpdir(), 'agent-protocol-'))
  return { store: createStore(join(dir, 'nested', 'overrides.json')), cleanup: () => rmSync(dir, { recursive: true, force: true }) }
}

const post = (body) => new Request('http://local/api', { method: 'POST', body: JSON.stringify(body ?? {}) })

test('apply registers exactly one section, through ctx.effect when available', () => {
  const { store, cleanup } = tempStore()
  try {
    const direct = []
    apply({ systemPrompt: { section: (section) => direct.push(section) } }, { sectionOrder: 42 }, { store })
    assert.equal(direct.length, 1)
    assert.equal(direct[0].name, 'agent-protocol')
    assert.equal(direct[0].order, 42)
    assert.equal(direct[0].text(), buildText({ sectionOrder: 42 }))
    assert.equal(direct[0].text(), direct[0].text(), 'the provider returns a stable string')

    const viaEffect = []
    let effects = 0
    const ctx = {
      systemPrompt: { section: (section) => viaEffect.push(section) },
      effect: (callback) => {
        effects++
        return callback()
      },
    }
    apply(ctx, undefined, { store })
    assert.equal(effects, 1)
    assert.equal(viaEffect.length, 1)
    assert.equal(typeof viaEffect[0].text(), 'string')
  } finally {
    cleanup()
  }
})

test('section text can be overridden per section and restored', () => {
  const custom = buildText({ sectionText: { clarify: '- 只问一次。\n- 用 {{x}} 也不会炸', intro: '自定义开场。' } })
  assert.match(custom, /\n\n自定义开场。\n\n## 1\./)
  assert.match(custom, /## 5\. 先问后做\n- 只问一次。\n- 用 \{ \{x\} \} 也不会炸\n\n## 6\./)
  assert.doesNotMatch(custom, /提问前先看对话历史/)
  assert.equal(buildText({ sectionText: { clarify: '   ', nonsense: 'x' } }), buildText())

  const sections = describeSections({ sectionText: { clarify: '- x' }, teamPolicy: false })
  const byId = Object.fromEntries(sections.map((section) => [section.id, section]))
  assert.equal(byId.clarify.overridden, true)
  assert.equal(byId.clarify.body, '- x')
  assert.match(byId.clarify.defaultBody, /提问前先看对话历史/)
  assert.equal(byId.team.enabled, false)
  assert.match(byId.team.defaultBody, /仅复杂任务启用/, 'a disabled section still exposes its default text')
  assert.equal(byId.safety.switch, null)
})

test('overrides are cleaned and layered over the row config', () => {
  assert.deepEqual(cleanOverrides({ preset: 'lite', language: 'fr', taskLine: 'off', refine: null, bogus: 1, extraRules: ['a', 3, ' '], sectionText: { intro: ' hi ', nope: 'x', team: '' } }), {
    preset: 'lite',
    taskLine: false,
    refine: null,
    extraRules: ['a'],
    sectionText: { intro: 'hi' },
  })
  assert.deepEqual(cleanOverrides('nonsense'), {})

  const merged = mergeConfig({ preset: 'strict', taskLine: false, language: 'en' }, { preset: 'lite', taskLine: null })
  assert.deepEqual(merged, { preset: 'lite', language: 'en' })
  assert.equal(resolveOptions(merged).taskLine, false, 'a null override falls back to the preset')
})

test('the store round-trips and treats a missing or broken file as empty', () => {
  const { store, cleanup } = tempStore()
  try {
    assert.deepEqual(store.read(), {})
    assert.deepEqual(store.write({ preset: 'lite', junk: true }), { preset: 'lite' })
    assert.deepEqual(store.read(), { preset: 'lite' })
  } finally {
    cleanup()
  }
  assert.match(overridesPath({ DSH_HOME: '/tmp/x' }), /^\/tmp\/x\/agent-protocol\/overrides\.json$/)
  assert.match(overridesPath({ DSH_HOME: '  ' }), /\.dsh\/agent-protocol\/overrides\.json$/)
})

test('routes preview a draft without saving, then save and reset swap the live text', async () => {
  const { store, cleanup } = tempStore()
  try {
    const registered = []
    apply({ systemPrompt: { section: (section) => registered.push(section) } }, { preset: 'standard' }, { store })
    const live = { base: { preset: 'standard' }, overrides: {}, text: '', apply(next) { this.overrides = next; this.text = buildText(mergeConfig(this.base, next)) } }
    live.apply({})
    const routes = createHandlers(live, store)

    const initial = await (await routes.state(post())).json()
    assert.equal(initial.ok, true)
    assert.equal(initial.value.saved, true)
    assert.equal(initial.value.text, buildText({ preset: 'standard' }))
    assert.equal(initial.value.stats.chars, initial.value.text.length)
    assert.ok(initial.value.stats.tokens > 0)
    assert.equal(initial.value.storagePath, store.path)

    const preview = await (await routes.state(post({ draft: { preset: 'lite' } }))).json()
    assert.equal(preview.value.saved, false)
    assert.equal(preview.value.options.preset, 'lite')
    assert.equal(live.text, buildText({ preset: 'standard' }), 'a preview does not change the live text')
    assert.deepEqual(store.read(), {})

    const saved = await (await routes.save(post({ overrides: { preset: 'lite', taskLine: true, extraRules: ['提交前跑测试'] } }))).json()
    assert.equal(saved.value.options.preset, 'lite')
    assert.equal(saved.value.explicit.taskLine, true)
    assert.equal(saved.value.explicit.refine, false)
    assert.equal(live.text, buildText({ preset: 'lite', taskLine: true, extraRules: ['提交前跑测试'] }))
    assert.deepEqual(store.read(), { preset: 'lite', taskLine: true, extraRules: ['提交前跑测试'] })

    assert.equal((await (await routes.save(post({}))).json()).ok, false)
    assert.equal((await (await routes.save(new Request('http://local/api', { method: 'POST', body: 'not json' }))).json()).ok, false)

    const reset = await (await routes.reset(post())).json()
    assert.deepEqual(reset.value.overrides, {})
    assert.equal(live.text, buildText({ preset: 'standard' }))
  } finally {
    cleanup()
  }
})

test('describeState reports the base layer separately from the effective options', () => {
  const state = describeState({ preset: 'strict' }, { preset: 'lite' })
  assert.equal(state.base.preset, 'strict')
  assert.equal(state.options.preset, 'lite')
  assert.equal(state.intro.overridden, false)
  assert.equal(state.sections.length, 8)
})

test('the client bundle is declared and parses', async () => {
  const pkg = JSON.parse(read('../package.json'))
  assert.equal(pkg.exports['./client'], './client/client.js')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.ok(pkg.files.includes('client'))
  const source = read('../client/client.js')
  const loaded = []
  const React = { createElement: () => null, useState: () => [0, () => {}], useEffect: () => {}, Fragment: 'fragment' }
  new Function('window', 'document', source)({ __ModuleLoader__: { load: (entry) => loaded.push(entry) } }, undefined)
  assert.equal(loaded.length, 1)
  assert.equal(loaded[0].id, 'dsh-agent-protocol')
  const plugin = loaded[0].factory(() => React)
  assert.equal(typeof plugin.apply, 'function')
  assert.deepEqual(plugin.inject, ['slots', 'locale'])

  // The page registers a main view, a sidebar entry and a settings section, with every locale key in both languages.
  const slots = []
  let dictionaries
  plugin.apply({
    effect: (callback) => callback(),
    locale: { register: (_ns, value) => { dictionaries = value }, bind: () => (key) => key },
    slots: { inject: (_name, callback) => callback(), register: (slot) => slots.push(slot.name) },
  })
  assert.deepEqual(slots, ['main', 'sidebar.panellist', 'settings.section'])
  assert.deepEqual(Object.keys(dictionaries.en).sort(), Object.keys(dictionaries.zh).sort())
  for (const key of [...source.matchAll(/\bt\("([A-Za-z_]+)"\)/g)].map((match) => match[1])) {
    assert.ok(key in dictionaries.zh, `missing locale key ${key}`)
  }
  for (const id of Object.keys(PRESETS.standard)) {
    assert.ok(`sw_${id}` in dictionaries.zh && `sw_${id}_desc` in dictionaries.zh, `missing switch label ${id}`)
  }
})

test('bundle patch and READMEs document every config key', () => {
  const keys = ['language', 'preset', 'sectionOrder', 'extraRules', 'sectionText', ...SWITCHES]
  for (const file of ['../README.md', '../README.zh-CN.md']) {
    const text = read(file)
    for (const key of keys) assert.ok(text.includes(`\`${key}\``), `${file} is missing ${key}`)
  }
  const patch = read('../cordis.patch.yml')
  for (const key of ['language', 'preset', 'sectionOrder']) assert.match(patch, new RegExp(`^\\s+${key}:`, 'm'))
})
