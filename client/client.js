/**
 * dsh-agent-protocol — browser half.
 *
 * Adds a "工作协议 / Work protocol" entry to the sidebar that opens a full page
 * for choosing the preset, flipping section switches, editing the wording of
 * each section and previewing the exact text injected into the system prompt.
 *
 * No build step: this file is loaded as-is by the DSH module loader, so it is
 * plain JavaScript with `React.createElement`.
 */
window.__ModuleLoader__.load({ id: "dsh-agent-protocol", factory: (require) => {
	var module = { exports: {} };
	var exports = module.exports;
	const React = require("react");
	const h = React.createElement;

	const name = "dsh-agent-protocol";
	const inject = ["slots", "locale"];
	const NS = "dsh-agent-protocol";
	const API = "/api/agent-protocol";

	/* ------------------------------------------------------------------ *
	 * Styles (host design tokens, same look as the other dashboard pages) *
	 * ------------------------------------------------------------------ */

	const CSS_ID = "dsh-agent-protocol/page.css";
	if (typeof document !== "undefined" && document.querySelector(`style[data-plugin-css="${CSS_ID}"]`) === null) {
		const style = document.createElement("style");
		style.dataset.plugin = NS;
		style.dataset.pluginCss = CSS_ID;
		style.textContent = `
.dap-page {
	box-sizing: border-box;
	background: var(--lc-canvas, var(--dsw-alias-bg-base));
	width: 100%;
	min-width: 0;
	height: 100%;
	min-height: 0;
	color: var(--dsw-alias-label-primary);
	flex-direction: column;
	font-size: 13px;
	display: flex;
	overflow: hidden;
	container: dap-page / inline-size;
}
.dap-scroll { scrollbar-gutter: stable; flex: auto; min-height: 0; overflow-y: auto; }
.dap-content { padding: 0 clamp(16px, 2.5cqi, 32px) 48px; max-width: 1440px; margin: 0 auto; }
.dap-modal-root { padding: 12px 16px 28px; container: dap-page / inline-size; }
.dap-head {
	flex-wrap: wrap;
	align-items: center;
	gap: 8px;
	margin-bottom: 16px;
	padding-top: 28px;
	display: flex;
}
[data-platform=darwin] .dap-page .dap-head { padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px)); }
.dap-title {
	flex: 0 auto;
	min-width: 0;
	margin: 0 8px 0 0;
	font-size: 20px;
	font-weight: 500;
	line-height: 28px;
	display: inline-flex;
	align-items: center;
	gap: 8px;
}
.dap-pill {
	background: var(--dsw-alias-bg-layer-2);
	border: 1px solid var(--dsw-alias-border-l2);
	white-space: nowrap;
	border-radius: 999px;
	flex: none;
	align-items: center;
	gap: 6px;
	padding: 2px 10px;
	font-size: 12px;
	line-height: 18px;
	display: inline-flex;
}
.dap-pill-label { color: var(--dsw-alias-label-secondary); }
.dap-pill-val { font-variant-numeric: tabular-nums; font-weight: 600; }
.dap-headctl { flex-wrap: wrap; align-items: center; gap: 8px; margin-left: auto; display: flex; }
.dap-dirty { color: oklch(70.5% .213 47.604); font-size: 12px; }
.dap-saved { color: oklch(72.3% .219 149.579); font-size: 12px; }
.dap-btn {
	border: 1px solid var(--dsw-alias-border-l2);
	background: var(--dsw-alias-bg-layer-2);
	color: var(--dsw-alias-label-secondary);
	border-radius: 999px;
	padding: 4px 14px;
	font-family: inherit;
	font-size: 12px;
	line-height: 18px;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 5px;
	transition: border-color .18s ease, color .18s ease, background-color .18s ease;
}
.dap-btn:hover:not(:disabled) {
	border-color: var(--dsw-alias-label-secondary);
	background: var(--dsw-alias-interactive-bg-hover);
	color: var(--dsw-alias-label-primary);
}
.dap-btn:disabled { opacity: .45; cursor: default; }
.dap-btn-primary, .dap-btn-primary:hover:not(:disabled) {
	background: var(--dsw-alias-button-primary-fill, #2563eb);
	color: var(--dsw-alias-label-primary-foreground, #fff);
	border-color: transparent;
}
.dap-btn-danger:hover:not(:disabled) { border-color: var(--dsw-alias-state-error-primary, #ef4444); color: var(--dsw-alias-state-error-primary, #ef4444); }
.dap-btn-sm { padding: 1px 9px; font-size: 11px; }
.dap-cols { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 12px; align-items: start; }
@container dap-page (width <= 980px) { .dap-cols { grid-template-columns: minmax(0, 1fr); } }
.dap-col { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.dap-col-sticky { position: sticky; top: 12px; }
@container dap-page (width <= 980px) { .dap-col-sticky { position: static; } }
.dap-card {
	background: var(--dsw-alias-bg-layer-1);
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 10px;
	padding: 12px 14px;
	box-sizing: border-box;
	min-width: 0;
}
.dap-card-title { align-items: center; gap: 8px; margin-bottom: 10px; font-weight: 600; font-size: 13px; display: flex; }
.dap-card-sub { color: var(--dsw-alias-label-secondary); margin-left: auto; font-size: 11px; font-weight: 400; }
.dap-hint { color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 1.55; margin: 0; }
.dap-field { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 10px; }
.dap-field:last-child { margin-bottom: 0; }
.dap-field-label { color: var(--dsw-alias-label-secondary); font-size: 12px; min-width: 64px; }
.dap-seg {
	background: var(--dsw-alias-bg-layer-2);
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 7px;
	gap: 2px;
	padding: 2px;
	display: inline-flex;
}
.dap-seg-btn {
	color: var(--dsw-alias-label-secondary);
	cursor: pointer;
	white-space: nowrap;
	transition: background-color .18s ease, color .18s ease;
	background: transparent;
	border: 0;
	border-radius: 5px;
	padding: 5px 12px;
	font-family: inherit;
	font-size: 12px;
	line-height: 1.1;
}
.dap-seg-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }
.dap-seg-on, .dap-seg-on:hover { background: var(--dsw-alias-button-primary-fill, #2563eb); color: var(--dsw-alias-label-primary-foreground, #fff); }
.dap-switches { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
@container dap-page (width <= 620px) { .dap-switches { grid-template-columns: minmax(0, 1fr); } }
.dap-sw {
	background: var(--dsw-alias-bg-layer-2);
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 8px;
	padding: 9px 10px;
	display: flex;
	gap: 10px;
	align-items: flex-start;
	min-width: 0;
}
.dap-sw-off { opacity: .62; }
.dap-sw-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.dap-sw-name { font-weight: 600; font-size: 12.5px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.dap-sw-desc { color: var(--dsw-alias-label-secondary); font-size: 11.5px; line-height: 1.5; }
.dap-tag {
	font-size: 10px;
	font-weight: 600;
	padding: 1px 6px;
	border-radius: 999px;
	white-space: nowrap;
	background: var(--dsw-alias-bg-layer-1);
	color: var(--dsw-alias-label-secondary);
	border: 1px solid var(--dsw-alias-border-l2);
}
.dap-tag-accent { color: oklch(70.5% .213 47.604); border-color: color-mix(in srgb, oklch(70.5% .213 47.604) 45%, transparent); }
.dap-tag-link { cursor: pointer; }
.dap-tag-link:hover { color: var(--dsw-alias-label-primary); }
.dap-toggle {
	flex: none;
	width: 34px;
	height: 20px;
	border-radius: 999px;
	border: 0;
	padding: 0;
	cursor: pointer;
	position: relative;
	background: var(--dsw-alias-border-l2);
	transition: background-color .18s ease;
	margin-top: 1px;
}
.dap-toggle::after {
	content: "";
	position: absolute;
	top: 2px;
	left: 2px;
	width: 16px;
	height: 16px;
	border-radius: 50%;
	background: #fff;
	transition: transform .18s ease;
	box-shadow: 0 1px 2px rgb(0 0 0 / .25);
}
.dap-toggle-on { background: var(--dsw-alias-button-primary-fill, #2563eb); }
.dap-toggle-on::after { transform: translateX(14px); }
.dap-toggle:disabled { cursor: default; opacity: .5; }
.dap-sec { border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; margin-bottom: 8px; overflow: hidden; }
.dap-sec:last-child { margin-bottom: 0; }
.dap-sec-head {
	display: flex;
	align-items: center;
	gap: 8px;
	width: 100%;
	padding: 8px 10px;
	background: var(--dsw-alias-bg-layer-2);
	border: 0;
	color: inherit;
	font: inherit;
	text-align: left;
	cursor: pointer;
}
.dap-sec-head:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dap-sec-caret { opacity: .55; width: 10px; flex: none; }
.dap-sec-name { font-weight: 600; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dap-sec-off .dap-sec-name { color: var(--dsw-alias-label-secondary); }
.dap-sec-body { padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.dap-textarea {
	box-sizing: border-box;
	width: 100%;
	min-height: 96px;
	resize: vertical;
	background: var(--dsw-alias-bg-base, transparent);
	color: var(--dsw-alias-label-primary);
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 6px;
	padding: 8px 10px;
	font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
	font-size: 12px;
	line-height: 1.6;
	outline: none;
}
.dap-textarea:focus { border-color: var(--dsw-alias-button-primary-fill, #2563eb); }
.dap-sec-foot { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dap-count { color: var(--dsw-alias-label-secondary); font-size: 11px; font-variant-numeric: tabular-nums; margin-left: auto; }
.dap-preview {
	margin: 0;
	max-height: min(62vh, 720px);
	overflow: auto;
	white-space: pre-wrap;
	word-break: break-word;
	background: var(--dsw-alias-bg-layer-2);
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 8px;
	padding: 10px 12px;
	font-family: var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, monospace);
	font-size: 12px;
	line-height: 1.65;
}
.dap-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 10px; }
.dap-stat {
	background: var(--dsw-alias-bg-layer-2);
	border: 1px solid var(--dsw-alias-border-l2);
	border-radius: 8px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 2px;
	padding: 8px 6px;
	min-width: 0;
}
.dap-stat-label { color: var(--dsw-alias-label-secondary); font-size: 11px; font-weight: 600; }
.dap-stat-value { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; }
.dap-info { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 12px; font-size: 12px; margin: 0; }
.dap-info dt { color: var(--dsw-alias-label-secondary); }
.dap-info dd { margin: 0; word-break: break-all; }
.dap-code { font-family: var(--ds-font-family-code, ui-monospace, monospace); font-size: 11.5px; }
.dap-error { color: var(--dsw-alias-state-error-primary, #ef4444); }
`;
		document.head.appendChild(style);
	}

	/* ------------------------------------------------------------------ *
	 * Locales                                                            *
	 * ------------------------------------------------------------------ */

	const zh = {
		nav: "工作协议",
		title: "智能体工作协议",
		loading: "加载中…",
		save: "保存并生效",
		saving: "保存中…",
		discard: "放弃更改",
		dirty: "有未保存的更改",
		savedOk: "已保存，下一步模型请求起生效",
		resetAll: "恢复全部默认",
		resetAllConfirm: "清除本页做过的所有修改（档位、开关、提示词、附加规则），恢复为插件默认配置？",
		pillVersion: "版本",
		pillPreset: "档位",
		pillTokens: "约",
		tokens: "token",
		cardBasics: "档位与语言",
		fieldPreset: "档位",
		fieldLanguage: "文本语言",
		presetLite: "轻量",
		presetStandard: "标准",
		presetStrict: "严格",
		presetLiteDesc: "轻量：没有任务行、约束清单和自检要求，只保留精炼、能力路由和先问后做。适合日常对话和小改动。",
		presetStandardDesc: "标准：新任务写一行任务行；只有复杂任务才进入严格模式。",
		presetStrictDesc: "严格：所有非琐碎任务都列约束清单并逐条对照。适合发布、迁移、科研交付。",
		languageHint: "只决定注入文本用哪种语言；回复语言始终跟随用户。",
		cardSwitches: "分段开关",
		switchesHint: "开关默认跟随档位；手动改过的会标为“已单独设置”，点它可恢复跟随。",
		followPreset: "跟随档位",
		explicit: "已单独设置 ↺",
		needsClarify: "需先开启“先问后做”",
		sw_taskLine: "任务行",
		sw_taskLine_desc: "新任务的第一条回复首行写【任务】；追问和后续回复不写。",
		sw_refine: "一次精炼",
		sw_refine_desc: "把口语压成一句任务陈述并以它为执行指令，不反复改写。",
		sw_strictMode: "严格模式",
		sw_strictMode_desc: "复杂或高风险任务列约束清单与验收标准，交付时逐条对照。",
		sw_skillRouting: "能力路由",
		sw_skillRouting_desc: "按能力语义匹配技能与工具，命中先加载再执行。",
		sw_clarify: "先问后做",
		sw_clarify_desc: "只在真正有歧义时提问：一次问完、最多 3 个、带推荐项，已答过的不再问。",
		sw_researchClarify: "科研确认",
		sw_researchClarify_desc: "科研类任务开工前确认范围、口径与产出形式。",
		sw_teamPolicy: "团队策略",
		sw_teamPolicy_desc: "只有复杂任务才组建团队，并给成员写清任务与验收。",
		sw_deliveryCheck: "交付自检",
		sw_deliveryCheck_desc: "说“完成”前默念六问；仅严格模式输出逐条对照。",
		cardPrompts: "提示词",
		promptsHint: "点开任意一段即可改写正文。标题和编号自动生成；改写后的段落不再随开关变化措辞，可随时恢复默认。",
		secIntro: "开场说明",
		tagEdited: "已修改",
		tagOff: "已关闭",
		tagAlways: "常驻",
		restoreDefault: "恢复默认",
		chars: "字符",
		cardRules: "附加规则",
		rulesHint: "每行一条，追加为协议的最后一段。适合放你自己的固定要求。",
		rulesPlaceholder: "例如：\n提交前先跑测试\n不要改动 vendor/ 目录",
		cardPreview: "最终注入文本",
		previewDraft: "预览（未保存）",
		previewLive: "当前生效",
		copy: "复制",
		copied: "已复制",
		statChars: "字符数",
		statTokens: "约 token",
		statSections: "段数",
		cardInfo: "信息",
		infoEffect: "生效时机",
		infoEffectVal: "保存后，所有会话从下一次模型请求起使用新文本（包括进行中的会话）。提示词缓存会因此失效一次。",
		infoStorage: "保存位置",
		infoBase: "底层配置",
		infoBaseVal: "本页的修改叠加在“设置 → 插件”里 agent-protocol 那一行之上；恢复全部默认后回到那一行的配置。",
		infoScope: "作用范围",
		infoScopeVal: "当前 profile 下的所有智能体，含子智能体与后台任务。这是行为指引，不是硬门禁。",
		infoOrder: "段落排序",
		errLoad: "加载失败：",
	};

	const en = {
		nav: "Work protocol",
		title: "Agent work protocol",
		loading: "Loading…",
		save: "Save & apply",
		saving: "Saving…",
		discard: "Discard",
		dirty: "Unsaved changes",
		savedOk: "Saved — applies from the next model request",
		resetAll: "Reset everything",
		resetAllConfirm: "Clear every change made on this page (preset, switches, prompts, extra rules) and return to the plugin defaults?",
		pillVersion: "Version",
		pillPreset: "Preset",
		pillTokens: "≈",
		tokens: "tokens",
		cardBasics: "Preset & language",
		fieldPreset: "Preset",
		fieldLanguage: "Text language",
		presetLite: "Lite",
		presetStandard: "Standard",
		presetStrict: "Strict",
		presetLiteDesc: "Lite: no task line, constraint list or self-check; refinement, routing and clarification only. For conversation and small edits.",
		presetStandardDesc: "Standard: one task line per new task; strict mode only for complex work.",
		presetStrictDesc: "Strict: every non-trivial task gets a constraint list and an item-by-item check. For releases, migrations, research deliverables.",
		languageHint: "Only the language of the injected text; replies always follow the user.",
		cardSwitches: "Section switches",
		switchesHint: "Switches follow the preset by default. One you changed is marked “set explicitly”; click the mark to follow the preset again.",
		followPreset: "Follows preset",
		explicit: "Set explicitly ↺",
		needsClarify: "Requires “Ask before acting”",
		sw_taskLine: "Task line",
		sw_taskLine_desc: "First reply to a new task starts with [Task]; follow-ups do not.",
		sw_refine: "Refine once",
		sw_refine_desc: "Compress the request into one task statement and execute on it, without rewriting.",
		sw_strictMode: "Strict mode",
		sw_strictMode_desc: "Complex or risky work lists constraints with acceptance criteria and checks them on delivery.",
		sw_skillRouting: "Capability routing",
		sw_skillRouting_desc: "Match skills and tools by capability and load them before acting.",
		sw_clarify: "Ask before acting",
		sw_clarify_desc: "Ask only on real ambiguity: once, at most 3 questions, with a recommendation, never repeating.",
		sw_researchClarify: "Research confirmation",
		sw_researchClarify_desc: "Research work confirms scope, definitions and output format before starting.",
		sw_teamPolicy: "Team policy",
		sw_teamPolicy_desc: "Teams only for complex work, with a clear brief per member.",
		sw_deliveryCheck: "Delivery self-check",
		sw_deliveryCheck_desc: "Six silent questions before “done”; printed only in strict mode.",
		cardPrompts: "Prompts",
		promptsHint: "Open a section to rewrite its body. Titles and numbers are generated; a rewritten section no longer changes wording with the switches, and can be restored at any time.",
		secIntro: "Opening sentence",
		tagEdited: "Edited",
		tagOff: "Off",
		tagAlways: "Always on",
		restoreDefault: "Restore default",
		chars: "chars",
		cardRules: "Additional rules",
		rulesHint: "One per line, appended as the protocol's last section. A place for your own standing requirements.",
		rulesPlaceholder: "e.g.\nRun the tests before committing\nNever touch vendor/",
		cardPreview: "Injected text",
		previewDraft: "Preview (unsaved)",
		previewLive: "In effect",
		copy: "Copy",
		copied: "Copied",
		statChars: "Characters",
		statTokens: "≈ Tokens",
		statSections: "Sections",
		cardInfo: "Info",
		infoEffect: "Takes effect",
		infoEffectVal: "After saving, every session uses the new text from its next model request (running sessions included). Prompt caching is invalidated once.",
		infoStorage: "Stored at",
		infoBase: "Base config",
		infoBaseVal: "Changes here layer on top of the agent-protocol row in Settings → Plugins; resetting everything returns to that row.",
		infoScope: "Scope",
		infoScopeVal: "Every agent of this profile, subagents and background runs included. This is guidance, not a hard gate.",
		infoOrder: "Section order",
		errLoad: "Failed to load: ",
	};

	/* ------------------------------------------------------------------ *
	 * Icon                                                               *
	 * ------------------------------------------------------------------ */

	function ProtocolIcon({ size = 18 }) {
		return h("svg", {
			width: size, height: size, viewBox: "0 0 24 24", fill: "none",
			stroke: "currentColor", strokeWidth: "1.9", strokeLinecap: "round", strokeLinejoin: "round",
			"aria-hidden": "true",
		},
			h("rect", { x: "5", y: "4", width: "14", height: "17", rx: "2.5" }),
			h("path", { d: "M9 4.5V3.6c0-.6.5-1.1 1.1-1.1h3.8c.6 0 1.1.5 1.1 1.1v.9" }),
			h("path", { d: "m8.6 11.2 1.5 1.5 2.7-2.9" }),
			h("path", { d: "M8.8 16.6h6.4" })
		);
	}

	/* ------------------------------------------------------------------ *
	 * Store: server state, local draft, debounced preview                *
	 * ------------------------------------------------------------------ */

	async function call(route, body) {
		const response = await fetch(`${API}/${route}`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(body ?? {}),
		});
		const result = await response.json();
		if (!result?.ok) throw new Error(result?.error?.message ?? `HTTP ${response.status}`);
		return result.value;
	}

	const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

	const store = {
		saved: null,     // last state confirmed by the host
		view: null,      // state rendered: the saved one, or a preview of the draft
		draft: {},       // overrides being edited
		rulesText: null, // raw textarea content of the extra rules while typing
		busy: false,
		error: null,
		justSaved: false,
		previewTimer: null,
		previewSeq: 0,
		listeners: new Set(),
		notify() { for (const fn of this.listeners) fn(); },
		subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
		get dirty() { return this.saved !== null && !same(this.draft, this.saved.overrides); },
		adopt(state) {
			this.saved = state;
			this.view = state;
			this.draft = JSON.parse(JSON.stringify(state.overrides ?? {}));
			this.rulesText = null;
		},
		async run(task) {
			this.busy = true;
			this.error = null;
			this.notify();
			try {
				await task();
			} catch (err) {
				this.error = err instanceof Error ? err.message : String(err);
			} finally {
				this.busy = false;
				this.notify();
			}
		},
		load() { return this.run(async () => this.adopt(await call("state"))); },
		save() {
			return this.run(async () => {
				clearTimeout(this.previewTimer);
				this.previewSeq++;
				this.adopt(await call("save", { overrides: this.draft }));
				this.justSaved = true;
			});
		},
		reset() {
			return this.run(async () => {
				clearTimeout(this.previewTimer);
				this.previewSeq++;
				this.adopt(await call("reset"));
				this.justSaved = true;
			});
		},
		discard() {
			clearTimeout(this.previewTimer);
			this.previewSeq++;
			this.adopt(this.saved);
			this.notify();
		},
		/** Apply an edit to the draft and refresh the preview shortly after. */
		edit(mutate) {
			const next = JSON.parse(JSON.stringify(this.draft));
			mutate(next);
			this.draft = next;
			this.justSaved = false;
			this.notify();
			clearTimeout(this.previewTimer);
			const seq = ++this.previewSeq;
			this.previewTimer = setTimeout(async () => {
				try {
					const state = await call("state", { draft: next });
					if (seq !== this.previewSeq) return;
					this.view = state;
					this.error = null;
				} catch (err) {
					if (seq !== this.previewSeq) return;
					this.error = err instanceof Error ? err.message : String(err);
				}
				this.notify();
			}, 220);
		},
	};

	/* ------------------------------------------------------------------ *
	 * Pieces                                                             *
	 * ------------------------------------------------------------------ */

	function Segmented({ value, options, onChange }) {
		return h("div", { className: "dap-seg", role: "group" },
			options.map(([key, label]) => h("button", {
				key,
				type: "button",
				className: "dap-seg-btn" + (value === key ? " dap-seg-on" : ""),
				"aria-pressed": value === key,
				onClick: () => onChange(key),
			}, label))
		);
	}

	function SwitchRow({ id, view, t }) {
		const on = view.options[id];
		const explicit = view.explicit[id];
		const blocked = id === "researchClarify" && !view.options.clarify;
		return h("div", { className: "dap-sw" + (on ? "" : " dap-sw-off") },
			h("div", { className: "dap-sw-text" },
				h("span", { className: "dap-sw-name" },
					t(`sw_${id}`),
					blocked
						? h("span", { className: "dap-tag" }, t("needsClarify"))
						: explicit
							? h("button", {
								type: "button",
								className: "dap-tag dap-tag-accent dap-tag-link",
								title: t("followPreset"),
								onClick: () => store.edit((draft) => { draft[id] = null; }),
							}, t("explicit"))
							: h("span", { className: "dap-tag" }, t("followPreset"))
				),
				h("span", { className: "dap-sw-desc" }, t(`sw_${id}_desc`))
			),
			h("button", {
				type: "button",
				role: "switch",
				"aria-checked": on,
				"aria-label": t(`sw_${id}`),
				disabled: blocked,
				className: "dap-toggle" + (on ? " dap-toggle-on" : ""),
				onClick: () => store.edit((draft) => { draft[id] = !on; }),
			})
		);
	}

	/** One editable block: the opening sentence or a section body. */
	function PromptBlock({ id, title, tags, body, defaultBody, overridden, off, open, onToggle, limit, t }) {
		const setText = (value) => store.edit((draft) => {
			const texts = { ...(draft.sectionText ?? {}) };
			// Typing the built-in text back in is the same as having no override.
			if (value.trim() === "" || value.trim() === defaultBody.trim()) delete texts[id];
			else texts[id] = value;
			draft.sectionText = texts;
		});
		// Render from the draft, not the host's echo, so typing never lags behind the preview.
		const local = store.draft.sectionText?.[id];
		const value = local ?? defaultBody;
		return h("div", { className: "dap-sec" + (off ? " dap-sec-off" : "") },
			h("button", { type: "button", className: "dap-sec-head", "aria-expanded": open, onClick: onToggle },
				h("span", { className: "dap-sec-caret" }, open ? "▾" : "▸"),
				h("span", { className: "dap-sec-name" }, title),
				overridden || local !== undefined ? h("span", { className: "dap-tag dap-tag-accent" }, t("tagEdited")) : null,
				tags
			),
			open ? h("div", { className: "dap-sec-body" },
				h("textarea", {
					className: "dap-textarea",
					value,
					maxLength: limit,
					spellCheck: false,
					rows: Math.min(14, Math.max(4, value.split("\n").length + 1)),
					onChange: (event) => setText(event.target.value),
				}),
				h("div", { className: "dap-sec-foot" },
					h("button", {
						type: "button",
						className: "dap-btn dap-btn-sm",
						disabled: !(overridden || local !== undefined),
						onClick: () => store.edit((draft) => {
							const texts = { ...(draft.sectionText ?? {}) };
							delete texts[id];
							draft.sectionText = texts;
						}),
					}, t("restoreDefault")),
					h("span", { className: "dap-count" }, `${value.length} / ${limit} ${t("chars")}`)
				)
			) : null
		);
	}

	/* ------------------------------------------------------------------ *
	 * Page                                                               *
	 * ------------------------------------------------------------------ */

	function ProtocolPage({ t, inModal = false }) {
		const [, setTick] = React.useState(0);
		const [openIds, setOpenIds] = React.useState(() => ({}));
		const [copied, setCopied] = React.useState(false);

		React.useEffect(() => {
			const unsub = store.subscribe(() => setTick((x) => x + 1));
			if (store.saved === null && !store.busy) store.load();
			return unsub;
		}, []);

		const view = store.view;
		const toggle = (id) => setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }));

		const head = h("div", { className: "dap-head", "data-window-drag": !inModal || undefined },
			h("h1", { className: "dap-title" }, h(ProtocolIcon, { size: 20 }), t("title")),
			view ? h(React.Fragment, null,
				h("span", { className: "dap-pill" },
					h("span", { className: "dap-pill-label" }, t("pillVersion")),
					h("span", { className: "dap-pill-val" }, `v${view.version}`)
				),
				h("span", { className: "dap-pill" },
					h("span", { className: "dap-pill-label" }, t("pillPreset")),
					h("span", { className: "dap-pill-val" }, view.options.preset)
				),
				h("span", { className: "dap-pill" },
					h("span", { className: "dap-pill-label" }, t("pillTokens")),
					h("span", { className: "dap-pill-val" }, `${view.stats.tokens} ${t("tokens")}`)
				)
			) : null,
			h("div", { className: "dap-headctl" },
				store.dirty ? h("span", { className: "dap-dirty" }, t("dirty"))
					: store.justSaved ? h("span", { className: "dap-saved" }, t("savedOk")) : null,
				h("button", { type: "button", className: "dap-btn", disabled: !store.dirty || store.busy, onClick: () => store.discard() }, t("discard")),
				h("button", { type: "button", className: "dap-btn dap-btn-primary", disabled: !store.dirty || store.busy, onClick: () => store.save() },
					store.busy ? t("saving") : t("save"))
			)
		);

		let body;
		if (!view) {
			body = h("div", { className: "dap-card" }, store.error ? h("span", { className: "dap-error" }, t("errLoad") + store.error) : t("loading"));
		} else {
			const preset = view.options.preset;
			const presetDesc = t(preset === "lite" ? "presetLiteDesc" : preset === "strict" ? "presetStrictDesc" : "presetStandardDesc");
			const limit = view.limits.sectionChars;
			const rules = store.rulesText ?? (store.draft.extraRules ?? view.options.extraRules).join("\n");
			const enabledCount = view.sections.filter((section) => section.enabled).length + (view.options.extraRules.length ? 1 : 0);

			const left = h("div", { className: "dap-col" },
				h("div", { className: "dap-card" },
					h("div", { className: "dap-card-title" }, t("cardBasics")),
					h("div", { className: "dap-field" },
						h("span", { className: "dap-field-label" }, t("fieldPreset")),
						h(Segmented, {
							value: preset,
							options: [["lite", t("presetLite")], ["standard", t("presetStandard")], ["strict", t("presetStrict")]],
							onChange: (key) => store.edit((draft) => { draft.preset = key; }),
						})
					),
					h("p", { className: "dap-hint", style: { marginBottom: 12 } }, presetDesc),
					h("div", { className: "dap-field" },
						h("span", { className: "dap-field-label" }, t("fieldLanguage")),
						h(Segmented, {
							value: view.options.language,
							options: [["zh", "中文"], ["en", "English"]],
							onChange: (key) => store.edit((draft) => { draft.language = key; }),
						}),
						h("span", { className: "dap-hint" }, t("languageHint"))
					)
				),

				h("div", { className: "dap-card" },
					h("div", { className: "dap-card-title" }, t("cardSwitches")),
					h("p", { className: "dap-hint", style: { marginBottom: 10 } }, t("switchesHint")),
					h("div", { className: "dap-switches" }, view.switches.map((id) => h(SwitchRow, { key: id, id, view, t })))
				),

				h("div", { className: "dap-card" },
					h("div", { className: "dap-card-title" }, t("cardPrompts")),
					h("p", { className: "dap-hint", style: { marginBottom: 10 } }, t("promptsHint")),
					h(PromptBlock, {
						id: "intro",
						title: t("secIntro"),
						tags: h("span", { className: "dap-tag" }, t("tagAlways")),
						body: view.intro.body,
						defaultBody: view.intro.defaultBody,
						overridden: view.intro.overridden,
						off: false,
						open: !!openIds.intro,
						onToggle: () => toggle("intro"),
						limit,
						t,
					}),
					view.sections.map((section) => h(PromptBlock, {
						key: section.id,
						id: section.id,
						title: section.title,
						tags: !section.enabled ? h("span", { className: "dap-tag" }, t("tagOff"))
							: section.switch === null ? h("span", { className: "dap-tag" }, t("tagAlways")) : null,
						body: section.body,
						defaultBody: section.defaultBody,
						overridden: section.overridden,
						off: !section.enabled,
						open: !!openIds[section.id],
						onToggle: () => toggle(section.id),
						limit,
						t,
					}))
				),

				h("div", { className: "dap-card" },
					h("div", { className: "dap-card-title" }, t("cardRules")),
					h("p", { className: "dap-hint", style: { marginBottom: 10 } }, t("rulesHint")),
					h("textarea", {
						className: "dap-textarea",
						value: rules,
						placeholder: t("rulesPlaceholder"),
						spellCheck: false,
						rows: Math.min(12, Math.max(4, rules.split("\n").length + 1)),
						onChange: (event) => {
							const text = event.target.value;
							// Keep the raw text so blank lines survive while typing; the draft holds the parsed list.
							store.rulesText = text;
							store.edit((draft) => {
								draft.extraRules = text.split("\n").map((line) => line.trim()).filter(Boolean);
							});
						},
					})
				),

				h("div", null,
					h("button", {
						type: "button",
						className: "dap-btn dap-btn-danger",
						disabled: store.busy,
						onClick: () => { if (window.confirm(t("resetAllConfirm"))) store.reset(); },
					}, t("resetAll"))
				)
			);

			const right = h("div", { className: "dap-col dap-col-sticky" },
				h("div", { className: "dap-card" },
					h("div", { className: "dap-card-title" },
						t("cardPreview"),
						h("span", { className: "dap-tag" + (store.dirty ? " dap-tag-accent" : "") }, store.dirty ? t("previewDraft") : t("previewLive")),
						h("span", { className: "dap-card-sub" },
							h("button", {
								type: "button",
								className: "dap-btn dap-btn-sm",
								onClick: async () => {
									try {
										await navigator.clipboard.writeText(view.text);
										setCopied(true);
										setTimeout(() => setCopied(false), 1500);
									} catch { /* clipboard unavailable: the text is selectable below */ }
								},
							}, copied ? t("copied") : t("copy"))
						)
					),
					h("div", { className: "dap-stats" },
						h("div", { className: "dap-stat" }, h("span", { className: "dap-stat-label" }, t("statTokens")), h("span", { className: "dap-stat-value" }, String(view.stats.tokens))),
						h("div", { className: "dap-stat" }, h("span", { className: "dap-stat-label" }, t("statChars")), h("span", { className: "dap-stat-value" }, String(view.stats.chars))),
						h("div", { className: "dap-stat" }, h("span", { className: "dap-stat-label" }, t("statSections")), h("span", { className: "dap-stat-value" }, String(enabledCount)))
					),
					store.error ? h("p", { className: "dap-hint dap-error", style: { marginBottom: 8 } }, store.error) : null,
					h("pre", { className: "dap-preview", tabIndex: 0 }, view.text)
				),
				h("div", { className: "dap-card" },
					h("div", { className: "dap-card-title" }, t("cardInfo")),
					h("dl", { className: "dap-info" },
						h("dt", null, t("infoEffect")), h("dd", null, t("infoEffectVal")),
						h("dt", null, t("infoScope")), h("dd", null, t("infoScopeVal")),
						h("dt", null, t("infoBase")), h("dd", null, t("infoBaseVal")),
						h("dt", null, t("infoStorage")), h("dd", { className: "dap-code" }, view.storagePath ?? "—"),
						h("dt", null, t("infoOrder")), h("dd", { className: "dap-code" }, String(view.options.sectionOrder))
					)
				)
			);

			body = h("div", { className: "dap-cols" }, left, right);
		}

		const content = h("div", { className: inModal ? "dap-modal-root" : "dap-content" }, head, body);
		if (inModal) return content;
		return h("section", { className: "dap-page", "aria-label": t("title") }, h("div", { className: "dap-scroll" }, content));
	}

	/* ------------------------------------------------------------------ *
	 * Registration                                                       *
	 * ------------------------------------------------------------------ */

	function apply(ctx) {
		ctx.effect(() => ctx.locale.register(NS, { zh, en }), "agent-protocol: dictionaries");
		const t = ctx.locale.bind(NS);

		// Full-page view, opened from the sidebar entry with the same id.
		ctx.slots.inject("main", () => ctx.slots.register({
			name: "main",
			key: NS,
			locale: NS,
		}, () => h(ProtocolPage, { t, inModal: false })));

		ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
			name: "sidebar.panellist",
			id: NS,
			order: 27,
			label: () => t("nav"),
			locale: NS,
		}, (props = {}) => h(ProtocolIcon, { size: typeof props.size === "number" ? props.size : 18 })));

		// The same page inside Settings, for people who look there first.
		ctx.slots.inject("settings.section", () => ctx.slots.register({
			name: "settings.section",
			id: "agent-protocol",
			order: 46,
			label: () => t("nav"),
			locale: NS,
			inject: () => ({ t }),
		}, () => h(ProtocolPage, { t, inModal: true })));
	}

	exports.name = name;
	exports.inject = inject;
	exports.apply = apply;
	return module.exports;
} });
