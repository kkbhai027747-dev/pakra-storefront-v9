# Website repository validation — 2026-09-27

## Scope and source

This records the local separation of the website repository from [combined handoff commit 00879b2](https://github.com/sreylekcheat-coder/pakra-cards-system/tree/00879b2821c7dce87cb1d44d1d81c0b40e08cea2). The source working tree was clean at that commit. Only theme source, SOURCE.json, the dependency tool, website documentation and required root configuration were copied. No supporting program or prototype subtree was included.

The Shopify source was originally retrieved on **2026-09-26** from existing V9 theme **158535483580**, observed then as **unpublished**. This split did not download it again. [SOURCE.json](../SOURCE.json) is byte-identical to the original source manifest, including retrieval time, the four confirmed concurrent updates, and theme-relative hashes. No theme runtime file was edited.

The 2026-09-27 checks below used **Node.js 24.19.0 on Windows** and required no network or dependency installation. No Git repository was initialized or committed during this local preparation, and no Shopify operation was performed.

## Checks run for this split

| Check | Actual result | Boundary |
| --- | --- | --- |
| Full theme SHA-256 comparison | **2,708 / 2,708 matched** SOURCE.json; **947,963,904 bytes** | Working-tree bytes checked, with no missing, extra or mismatched theme file. Future staged Git blobs must retain the same bytes. |
| Source manifest preservation | Byte-identical to the original | Source retrieval remains 2026-09-26; repository organization is dated 2026-09-27. |
| Exclusions and directory scope | `theme/config/settings_data.json` absent; no operations/tools/experiments/storefront/.git directory included | Theme configuration schema is included; merchant runtime settings remain excluded. |
| `npm run test:dev` | **5 passed, 0 failed** | Synthetic dependency, impact, dynamic-reference and path tests, including CLI execution from a different working directory. |
| `node dev/theme-map.mjs --check --json` | Exit **0**; **2,708 files**, **2,785 static references**, **26 missing references**, **37 dynamic references**; **0 scan errors**, **0 source warnings** | Scanner completion, not website correctness. Existing missing and dynamic references remain visible. |
| `node dev/theme-map.mjs --impact assets/variants.js --json` | Exit **0**; **9 direct**, **19 transitive callers** | Possible static impact; does not resolve all DOM/event or merchant-setting behavior. |
| Documentation links | **43 local links resolved**, no trailing whitespace | Root README/AGENTS and the developer, feature and validation guides. External provenance URLs were not fetched. |

The scanner and its fixtures now resolve `theme/` from the tool location. Root commands remain `npm run map`, `npm run check`, `npm run impact -- <theme-relative-path>` and `npm run test:dev`. See [DEVELOPER-GUIDE](DEVELOPER-GUIDE.md) for their limits.

`.gitattributes` now preserves `theme/**` without text normalization; `.gitignore` uses the new theme path for bundled-image exceptions and the merchant-settings exclusion. These are repository-path changes only. Staged-blob and remote upload checks belong to the later Git handoff.

## Historical theme lint baseline

The **2026-09-26** Shopify Theme Check run on this unchanged snapshot exited **1**, reporting **3,832 errors** and **1,513 warnings**. [THEME-CHECK-BASELINE.json](THEME-CHECK-BASELINE.json) preserves that historical command, date and counts. Its `commandInThisRepository` gives the equivalent new path:

```sh
shopify theme check --path theme --output json
```

Theme Check was **not rerun** for the repository split; no original lint finding was fixed or suppressed. The old combined repository's backend/tool/experiment test totals are not results for this website-only repository.

## Limits

- No fresh Shopify role check, remote readback, browser/cart/app test, Page/Product/Collection assignment check or merchant-configuration validation was performed.
- The repository is a preserved V9 snapshot, not a standalone Shopify server or a statement that the published live theme has these bytes.
- Existing bundled media was copied and hash-verified. This split did not rerun the original media-format checks or perform pixel/visual acceptance.
- GitHub repository creation, commits and upload were not part of these local checks. They do not authorize a Shopify upload, new theme or publication.

## 中文

本仓于 **2026-09-27** 从已验证的交接提交 `00879b2` 拆出，只保留网站、开发工具、说明和必要根配置。原 Shopify 源码仍是 **2026-09-26** 读取的 V9 `158535483580`；读取时角色为 unpublished，本次没有重新下载或修改主题运行文件。

本轮在 Windows / Node.js 24.19.0 实测：**2,708 个主题文件 SHA-256 全部一致，总计 947,963,904 字节**；SOURCE 原文件字节不变；**5 项开发工具测试通过**；真实扫描完成，保留 **26 个缺失引用、37 个动态引用**供人工复核。`variants.js` 静态影响查询记录了 9 个直接及 19 个间接调用方。

原 2026-09-26 Theme Check 的 **3,832 个 error、1,513 个 warning**仍是历史未通过记录，本次未重跑、未修复，不能称为主题验收通过。后台、SEO、图鉴的测试不属于本仓结果。

本地准备未联网、未初始化或提交 Git、未上传 Shopify。未重新验证浏览器业务、后台绑定、商家设置及正式网站状态；后续 Git 提交还需确认暂存字节和远端结果。
