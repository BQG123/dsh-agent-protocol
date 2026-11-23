# dsh-agent-protocol

**把同一套工作协议注入当前 profile 下每个智能体的系统提示。**

[English](README.md) | 中文

智能体会漂移：同一件事，这次开篇给任务行，下次直接甩结果；这次改配置前先问，
下次直接覆盖。这个插件把“怎么做事”写成一段固定文本灌进系统提示——先给什么、
怎么压缩口语、何时先加载技能、什么时候必须先问、交付前核对什么——让同一 profile
里的每个智能体遵守同一套规矩。

只加一个系统提示段，不带工具、不联网。自带一个设置页，可以切档位、开关各段、改写提示词并预览最终注入的文本。

## 注入内容

段落按下表顺序出现，编号在生成时连续排列——关掉某一段，后面的编号自动前移。

| 段 | 开关 | 作用 |
|---|---|---|
| 可见性 | `taskLine` | 新任务的**第一条**回复首行写【任务】行（15–40 字）；追问、后续回复、简短问答不写。未确认的前提单列【假设】行（常驻） |
| 一次精炼 | `refine` | 把口语压成一句任务陈述，即执行指令，不再写第二版 |
| 严格模式 | `strictMode` | 约束 ≥3 条、跨 ≥2 子系统或约 ≥5 个文件、不可逆、>10 分钟、或明确要求严谨 → 约束清单 + 逐条验收；未触发时不输出清单 |
| 能力路由 | `skillRouting` | 按能力语义匹配技能与工具，命中先加载再执行，可串联 |
| 先问后做 | `clarify` | 五类触发才问，一次问完、最多 3 问、带选项与推荐；能查到的、可逆且代价小的、用户已说“直接做”的不问；子智能体/后台任务不提问，改写【假设】 |
| └ 科研确认 | `researchClarify` | 科研类任务开工前确认范围、口径与产出形式（已给出的项不重复问） |
| 团队 | `teamPolicy` | 仅 ≥4 步且可并行、调研→实现→验证、长耗时或明确要求才建队 |
| 效率与安全 | 常驻 | 独立子任务并行；改删前备份；大文件先检索；跟随用户语言、结论先行 |
| 交付自检 | `deliveryCheck` | 六问默念，不必输出；仅严格模式输出逐条对照 |
| 附加规则 | `extraRules` | 你自己的条款，追加在最后 |

协议开头声明：与用户当前的明确指示冲突时，以用户指示为准。

## 安装

**插件商城**：Discover → 搜索后安装，bundle 只新增一行名为 `agent-protocol` 的 Host 行，
不改动任何 profile 文件。

**本地目录（开发用）**：设置 → 插件 → 添加插件 → 选择本目录；或让智能体调用
`plugin_manager` 的 `install_bundle`。

**npm**：把 `dsh-agent-protocol` 加进 profile 的依赖，并列入该 profile
`package.json` 的 `dsh.profile.bundles`（插件管理器会自动做这两步）。

## 设置页

安装后侧栏多出 **工作协议** 入口（设置里也有同名分节）。页面上可以：

- 切换档位和注入文本的语言；
- 单独开关每一段——手动改过的开关会标为“已单独设置”，点一下恢复跟随档位；
- 改写任意一段的提示词正文和开场说明，随时恢复默认；
- 维护附加规则，每行一条；
- 实时预览最终注入的全文，并看到字符数与估算的 token 数。

点 **保存并生效** 后，所有会话从下一次模型请求起使用新文本，进行中的会话也一样，不用重启。
页面上的修改保存在 `$DSH_HOME/agent-protocol/overrides.json`，叠加在下面的行配置之上；
**恢复全部默认** 会清空这个文件。

## 配置

行配置在 **设置 → 插件** 里 `agent-protocol` 这一行，是设置页的底层默认值；改动行配置需要重启生效。

