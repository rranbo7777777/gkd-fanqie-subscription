# CLAUDE.md — 番茄小说去广告（GKD 订阅）

个人维护的 GKD 订阅规则仓库，目标应用：番茄免费小说（`com.dragon.read`）。
上游 gkd-kit / AIsouler 订阅均已归档，本仓库只做规则的聚合与修正，选择器以快照佐证为准，不臆造。

## 文件结构

- `番茄小说去广告.json5` —— 完整订阅（远程托管用，含订阅级字段 id/version/author/supportUri）
- `番茄小说-本地订阅粘贴.json5` —— 本地粘贴用精简版（仅单应用对象，禁止出现订阅级字段）
- `README.md` —— 概览与方案调研；`使用说明书.md` —— 面向使用者的完整文档
- `check.cjs` —— 规则文件静态校验脚本（依赖全局 json5）

## 铁律

1. 两个 json5 的 `groups` 必须深度一致；改其中一个必须同步另一个。
2. 规则文件任何字段变更（含 snapshotUrls）都必须递增 `version`，并在《使用说明书》「订阅版本历史」加一行；纯文档变更不动 version。
3. 选择器一律原样保留上游写法并附快照链接（`i.gkd.li`，格式 `https://i.gkd.li/i/<id>` 或 `/import/<id>`）；唯一无快照例外是开屏兜底规则（组内注释已说明）。
4. `preKeys` 只能引用同组显式声明了 `key` 的规则（GKD 的 ResolvedRule 语义）。

## 修改后验证

```powershell
npm i -g json5          # 仅首次需要
$env:NODE_PATH=(npm root -g); node check.cjs
```

check.cjs 覆盖：JSON5 语法、订阅级字段、组 key 唯一、preKeys 引用、快照链接格式、两文件 groups 深度一致性、启用组数统计。必须通过后再提交。

## 写文档前核查上游状态

- GitHub API `repos/gkd-kit/subscription` 与 `repos/AIsouler/GKD_subscription` 的 `archived` / `pushed_at`（2026-11-03 实测：gkd-kit 最后推送 2024-05-12，AIsouler 最后推送 2026-02-13，二者均已归档）。
- GKD 版本下限以 <https://github.com/gkd-kit/gkd/releases/latest> 为准（2026-11-03 实测最新 v1.12.1）。

## 提交约定

提交信息用一行中文说明做了什么；规则变更须注明 `version x→y`。推送前确认 `node check.cjs` 通过。
