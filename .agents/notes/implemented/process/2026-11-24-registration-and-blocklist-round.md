# Agent Note: 2026-11-24 登记与投稿拒收轮

Status: implemented

## Problem

本轮起始 `main` 共 147 条插件索引（`4d964a4`），`community.json` 按 `id` 升序存放，宿主基线为 `@deepseek-ai/dsh@0.2.2-rc.5`。开放队列共有 141 个 PR，分成两类：

1. **常规社区 PR（6 个）**：上轮退回后已按意见修订并重新发布的 `#120`（`@muutot/dsh-session-color`）与 `#121`（`dsh-sixlayer-memory`）；新投稿的 `#123`（`dsh-connectors`）与 `#259`（`dsh-t3-inbox`，来自 fork 首次贡献者，CI 停在 `action_required`）；以及 2026-11-22 已留下修改意见、至今无新提交或回复的 `#116`（`HPC Style for AI`）与 `#119`（`dsh-handover-protocol`）。
2. **PerryLink 单日集中批量 PR（135 个，`#124`–`#258`）**：全部在 2026-11-22 `14:20Z`–`18:12Z` 四小时内按 batch 连续提交，其中包括 15 个在 2026-11-05 清退轮已移除条目的重投以及 `#137` `dsh-laya`——实测这 16 个包在 npm `latest` 的 `engines.dsh` 下界仍停在 `0.1.x`（`< 0.2.0-0`），未满足 11-05 定下的再上架门槛，且 `dsh-budget` 仓库自述已于 `2026-10-05` 冻结；其余 119 个则多为高度细分的单表核对规则包，若合入将使单一作者占比从 22/147 膨胀至 157/282（超过 55%）。

维护者明确指示：退回并关闭全部 PerryLink PR、仅处理正常 PR，同时拉黑 `PerryLink` 防止后续恶意批量投稿；既有已在 `community.json` 中的 22 个 PerryLink 条目保持不动。

## Decision

**合入 4 个常规 PR（`main` 由 147 条增至 151 条），保持 2 个待作者修改的 PR 开放，关闭 PerryLink 全部 135 个 PR 并同步落地账号级与仓库级拒收策略。**

### 合入 4 个常规 PR

- `#120` `@muutot/dsh-session-color`（squash `ad3acc79`，`ui/chat`）：先批准 fork CI run `45002187882` 并跑绿。核实 npm `latest` 已发布 `0.3.1`，`engines.dsh` 为 `>=0.2.2-rc.1 <0.3.0-0`（在 `0.2.2-rc.5` 上通过 `evaluatePluginCompatibility`），`community.json` 中英文描述已修正为「需 DSH 0.2.2+；0.2.1-rc.5 请安装旧版 0.2.1」，MIT `LICENSE` 已加入仓库与发布包，`cordis.patch.yml` 确认为纯 LF（0 CR 字节）且行 id `dsh-session-color` 无冲突。
- `#121` `dsh-sixlayer-memory`（squash `4e410b10`，`knowledge/memory`）：CI 已绿；核实 npm `latest`（`registry.npmjs.org`）已更新至 `2.0.4`（仓库提交 `f84982e3`），`cordis.patch.yml` 插入行 id 已从与 `dsh-workbench` 撞车的 `workbench` 改为 `sixlayer-memory`，MIT `LICENSE` 已补齐且打入 tarball，诊断日志路径已移出插件安装目录，`engines.dsh` 为 `>=0.2.0-rc.1 <0.3.0-0` 且零运行时依赖。
- `#123` `dsh-connectors`（squash `c8ca47e3`，`integration/bridge`）：CI 已绿；MIT 协议，基于 `@modelcontextprotocol/client@2.2.0` 实现 MCP 连接器管理（Streamable HTTP / SSE / stdio、OAuth 2.1 + PKCE、Bearer 与自定义请求头，以及 Claude Desktop / Cursor JSON 导入），与 `dsh-mcp-manager` 和 `dsh-mcptoon` 定位不重叠。源码核查控制路由 `/api/dsh-connectors` 走受认证保护的 `ctx.connection.fetch.register`，仅 OAuth 回调走 `ctx.webServer` 并带 24 字节随机 `state`，凭据存入 `ctx.credentials`，上游 `v0.1.4` 含 6 项端到端 MCP 测试且已通过，`cordis.patch.yml` 使用 `- insert: - id: dsh-connectors`。在 review 中附加非阻塞建议：目前兼容声明写在 `dsh.compatibility.dsh` 而非 `engines.dsh`，下次发版建议补上 `engines.dsh` 以触发宿主安装前预检。
- `#259` `dsh-t3-inbox`（squash `01b05e24`，`ui/panel`）：先批准 fork CI run `45149443303` 并跑绿。MIT 协议，提供独立注意力收件箱侧边栏（运行中与待处理分区、Sweep 扫选与 5 秒撤销、Snooze 暂缓、8 语言包及一键切回原生工作区视图），与 `dsh-sidebar-suite` 和 `dsh-taskfold` 定位不重叠。源码核查使用自有 `storageDomain`（`dsh_t3_inbox` / `dsh_t3_inbox_settings`）并在所有写/pin 方法上执行 `requireOwner()` 鉴权，直接读 `.git/HEAD` 获取分支信息而不派生 git 子进程，`ctx.effect` 清理完整，`engines.dsh` 在 `0.2.2-rc.5` 上通过校验，`cordis.patch.yml` 行 id 为 `dsh-t3-inbox`，上游 `v0.2.4` 7 个测试集全绿。

