# 添加研究与更新数据

## 新增研究页

1. 从 `src/content/research/hec.md` 复制一份 Markdown，使用稳定、唯一的 kebab-case 文件名作为研究 slug。
2. 对照仓库当前 content schema 填写必填元数据与中文正文；`en` 提供英文摘要、状态、标签、图片描述及许可说明。另在 `src/content/research-en/<slug>.md` 提供英文正文，文件名必须与中文一致。作者、机构、论文状态、DOI 和下载地址必须有来源，未确认的信息留空或按 schema 省略。
3. 纯介绍页沿用共享研究模板，省略 `tool` 字段。需要交互模块时，在 `src/features/registry.ts` 导入对应 Astro component，并让注册键与 Markdown 的 `tool` 一致；页面 slug 来自文件名，不要求与工具键相同。不要将 HEC 专用逻辑塞入共享模板。
4. 经授权发布的资源放到 `public/data/<slug>/<version>/`。所有 `public/` 内容都可能进入成品站点，不放原始压缩包、草稿、内部材料或密钥。
5. 用 `npm run check`、`npm test`、`npm run validate:data` 检查内容和资源，再执行下方两个 base 的 build 与 e2e。

schema、模块注册方式与共享组件以当前代码为准；修改通用字段时同步维护现有研究页与测试。不要为了展示效果添加虚构研究、作者或出版信息。

必填字段：`title`、`englishTitle`、`summary`、`year`、`status`、`version`、
`tags`、`image`、`imageAlt`、`citation`、`licenseNote`、`en`。`en` 包含
`summary`、`status`、`tags`、`imageAlt`、`licenseNote`；双语标签数量须一致。
可选 `en.image` 提供英文界面的预览图，缺省时共用 `image`。
缺少同名英文正文将导致构建失败。`image` 指向 `public/`
中的授权预览图，不含 `public/` 前缀。可选字段：
`tool`、`authors`、`paperUrl`、`codeUrl`、`datasetPath`、`manifestPath`、`bibtex`。
未登记的 `tool` 会让 build 失败，不会静默省略交互模块。

## 站内路径

通过 `src/lib/site.ts` 的站点包装层调用 `href(path)`；底层 `src/lib/paths.js` 负责路径处理，包装层提供 Astro `BASE_URL`。复用现有调用形式，不在组件里拼接 `/research-gateway/`。

站内导航、CSV fetch、manifest 和结构下载都要经过同一 base-aware 路径逻辑；传入的是站内路径，不包含 `public/` 文件系统前缀。外部文献 URL 不套站内 base。不要在浏览器代码中依赖 `process.env`。

## 双语维护

- 页面短文案使用 `src/components/T.astro` 的 `zh` 和 `en` 属性；静态默认英文，隐藏的另一语言不参与布局及可访问名称。
- HTML 属性使用 `src/lib/i18n.js` 的 `attrs`，动态模块使用 `translate`；模块监听 document 的 `localechange` 更新提示，不重置用户数据或筛选状态。
- 首次访问读取浏览器首选语言：`zh` 及 `zh-*` 显示简体中文，其余语言或无法识别时显示英文。手动选择优先，以 `jnist-language` 存入 localStorage；存储被禁用时当页切换仍可用。
- 保留同一 URL、锚点与下载路径，不新增语言路由。无 JavaScript 时提供英文正文和静态下载；在线工具及语言切换不可用。
- 文献引用、DOI、数据字段名及备案号码保留原始文本，不进行翻译或改写。
- 更改语言策略时同步测试 head bootstrap、深链接、localStorage 不可用及双语交互；CI 已通过现有 `npm test` 和 `npm run test:e2e` 自动包含新测试。

## HEC 数据维护

当前发布目录：

```text
public/data/hec/v1.0/
  dataset.csv
  manifest.json
  indexes.json
  CODE-LICENSE.txt
  structures/
    cifs/
    relaxed-supercells/
```

- 将已发布版本视为不可变快照。新数据放入新版本目录，并同步研究页下载链接、模块默认资源路径、manifest 及测试；保留旧版本 URL。`scripts/validate-data.mjs` 当前校验 `v1.0`，发布新版本时须扩展其校验范围。
- 沿用 `manifest.json` 的现有结构，更新版本、记录数、统计计数、SHA-256 与许可状态；结构文件映射维护在 `indexes.json`，不凭空添加字段。`npm run validate:data` 必须通过，`CODE-LICENSE.txt` 保留原始代码版权声明。
- 结构索引始终指向原始 CSV 的 **zero-based 记录位置**，不是表格筛选、排序或分页后的行号。CSV 重排、增删记录时必须重新核对全部结构映射，不能只改计数。
- 保留原始数值、化学式语义、来源文献与代码署名；多元素筛选仍要求全部所选元素在同一晶格位点共存。未选元素时不显示结果。
- 用户导入的 CSV 只在浏览器处理，不上传，也不得因行号巧合而复用官方结构索引。相关回归测试不能跳过。
- 新资源发布前确认授权。代码 MIT 不代表数据获得 MIT 授权；数据许可未确认时明确保留该状态，不自行选择许可证。
- `scripts/import-release.mjs` 仅用于首次迁移，已存在的 `v1.0` 目录会直接拒绝导入，不能用它重新生成既有快照的 checksum。

## 提交前验证

先切换至 `.nvmrc` 指定的 Node，执行 `npm ci`，然后：

```sh
npm run check
npm test
npm run validate:data
npx playwright install chromium
SITE_URL=https://jnist.github.io SITE_BASE=/ npm run build
SITE_URL=https://jnist.github.io SITE_BASE=/ npm run test:e2e
SITE_URL=https://jnist.github.io SITE_BASE=/research-gateway/ npm run build
SITE_URL=https://jnist.github.io SITE_BASE=/research-gateway/ npm run test:e2e
```

检查新页面、导航、CSV 加载与两类结构下载，在桌面和移动端都可用。手工新增的站内链接也要覆盖；不要只验证开发服务器。检查 `dist/` 不含 `temp/`、原始 release、私有材料或符号链接。

提交只包含本次内容、资源和必要测试；不要提交 `dist/`、`node_modules/`、Playwright 产物，也不要清理其他协作者的改动。
