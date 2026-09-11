# JNIST Research Gateway

JNIST 的 Astro 静态科研门户。研究介绍来自 Markdown，交互模块按 `tool` 字段注册，数据与结构文件使用独立的版本化目录。官方仓库为 `jnist/research-gateway`，主分支为 `main`。

支持中英文：浏览器首选语言为中文时显示简体中文，其他情况默认英文。
页头可手动切换并记住选择，切换不会清空 HEC 筛选、分页或本地导入数据。

## 本地运行

```sh
nvm install
nvm use
npm ci
npm run dev
```

浏览器访问终端显示的 HTTP 地址，不使用 `file://`。Node 版本以 `.nvmrc` 为准；依赖以 `package-lock.json` 为准。

## 验证

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

Playwright 测试 production build 的 preview；每次切换 base 都须先重新 build，测试时使用相同环境变量。Linux CI 安装浏览器时另用 `--with-deps`。

## 目录

| 路径 | 用途 |
| --- | --- |
| `src/content/research/hec.md` | HEC 研究介绍与元数据 |
| `src/content/research-en/hec.md` | HEC 英文正文 |
| `src/lib/i18n.js`、`src/components/T.astro` | 浏览器语言识别、偏好存储与双语展示 |
| `src/features/registry.ts` | `tool` 标识到 Astro 交互组件的映射 |
| `src/lib/paths.js`、`src/lib/site.ts` | base-aware 站内路径 |
| `public/data/hec/v1.0/` | CSV、manifest 与两类结构文件 |
| `.github/workflows/ci-pages.yml` | 双 base 检查与受限 Pages 部署 |
| `dist/` | 构建产物，也是唯一 Pages 上传目录 |

原始 `Release code.zip` 与 `temp/` 中的上游材料不是发布目录，不应复制进 `public/`。

## HEC 来源与许可

HEC Explorer 对应稿件 *High-Entropy Ceramics Database for Atomic-scale Simulation and Data-driven Design*。上游 README 标注为已投稿 *Computational Materials Science*，不等同于已接收或已发表。尚无经核实的最终论文 DOI；不要补写作者或将数据记录中的文献 DOI 当作本稿件 DOI。

上游 Explorer **代码**采用 MIT License，保留其版权声明与许可文本。**数据许可尚未确认**，不得据此声明 CSV、结构文件或论文均适用 MIT。文献及其链接内容遵循各自权利约定。

## 维护

- [添加研究与更新数据](docs/adding-research.md)
- [CI、GitHub Pages 与自定义域名](docs/deployment.md)
- [图片、数据来源与许可边界](docs/asset-sources.md)

PR 和分支 push 执行检查；只有官方仓库 `main` 的 push 或手动运行且检查成功，才可进入 Pages 部署。仓库需先配置 Pages，具体见部署文档。
