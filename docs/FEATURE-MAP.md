# Website feature map

## English

Paths below are relative to [`theme/`](../theme/). The map was checked against the V9 text source read on **2026-09-26** from theme **158535483580**, observed as **unpublished**. It maps source relationships, not current live-store behavior. Read [DEVELOPER-GUIDE](DEVELOPER-GUIDE.md) for checks and integration boundaries.

A JSON template's `order` and `disabled` fields determine its configured sections. A template's existence does not confirm its assignment to a Shopify Page, Product or Collection. Merchant settings and assignments remain external. The `live` suffix in `page.single-cards-live.json` is a template name, not a theme role.

### Website areas

| Area | Start here | Implementation and shared impact |
| --- | --- | --- |
| Homepage | [`templates/index.json`](../theme/templates/index.json) | Enabled in this template snapshot: `sections/p10-home-discovery.liquid`, `p10-home-articles.liquid`, `p10-release-timeline.liquid`, `p10-daily-store-heat.liquid`. Start with template settings/order for content. Article cards use `snippets/p10-blog-card.liquid`; timeline renders the shared `snippets/p10-faq.liquid`. Some custom markup/styles/interaction remain inside sections. |
| Desktop header, mobile drawer, navigation | [`sections/header-group.json`](../theme/sections/header-group.json) | Configured sections include announcement bar, `header-classic`, `header-navigation-plain`, `header-mobile`. Navigation flows through `snippets/halo-navigation-list.liquid` → `p10-ip-mega-menu.liquid`; mobile uses `snippets/p10-mobile-shop-nav.liquid`, `assets/p10-mobile-shop-nav-v3.js` and CSS. These affect the shared site shell. |
| Footer | [`sections/footer-group.json`](../theme/sections/footer-group.json) | Configured `custom-liquid` plus `sections/footer-01.liquid`; shared footer column/bottom snippets. Both header and footer groups are loaded by `layout/theme.liquid`. |
| IP directory | [`templates/list-collections.json`](../theme/templates/list-collections.json) → `sections/p10-shop-by-ip.liquid` | `assets/p10-ip-directory-navigator-config.js` holds choices/routes; `p10-ip-directory-navigator.js` renders interaction. `p10-ip-menu-sync.js` synchronizes directory entries into menus and emits `p10:ip-menu-updated`. Directory changes can change desktop and mobile navigation. |
| IP storefronts and Pokémon CN/EN | [`sections/p10-ip-storefront.liquid`](../theme/sections/p10-ip-storefront.liquid) | Used by `templates/collection.pokemon-tcg-cn.json`, `collection.pokemon-tcg-en.json` **and numerous `page.*` templates** for MLP, Pokémon, Marvel, Disney, DC and other IPs. Uses `assets/p10-ip-storefront.js`, its CSS/sidebar CSS, `snippets/p10-ip-sidebar.liquid`, `p10-ip-storefront-product-card.liquid`, `p10-ip-storefront-product-eligibility.liquid` and `schema.liquid`. Template-specific changes have a smaller scope than changing this shared renderer. |
| General collections and product grids | [`templates/collection.json`](../theme/templates/collection.json) → `sections/main-collection-product-grid.liquid` | Section selects collection layout snippets from settings; `snippets/product-grid-layout.liquid` selects `product-card*.liquid`. `assets/collection-filters-form.js` and `toolbar.js` support filtering/grid interactions. Product cards are also used in search, predictions and recommendations. `collection.guest-picks.json` uses `p10-guest-picks`, which reuses the IP product-card snippet. |
| Single-card catalog | [`templates/page.single-cards-live.json`](../theme/templates/page.single-cards-live.json) → `sections/p10-single-card-lounge-v6.liquid` | `assets/p10-single-card-catalog-20260719-v6.js`, `p10-single-card-catalog.css`, `p10-single-card-boxes.json`, `p10-single-card-catalog-20260715-v6.json`. Section renders `snippets/p10-single-card-mobile-menu-guard.liquid`, which operates the shared mobile drawer. Other current templates/versions remain present; inspect their `type` rather than assuming the filename selects the same version. |
| Product page, variants and sticky purchase area | [`templates/product.json`](../theme/templates/product.json) → `sections/main-product.liquid` | `main-product` branches on `settings.product_page_layout` and the audit-hold tag. Default layout uses `snippets/product-page.liquid`, which renders `product-variant.liquid`, `product-button.liquid`, `halo-sticky-add-to-cart.liquid` and loads `assets/variants.js` / `sticky-add-to-cart.js`. Sticky mobile markup uses `product-variant-sticky-mobile.liquid`. Alternative `product.template-*` layouts and `product.keegan.json` also exist. Check applicable layout and main/sticky/gallery/cart behavior together. |
| Cart page, cart drawer and add-to-cart popup | [`templates/cart.json`](../theme/templates/cart.json) → `sections/main-cart.liquid` | Cart page loads `assets/cart.js`; its optional `product-block` is disabled in this snapshot. Shared shell includes `snippets/halo-sidebar.liquid` → `halo-cart-sidebar.liquid`/`assets/halo-toolcart.js`, and `halo-popup.liquid` → `halo-cart-popup-1.liquid` when configured. `assets/theme.js`, variants and global cart settings also participate. Checkout itself is not implemented as a theme checkout application here. |
| Search page and header suggestions | [`templates/search.json`](../theme/templates/search.json) | An enabled `custom-liquid` route guard precedes `sections/main-search.liquid`. Header search uses `snippets/predictive-search-results.liquid`, `sections/predictive-search.liquid`, and `assets/predictive-search.js` when enabled. Shared product cards, filter/toolbar code and `templates/search.ajax_quick_search.liquid` support related views. A search change can affect both results and header/mobile suggestions. |
| Wishlist and product hearts | [`templates/page.template-wishlist.json`](../theme/templates/page.template-wishlist.json) → `sections/main-wishlist-page.liquid` | `snippets/global-script.liquid` loads `assets/p10-swish-provider.js` → `p10-swish-migration.js` → `p10-swish-wishlist.js`, plus CSS. Shared `theme.js`, filtering/toolbar behavior, `p10_swish` translations, app embeds and account identity are involved. Current source already includes these integration files; do not reapply historical host patches blindly. |
| Blog index and homepage article cards | [`templates/blog.json`](../theme/templates/blog.json) → `sections/p10-blog-editorial-hub.liquid` | Uses `assets/p10-blog-editorial-hub.css`/`.js`, `snippets/p10-blog-card.liquid` and `p10-blog-card-image.liquid`. Homepage article cards reuse this snippet. `page.bolg.json` also selects the hub; separate `blog.template_*` layouts remain in the theme. Their existence does not show which blogs use them. |
| Article detail | [`templates/article.json`](../theme/templates/article.json) → `sections/main-article.liquid` | `assets/p10-editorial.css`/`.js`, Fancybox/gallery assets, article markup and `snippets/schema.liquid`. Alternate `article.template_article_with_product.json` uses `main-article-with-product`. Article text/content is Shopify data. |
| FAQ | [`templates/page.faq.json`](../theme/templates/page.faq.json) → `sections/p10-faq-page.liquid` | Uses `snippets/p10-faq.liquid`, `assets/p10-faq.css`/`.js`, and translations. The homepage timeline calls the same snippet in home mode. Separate `page.template-faqs.json` → `main-faqs-page.liquid`/`assets/halo-faqs.js` is another configuration, not an interchangeable copy. |
| Merchandise, TCG and other content pages | [`templates/page.collectible-merch.json`](../theme/templates/page.collectible-merch.json), [`templates/page.tcg-battle.json`](../theme/templates/page.tcg-battle.json) | Merch selects `sections/p10-merch-hub.liquid`; TCG selects `tcg-battle-showcase.liquid`, `assets/tcg-battle-showcase.css`/`.js`, `snippets/tcg-battle-product-card.liquid`. Other `page.*` templates select main-page, lookbook, contact, about, brands or `_blocks`; inspect the actual JSON for the area being changed. Do not treat every available section as enabled. |

