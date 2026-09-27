# PAKRA V9 storefront

Shopify theme source for existing V9 **158535483580**, downloaded on **2026-09-26** and observed as **unpublished**. Edit the website in [`theme/`](theme/). Source hashes and retrieval details are in [SOURCE.json](SOURCE.json).

## Start here

After cloning this repository, work from its root directory. The initial website baseline belongs on `main`; make subsequent changes on a feature branch and open a pull request.

1. Find the page and shared files in [FEATURE-MAP](docs/FEATURE-MAP.md).
2. Check possible callers before editing: `npm run impact -- assets/variants.js`.
3. Follow [DEVELOPER-GUIDE](docs/DEVELOPER-GUIDE.md) for local checks and review against the approved existing V9.

From this repository root, with Node.js available and no npm dependency installation:

```sh
npm run map
npm run check
npm run test:dev
```

`map` and `check` inspect local references. They do not render or validate the website; see [VALIDATION](docs/VALIDATION.md) for recorded checks and existing findings.

| Directory or file | Purpose |
| --- | --- |
| `theme/` | The single theme source tree, preserving Shopify's required directories and original runtime filenames. |
| `dev/` | Local dependency and impact scanner with synthetic tests. |
| `docs/` | Website feature map, developer guide and validation records. |
| `SOURCE.json` | Original retrieval details and theme-relative file hashes. |

Supporting backend programs, pricing tools and prototypes are maintained in separate repositories and are not required to work on this theme.

## Source and integration

This repository was separated on **2026-09-27** from the [verified combined handoff at commit 00879b2](https://github.com/sreylekcheat-coder/pakra-cards-system/tree/00879b2821c7dce87cb1d44d1d81c0b40e08cea2). That is provenance, not a branch to check out in this repository. The split preserves the 2026-09-26 theme snapshot; it is not a new download or a claim about today's published live theme.

Merchant `theme/config/settings_data.json`, credentials, and Shopify product/Page/collection/menu/app records are not included. Templates being present does not prove they are assigned to store records. This is a source snapshot, not a standalone local Shopify server.

GitHub commits do not deploy Shopify. Theme writes require the approved existing Theme ID, current role and exact file list under [AGENTS.md](AGENTS.md). No theme creation, publication or live-theme write is authorized by this repository.

## 中文

网站源码在 [`theme/`](theme/)，来源为 **2026-09-26** 读取的现有 V9 `158535483580`，读取时角色为 unpublished。本仓于 **2026-09-27** 从已验证交接快照拆分，保留全部主题文件原字节；没有重新下载或修改网站。

初始网站基线位于 `main`，之后使用功能分支和 PR 维护。按[功能地图](docs/FEATURE-MAP.md)找页面入口，使用 `npm run impact -- <主题内相对路径>` 查看静态调用影响，再按[开发指南](docs/DEVELOPER-GUIDE.md)检查。根目录的地图、扫描和开发工具测试无需安装 npm 依赖。

本仓只包含网站、开发工具及说明；后台、报价工具和实验分别维护。商家运行设置与账号凭据不入库，模板存在不等于后台已绑定；GitHub 上传不等于修改或发布 Shopify。
