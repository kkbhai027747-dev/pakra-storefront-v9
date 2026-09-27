# Developer guide

## English

Start with the website area you are changing. This V9 snapshot has one source tree: [`theme/`](../theme/). It was read from existing V9 theme **158535483580**, observed as **unpublished** during this handoff. The download record and hashes belong in [`SOURCE.json`](../SOURCE.json). V9 and the published live theme are different targets.

| Location | Responsibility |
| --- | --- |
| [`theme/`](../theme/) | V9 Liquid, templates, browser code, styles and bundled theme assets. |
| [`dev/`](../dev/) | Local dependency scanner and its synthetic tests. |
| [`docs/`](./) | Feature map, development guidance and validation records. |
| [`SOURCE.json`](../SOURCE.json) | Original 2026-09-26 retrieval details and theme-relative hashes. |

This repository was split on 2026-09-27 from the [combined handoff at 00879b2](https://github.com/sreylekcheat-coder/pakra-cards-system/tree/00879b2821c7dce87cb1d44d1d81c0b40e08cea2). Supporting programs and prototypes are maintained separately. Their historical patches or partial theme files are not additional source copies to install here.

### 1. Choose the area and its entry point

Open [FEATURE-MAP](FEATURE-MAP.md). Follow the customer-facing area to its JSON template, section, snippets and assets. For a label, order or source-collection change, inspect the template/translation first. For interaction changes, follow the section's actual script and snippet references.

From the repository root, with Node.js available:

```sh
npm run map
npm run impact -- assets/variants.js
```

These commands need no root dependency installation. They only read local source. `map` prints file/reference counts and missing, dynamic or warning findings; `impact` follows detected callers of a theme-relative path. Use `npm run map -- --json` for the complete machine-readable scan. Change the example path to the file you intend to edit.

A template file shows a supported configuration, not a verified Shopify Page/Product/Collection assignment. Its `order`, section `type`, and `disabled` state describe the template; external assignments and merchant settings determine where it is used. Several historical-looking template/asset versions are still present in the current V9 pull. Do not delete or rename them solely because of their version suffix.

### 2. Follow shared dependencies before editing

Use the feature map's shared-impact table and the impact command together. Review callers of global layout/scripts, navigation, product cards, variants, cart interactions, translations and structured data. Static analysis cannot resolve every dynamic Liquid name, editor setting, app embed, URL or runtime event. An empty result is not proof that a file is unused.

Preserve Shopify's `assets/`, `layout/`, `sections/`, `snippets/`, `templates/`, `config/`, `locales/`, and `blocks/` structure. The feature map supplies organization without relocating runtime paths. References include section types, Liquid `render`, `asset_url`, AJAX view names and browser selectors, not just JavaScript imports.

Read the loaded asset name. Some sections load `.aio.min.css`, while others load the unminified CSS; this repository does not imply that editing one automatically rebuilds the other. Some custom sections keep styles or interaction code inline. File headers should explain responsibilities and non-obvious side effects; use JSDoc for JavaScript and Google-style docstrings for Python when function contracts need explanation.

Merchant runtime configuration in `config/settings_data.json` is intentionally excluded. Product/collection data, Page assignments, menus, app services and externally hosted media are also external state. Do not invent replacement settings to make the local theme appear runnable, or apply old host patches and partial locale bundles over newer complete files.

### 3. Check locally, then review the approved existing V9

Run the local map check and a syntax check for the JavaScript you changed:

```sh
npm run check
node --check theme/assets/variants.js
```

**`npm run check` confirms that the scanner completed. It is not a Liquid validator, a missing-reference gate, or a website acceptance test.** Review its missing/dynamic-reference output. `node --check` checks syntax only. The scanner's own synthetic tests are available as `npm run test:dev`; they test the developer tool, not storefront behavior.

For Liquid linting, use an already installed Shopify CLI and its available Theme Check tooling:

```sh
shopify theme check --path theme
```

Tool setup may need dependencies. Theme Check is a static check and does not establish app, data, cart or browser behavior. Record baseline findings separately from issues introduced by the change.

For rendered acceptance, use the **existing V9 theme's approved preview**. Confirm theme ID **158535483580** and its current role before any authorized write. Do not run `theme dev` to create another development theme. The local source is not a standalone Shopify runtime, and opening the existing preview does not display unuploaded local changes.

Uploading changes is a separate step: compare the current remote baseline and obtain the applicable exact-file approval, then upload only that approved set to the specified existing theme. Do not publish, create/copy a theme, or write to the live theme as part of code organization. A GitHub push does not deploy Shopify.

Review the changed desktop/mobile flow and the shared areas it touches. In the PR, name the website area, files and shared impact, report the commands/results, state what remains unverified, and record deployment status. Preserve concurrent work; do not automatically merge.

## 中文

网站开发从 [`theme/`](../theme/) 进入，这里保留 **2026-09-26** 从现有 V9 **158535483580** 读取的唯一主题源码；读取时角色为 **unpublished**，记录和哈希见 [`SOURCE.json`](../SOURCE.json)。V9 不等于正式主题。

本仓于 2026-09-27 从已验证的 2026-09-26 快照拆分。网站在 `theme/`，开发工具在 `dev/`，说明在 `docs/`；后台、报价工具和原型在各自独立仓库维护，不是本仓的运行依赖。旧仓库与提交只作溯源，不应把历史补丁整包覆盖进此主题。

### 1. 选区域、找入口

先读 [FEATURE-MAP](FEATURE-MAP.md)，沿模板 → section → snippet/样式/脚本查找。根目录运行 `npm run map` 查看数量、缺失/动态引用及警告；修改共享文件前运行例如 `npm run impact -- assets/variants.js`。需要完整扫描数据时用 `npm run map -- --json`。这些命令只读本地文件，无需安装根依赖。

模板存在只证明该配置被收录；模板的 `order`、`type`、`disabled` 与后台 Page/Product/Collection 绑定是不同信息。当前 V9 本身保留多个版本文件，不能仅凭版本名判定无用并删除。

### 2. 确认共享影响再修改

结合功能地图和 impact 输出检查全局布局、导航、商品卡片、变体、购物车、语言和结构化数据的调用。扫描不能完全识别动态 Liquid、设置、App 或运行时事件，空结果不代表未使用。

保留 Shopify 目录和文件路径，用地图组织业务区域；不要靠搬运行文件整理目录。核对实际加载的是 `.aio.min.css` 还是普通 CSS，不假设会自动同步构建。部分自定义 section 含内联样式/代码。文件头说明职责和副作用，函数契约按 JavaScript JSDoc、Python Google 风格说明。

`config/settings_data.json` 的商家运行设置有意排除；商品、合集、页面绑定、菜单、App 和外部媒体也不是仓库源码。不要伪造配置，也不要把旧补丁或部分语言包覆盖到现有完整文件。

### 3. 本地检查，再验收获准的现有 V9

`npm run check` **仅确认依赖扫描完成，不是 Liquid 或网站通过验收**；缺失/动态引用需阅读判断。对改动的 JS 运行 `node --check`。`npm run test:dev` 检验地图工具自身。已安装官方 CLI 时可运行上文 Theme Check，静态检查仍不能代替浏览器、App 和业务验收。

本仓的地图、扫描与开发工具测试使用 Node.js 内置模块，不需要安装后台或其他程序依赖。初始基线位于 `main`，后续修改使用功能分支和 PR。

浏览器验收使用获准的**现有 V9 预览**，不以 `theme dev` 自动创建新主题。现有预览不会显示尚未上传的本地改动。上传前另行核对 ID、role、最新远端基线和批准文件清单；代码整理不授权发布、复制主题或修改正式主题，GitHub 推送也不等于上线。

PR 写清网站区域、修改文件、共享影响、实际检查结果、未验证内容和部署状态；保留他人并行修改，不自动合并。