### Shared code: what else to review

| Shared entry | Why the impact is broader |
| --- | --- |
| [`layout/theme.liquid`](../theme/layout/theme.liquid), `snippets/global-style.liquid`, `global-script.liquid`, `global-script-2.liquid` | Loads the shell, shared styles, dark mode, hover galleries, scripts, route/stock guards and settings. `global-script-2` loads `assets/theme.js`. A change can affect every page using this layout. |
| Header/mobile files + `snippets/p10-single-card-mobile-menu-guard.liquid` | Share drawer selectors, buttons, overlays and body classes. Review directory, ordinary pages and the single-card page at mobile widths. |
| `snippets/product-grid-layout.liquid`, `product-card*.liquid`, `p10-ip-storefront-product-card.liquid` | Shared product presentation across collections, search, recommendations, guest picks or IP pages. Regular and IP cards are different rendering families. |
| `assets/variants.js`, `sticky-add-to-cart.js`, `theme.js`, cart scripts | Variant identity, selected images, price/inventory messages and add-to-cart state cross the main product area, sticky controls and cart UI. Trace actual callers before changing one event or selector. |
| `snippets/p10-blog-card.liquid`, `p10-faq.liquid` | Reused by content pages and homepage sections. A local visual change can change the homepage. |
| `snippets/meta-tags.liquid`, `schema.liquid`, `templates/robots.txt.liquid` | Shared metadata and structured-data behavior. Check all relevant page types and duplicate output. |
| `locales/en.default.json`, `locales/zh-CN.json`, `config/settings_schema.json` | Translation/configuration contracts used across many areas. Merge keys intentionally; do not replace complete locales with historical module subsets. Merchant values in `settings_data.json` are intentionally excluded. |