### 保留待作者修订的 2 个 PR

- `#116`（`WangZW928`，`HPC Style for AI`）与 `#119`（`CoolrfulDARkness`，`dsh-handover-protocol`）：自 2026-11-22 提出修改意见后均无新提交或回复，距今约 2 天（未满 7 天关闭线），本轮不重复评论，保持开放等待作者回应。

### 批量退回 PerryLink 135 个 PR 并拉黑

- 对 `#124`–`#258` 共 135 个开放 PR 逐一附带统一退回说明关闭，确认开放列表清零（0 个）。
- 通过 GitHub `/user/blocks/PerryLink` 完成账号级拉黑，并在本仓参照 `dsh-skins` 落地仓库级投稿拒收机制：`.github/submission-policy.json`、`.github/submission-policy-notice.md`、`scripts/submission-policy.mjs`、`scripts/submission-policy.test.mjs`、`.github/workflows/submission-policy.yml`、`CONTRIBUTING.md`「Submission policy」小节，并接入 `.github/workflows/ci.yml` 的 `Script tests` 步骤（`exit 3` 仅在明确命中拒绝名单时关闭，与脚本崩溃退出码 `1` 隔离）。
- 原已在 `community.json` 中的 22 个 PerryLink 条目本轮未作删除。

## Alternatives considered

- **逐条对 135 个 PerryLink PR 做三性评估或只退回 16 个 `< 0.2.0-0` 旧条目。** 否决：单日集中涌入 135 个索引 PR 已经超出维护承载与商店目录定位，即使其余 119 个把 `engines.dsh` 写到 `0.2.1+`，也无法证明真机稳定性与实用收益；维护者明确要求全部退回并拉黑。
- **只做 GitHub 账号级拉黑，不在本仓安装 `submission-policy.yml`。** 否决：账号拉黑记录只停留在个人 GitHub 账号侧，无法在仓库文档和 CI 里可审计、可测试地延续；参考 `dsh-skins` 落成策略文件后，若后续解除或新增限制有单一事实来源，且 CI 会在 `pull_request_target` 基线侧自动拦截。
- **同时从 `community.json` 删掉既有 22 个 PerryLink 条目。** 否决：不在本轮授权范围内，历史已收录条目维持现状，留待维护者后续按兼容性或维护状态另行决定。

## Consequences

- `community.json` 由 147 条增至 151 条，待本轮提交推送 `main` 后需在 `dsh-web` 移动 `satellites/dsh-community-plugins` gitlink 并重建 `market/dist`，四项新入库插件才会出现在 `dsh-market.com`。
- `PerryLink` 已被 GitHub 账号拉黑并写入 `.github/submission-policy.json`，后续来自该账号的 PR 将由 `submission-policy.yml` 在未读状态下自动说明原因并关闭；申诉路径已在 `CONTRIBUTING.md` 写明。
- `dsh-connectors` 当前未声明 `engines.dsh`（仅写了 `dsh.compatibility.dsh`），需在下个版本由作者补齐以启用宿主安装前版本检查。
