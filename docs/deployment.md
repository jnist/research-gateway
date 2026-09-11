# CI 与 GitHub Pages

官方仓库：`jnist/research-gateway`；发布分支：`main`。工作流位于 `.github/workflows/ci-pages.yml`，只发布 Astro 静态输出 `dist/`。

## 首次配置

1. 确认 `.nvmrc` 与 `package-lock.json` 已纳入 Git。工作流用 `.nvmrc` 安装 Node，以 `npm ci` 安装锁定依赖。Astro 升级要求更高 Node 时，同步调整 `.nvmrc` 与 `package.json` 的 engines，并重新验证。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。工作流不自动启用 Pages，不需要 PAT。
3. 在同一仓库的 **Settings → Pages → Custom domain** 填写 `research.jnist.cn`。
4. 检查 `github-pages` environment 的 deployment branch 规则只允许 `main`，可按团队需求加人工审批。
5. 在分支保护中要求 `Checks (root)`、`Checks (project)` 成功。实际部署由合入 `main` 后的 push 触发；手动执行时在 Actions 中选择 `CI and Pages`，分支选择 `main`。

正式发布地址为 `https://research.jnist.cn/`。发布 job 固定使用：

```yaml
SITE_URL: https://research.jnist.cn
SITE_BASE: /
```

发布 job 不读取 repository variables 中的 `SITE_URL`、`SITE_BASE`，旧变量可删除。
`/research-gateway/` 仅用于兼容性测试，该测试产物不会上传或部署。

## 工作流行为

| Job | 执行条件与内容 | Token 权限 |
| --- | --- | --- |
| `checks` | 每个 PR、分支 push、手动运行；分别在 `/` 与 `/research-gateway/` 执行 check、unit tests、data validation、build、e2e | `contents: read` |
| `pages-artifact` | 两个检查均成功，且为官方仓库 `main` 的 push 或手动运行；按自定义域名根路径重新 build、e2e、检查发布边界，上传一次 `dist/` | `contents: read`、`pages: read` |
| `deploy` | artifact job 成功后，在 `github-pages` environment 部署；若该提交已不是 `main` 当前 HEAD，则跳过 | `contents: read`、`pages: write`、`id-token: write` |

PR 不读取项目 secrets、不部署，不使用 `pull_request_target`；checkout 不保留 Git 凭据。两个 matrix 项不上传 Pages artifact，避免同名 artifact 冲突。部署 job 不执行仓库脚本，写权限与 OIDC 仅在此 job 开启。

同一主分支的 push 和手动运行共用 concurrency group，不中断正在执行的部署；非主分支的新运行可取消同组旧运行。GitHub concurrency 不是保留所有提交的 FIFO 队列，合并期间的 pending run 可能被更新提交替换。部署前额外检查 `main` HEAD，过期重跑不会覆盖新版本。不要另外启用一套 Pages 上传或部署工作流。

所有 e2e 都测试已 build 的 `dist/` preview。build 与测试使用相同的 `SITE_URL`、`SITE_BASE`。正式发布前还会检查 canonical、导航和资源路径，确认自定义域名没有仓库名前缀。

## 自定义域名

1. 按 GitHub Pages 官方文档配置域名验证、DNS 与 **Settings → Pages → Custom domain**，并在可用后启用 HTTPS。
2. 当前域名为 `research.jnist.cn`，DNS 的 CNAME 目标为 `jnist.github.io`。如需更换域名，同步更新 Pages 设置、仓库 `CNAME`、发布 job 的 `SITE_URL` 与 Astro 默认 `site`；`SITE_BASE` 保持 `/`。
3. 在 `main` 手动运行工作流，确认生产链接、导航、CSV、CIF、relaxed-supercell 下载均使用新域名和根路径。

本项目使用 GitHub Actions 直接发布 Pages，域名绑定以仓库 Pages 设置为准，根目录的 `CNAME` 文件仅记录域名。

本地复现正式默认目标：

```sh
nvm use
npm ci
npx playwright install chromium
SITE_URL=https://research.jnist.cn SITE_BASE=/ npm run build
SITE_URL=https://research.jnist.cn SITE_BASE=/ npm run test:e2e
SITE_URL=https://research.jnist.cn SITE_BASE=/ npm run preview
```

复现子路径兼容性测试时，改用 `SITE_URL=https://jnist.github.io SITE_BASE=/research-gateway/`。

## 发布边界与故障排查

- 只有 `dist/` 上传；`public/` 会复制进该目录，必须先审核其内容。不要将 `temp/`、`Release code.zip`、解压后的上游 release、内部材料或符号链接放入其中。
- `npm ci` 失败：核对 lockfile 与 `package.json`，以及 `.nvmrc` 是否满足已锁定 Astro 的 engine；不要改为未锁定的 `npm install` 来掩盖问题。
- Pages configure 失败：先确认 Source 已选 GitHub Actions；不要通过增加 PAT 或给 PR 写权限绕过。
- 页面有样式或下载 404：检查 base，重新 build 后再测试；站内链接统一走 `href(path)`，不要硬编码站点根路径。
- deploy 等待或拒绝：检查 environment 审批、仅 `main` 的部署规则及 Actions 日志。`Skipping deployment` 表示 `main` 已前进，应查看新提交运行。
- 需要回滚：经审核在新 PR 中还原有问题的变更，合入 `main` 后重新检查与部署。不要重跑旧提交绕过当前 HEAD 检查，也不要删除已对外发布的数据版本。

## Actions 版本维护

2026-09-10 已对照 `actions/*` 官方仓库的 Git ref API 与 action 定义核验以下版本线，并在工作流固定其完整 commit SHA；这里不声称它们是最新版本。

| 官方 Action | 核验版本线 |
| --- | --- |
| `actions/checkout` | `v6` |
| `actions/setup-node` | `v6` |
| `actions/configure-pages` | `v5` |
| `actions/upload-pages-artifact` | `v4` |
| `actions/deploy-pages` | `v4` |

官方来源：`https://github.com/actions/<action-name>`；版本 SHA 可通过 `https://api.github.com/repos/actions/<action-name>/git/ref/tags/<version>` 核对。Pages 配置参考 `https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages`，自定义域名参考 `https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site`。

升级时阅读对应 release 与 `action.yml`，核对 runner/Node 兼容性、输入与权限，再替换 SHA 和版本注释。Action 自身的运行时与项目 `.nvmrc` 是两回事；工作流使用 GitHub-hosted `ubuntu-24.04` runner。