| 键 | 默认 | 含义 |
|---|---|---|
| `language` | `zh` | `zh` 或 `en`，注入文本的语言（回复语言始终跟随用户） |
| `preset` | `standard` | 档位，见下表 |
| `sectionOrder` | `150` | 该段在系统提示中的排序位置 |
| `extraRules` | `[]` | 附加规则，字符串数组，每项一条 |
| `sectionText` | `{}` | 按段覆盖提示词正文，键为 `intro`、`visibility`、`refine`、`strict`、`routes`、`clarify`、`team`、`safety`、`check` |
| `taskLine` | 跟随档位 | 首条回复的【任务】行 |
| `refine` | 跟随档位 | 一次精炼 |
| `strictMode` | 跟随档位 | 严格模式 |
| `skillRouting` | 跟随档位 | 能力路由 |
| `clarify` | 跟随档位 | 先问后做 |
| `researchClarify` | 跟随档位 | 科研任务开工前确认（需 `clarify` 开启） |
| `teamPolicy` | 跟随档位 | 仅复杂任务建队 |
| `deliveryCheck` | 跟随档位 | 交付自检 |

### 档位

| 开关 | `lite` | `standard` | `strict` |
|---|---|---|---|
| `taskLine` | 关 | 开 | 开 |
| `refine` | 开 | 开 | 开 |
| `strictMode` | 关 | 按触发条件 | **所有非琐碎任务** |
| `skillRouting` | 开 | 开 | 开 |
| `clarify` | 开 | 开 | 开 |
| `researchClarify` | 关 | 开 | 开 |
| `teamPolicy` | 关 | 开 | 开 |
| `deliveryCheck` | 关 | 开 | 开 |

显式写出的开关永远覆盖档位。例如想要 `standard` 但不要任务行：

    config:
      preset: standard
      taskLine: false
      extraRules:
        - 提交前先跑测试
        - 不要改动 vendor/ 目录

觉得协议打扰多，先试 `preset: lite`：只保留精炼、能力路由和先问后做，没有任何可见格式要求。

“效率与安全”段和【假设】行始终存在，它们是底线而非开关。

## 实现

`lib/index.js` 导出 Cordis 插件，apply 时只注册一个系统提示段：

    ctx.systemPrompt.section({
      name: 'agent-protocol',
      order: sectionOrder,      // 默认 150
      text: () => live.text,    // 缓存的字符串，仅在保存时更换
    })

- `lib/texts.js`：中英文措辞，纯数据。
- `lib/protocol.js`：纯逻辑。`resolveOptions` 先取档位、再叠加显式开关；`buildText` 选模板、
  丢弃关闭的段、套用按段覆盖、连续编号、末尾附版本与档位标记。
- `lib/index.js`：插件入口。合并行配置与设置页的覆盖层，注册提示段，并在
  `/api/agent-protocol/{state,save,reset}` 提供设置页用的三个接口。
- `client/client.js`：设置页，无构建步骤的纯 JS。

文本只在保存时重新生成，步骤之间逐字节不变，不破坏提示词缓存。同时导出 schemastery
`Config`，设置界面可据此校验行配置。不介入工具执行。

## 边界与隐私

- **是行为指引，不是硬门禁**：模型仍可能偏离，插件不拦截工具调用、不校验产出。
- **仅影响当前 profile**：其他 profile 的智能体看不到这段文本。
- **子智能体也会收到**：DSH 的系统提示在父子智能体间保持一致，所以协议里专门写了
  “无法向用户提问时”的规则。
- **只写一个文件**：在设置页保存时写 `$DSH_HOME/agent-protocol/overrides.json`；不写 profile 文件、不联网、无遥测。卸载后可手动删除该文件。
- **兼容性**：`engines.dsh` 要求 `>=0.2.2-rc.1 <0.3.0-0`。

## 开发

    npm test        # node --test，无依赖

改 `lib/` 或 `client/` 后需要重启 DSH 才能加载新代码。
版本号只写在 `package.json`，横幅里的版本从它读取。

## 许可

MIT，见 [LICENSE](LICENSE)。