Run `npm run impact -- <theme-relative-path>` for detected reverse dependencies. It also reports static-analysis limits; dynamic references and backend assignments require separate review. The `.aio.min.css` assets loaded by sections are actual references: an unminified sibling is not proof of an automatic build pipeline.

Supporting programs and prototypes are maintained in their own repositories. This map describes the website source in this repository only.

## 中文

以上路径均位于 [`theme/`](../theme/)，已按 2026-09-26 从现有 V9 **158535483580** 读取的文本源码核对。它说明代码关系，不代表正式网站当前行为。模板的 `order`、`disabled` 与后台页面/商品/合集绑定是不同信息；`single-cards-live` 中的 `live` 只是名字。

### 按网站区域定位

| 区域 | 入口与影响 |
| --- | --- |
| 首页 | 本次 `templates/index.json` 快照内启用 discovery、articles、release-timeline、daily-store-heat 四类 section。文章卡片与博客共享，timeline 的 FAQ 与 FAQ 页共享。 |
| 头部、手机菜单、页脚 | 从 `header-group.json`、`footer-group.json` 看实际启用项；由 `layout/theme.liquid` 加载。手机抽屉还与单卡页面 guard 共享状态。 |
| IP 目录和页面 | 目录从 `list-collections.json` 进入；配置、renderer、menu-sync 会影响电脑及手机导航。`p10-ip-storefront` 被 Pokémon CN/EN 和大量其他 IP 页面复用，不是宝可梦专属文件。 |
| 普通合集、商品卡片 | `collection.json` → `main-collection-product-grid` → 设置选择的布局和 `product-grid-layout`。普通卡片与 IP 卡片是两套不同渲染入口，各自跨区域复用。 |
| 单卡图鉴 | `page.single-cards-live.json` → `p10-single-card-lounge-v6` → v6 JS/CSS/两份 JSON。当前主题还保留其他版本；按模板真实 `type` 判断，不凭文件名删除。 |
| 商品购买区 | `product.json` → `main-product`，再按商家设置选择 layout；默认链路为 `product-page`、variant/button/sticky snippets、`variants.js`、`sticky-add-to-cart.js`。需联查主区、底栏、图库、购物车及其他商品模板。 |
| 购物车 | `cart.json` → `main-cart`/`cart.js`；侧栏和弹窗由全局 shell 按设置加载，另有 `halo-toolcart.js` 和 `theme.js`。此快照购物车可选 product-block 已禁用。结账业务本身不在这里实现。 |
| 搜索 | `search.json` 包含启用的 route guard 和 `main-search`；头部/手机建议走 predictive-search。商品卡片与筛选代码共享。 |
| 愿望单 | `page.template-wishlist.json` → `main-wishlist-page`；Swish 三脚本由 global-script 加载，影响各处爱心、动态列表、变体和登录状态。不要重复套旧补丁。 |
| 博客、文章 | 默认博客为 `p10-blog-editorial-hub`，文章为 `main-article`。博客卡片与首页共享；其他模板仅代表可用配置，是否绑定要另核对。 |
| FAQ | `page.faq.json` → `p10-faq-page` → 共享 `p10-faq`；另有独立 `page.template-faqs`/`main-faqs-page` 配置，不能互换覆盖。 |
| 周边、TCG 和其他内容页 | `page.collectible-merch`、`page.tcg-battle` 各有入口；about/contact/lookbook 等按对应 JSON 阅读，section 存在不等于启用。 |

### 共享修改与独立工程

全局 layout/scripts、手机导航、商品卡片、variants/cart、博客卡片/FAQ、SEO schema 和语言配置均需联查上表相关区域。运行 `npm run impact -- <主题相对路径>` 查看检测到的调用；静态扫描识别不了全部动态关系，空结果不代表无影响。部分页面实际加载 `.aio.min.css`，不应假设改普通 CSS 会自动更新它。

本地图只描述本仓的网站源码；后台、运营工具和原型由各自仓库维护。详细检查与现有 V9 验收方式见 [DEVELOPER-GUIDE](DEVELOPER-GUIDE.md)。
