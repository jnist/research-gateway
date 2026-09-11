# 验证记录

## 2026-09-11 提交前检查

- 重新运行 Astro check 与 23 项单元测试，全部通过。
- 暂存内容检查未发现原始压缩包、temp、依赖目录、构建产物、符号链接、超过 50 MiB 的单文件或常见私钥/token 特征；此检查不等同于完整安全审计。
- `.gitattributes` 保留已发布数据快照的原始字节与 CRLF，不为了消除空白提示改写原始数据。
- 同步远端新增的 `CNAME`（`research.jnist.cn`），保留自定义域名配置。实际 Pages Source、repository variables 和 DNS 仍需按部署文档配置。

## 2026-09-11 中英文国际化

- 静态 HTML 默认英文；中文浏览器自动显示中文，其他语言回退英文。
- 手动语言选择优先于浏览器偏好；跨页面及刷新后保留。localStorage 被禁用时不崩溃，当页切换正常。
- 首页、关于页、HEC 正文、下载区、引用提示、404、无障碍属性、页面标题及摘要均提供双语。
- HEC 元素名称、搜索、统计、空状态及错误消息随语言更新，保留选择、页码和本地 CSV；精确元素符号优先于英文名称子串。
- 英文首页使用实际英文 HEC 界面截图，切回中文恢复原中文预览图；备案号码与来源引用保持原文。
- `npm run check`：0 errors、0 warnings、0 hints；`npm test`：23 项全部通过。
- `/` 与 `/research-gateway/` 两种部署路径分别 build 成功，Playwright 均为 55 项通过、1 项按条件跳过。
- 浏览器环境覆盖 `en-US`、`zh-CN`、`zh-TW`、`fr-FR`，包含禁用 JavaScript、禁用存储、英文静态下载及双语切换回归。
- 截图检查覆盖中英文桌面、手机页面；额外检查 320、720、800、1024px 宽度的页头及元素名称，无页面横向溢出或单元格文字越界。
- 新测试沿用现有 CI 的单元测试和双 base Playwright 步骤，无新增运行依赖。未执行远端 Actions、commit、push 或部署。
- 将 Playwright 生成报告排除在 TypeScript 检查外，避免检查第三方 trace viewer bundle。

## 2026-09-11 页脚与文案调整

- 删除 HEC 概览末段、引用区版本说明及关于页指定段落，不修改检索与下载逻辑。
- 全站页脚增加官网 ICP、公安备案号码及原始查询链接；来源和域名覆盖限制见 `asset-sources.md`。
- `npm run check`：0 errors、0 warnings、0 hints。
- `npm test`：14 项通过；`npm run build`：数据完整性检查及静态构建通过。
- 根路径 `npm run test:e2e`：33 项通过、1 项按条件跳过。
- 新增 6 项桌面/手机回归测试，覆盖首页、关于页、HEC 页的备案链接和指定文案移除。
- 人工检查两种视口的页脚截图，无文字重叠、截断或页面横向溢出。
- 本次未重新运行子路径构建或远端 GitHub Actions；本地开发服务 `/about/` 返回更新后的内容。

## 初始构建验证

日期：2026-09-10。验证针对本地工作区，不代表 GitHub Actions 已在远端运行。

## 结果

| 检查 | 结果 |
| --- | --- |
| `npm run check` | 0 errors、0 warnings、0 hints |
| `npm test` | 14 项通过 |
| `npm run validate:data` | 717 条记录、671 CIF、671 supercell 全部索引有效 |
| 根路径 build 与 Playwright | build 成功；27 项通过，1 项按条件跳过 |
| `/research-gateway/` build 与 Playwright | build 成功；27 项通过，1 项按条件跳过 |
| 工作流静态检查 | `actionlint` 通过 |
| 发布目录检查 | 1,356 个文件，约 21.32 MiB；无 temp、原始 release、node_modules 或符号链接 |
| CSV 完整性 | 与原始 Frontend 的文件 SHA-256 一致 |

每套 Playwright 测试覆盖桌面 1440 × 1000、手机 390 × 844。
跳过项仅为“桌面 project 不运行手机菜单专属测试”；该测试在手机 project 通过。
人工检查了首页、成果页的桌面与手机截图；周期表和结果表各自横向滚动，
页面整体无横向溢出。首页预览图来自实际运行的工具。

## 功能覆盖

- 默认加载、直接访问与刷新成果页、工作区全部页面图片加载。
- 同位点多元素匹配、单元素、空选择、无结果和清空。
- 分页、稳定 record ID，以及所有匹配记录的 CSV 导出。
- CIF、VASP、完整 CSV 与 manifest 的 base-aware 下载地址。
- 本地 CSV 不上传，不关联官方结构；无效导入保留当前数据。
- 本地导入后，较早的官方数据请求不能覆盖它。
- 官方数据请求失败和损坏索引可恢复，不在交互时崩溃。
- 键盘搜索、元素按键状态、焦点、skip link、手机菜单与引用复制。
- CSV 格式、JSON 位点、元素符号、重复 ID 和 spreadsheet formula 注入防护。
- 既有版本拒绝重新导入，避免重写 checksum 基准。

## 环境与限制

本地 Node v25.6.1，Astro 7.3.2，Playwright 1.63.0 / Chromium。
CI 通过 `.nvmrc` 固定 Node 22.22.0，依赖使用已提交候选的 lockfile 安装；
本机没有该 Node 版本，未声称已在与 CI 完全相同的 Linux 环境验证。
依赖安装时 npm audit 为 0 vulnerabilities。

Astro 在 agent 环境中可能自动后台启动 CLI preview；Playwright 因此使用
`scripts/test-preview.mjs` 调用 Astro preview API，确保测试服务器随测试结束退出。
切换 base 构建后如开发服务器遇到 Vite 过期依赖，重启该开发服务器。

发布前尚需机构维护者确认数据、结构与官网图片的授权，补充正式论文作者与 DOI
（若已发表），并在 GitHub 设置 Pages Source 为 GitHub Actions。
未执行 commit、push、远端 Actions 或 Pages 部署。
