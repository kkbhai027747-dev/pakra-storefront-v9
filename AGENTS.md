# Repository boundaries

- Start with README.md and docs/DEVELOPER-GUIDE.md. This V9 source snapshot has one theme location: theme/. Preserve Shopify's standard directories and trace shared dependencies before editing.
- This repository contains website source, its developer tool, and documentation. Keep supporting programs and prototypes in their own repositories; do not copy their theme fragments over this snapshot wholesale.
- Use a reviewable branch and preserve concurrent changes. GitHub source upload and Shopify deployment are separate actions; never force push or auto-merge.
- Never store or print real tokens, cookies, client secrets or login state in source, logs, Git or ordinary .env files. Shopify credentials are managed only by the official Shopify CLI credential store. Customer, order, payment and gift-card data are outside scope.
- Shopify Admin access defaults to read-only. Inventory writes need separate approval; do not expand API scopes automatically.
- Before a Shopify write, present the exact object/ID or theme/file list, changed fields or diff, old/new values and expected impact, then obtain explicit authorization in the current task. Theme writes use Theme CLI, the exact existing theme ID and current role. Do not create or copy a remote theme. Only approved paths may be uploaded; never push a whole theme without a file list. Live/main writes are prohibited absent an explicit current exception. Publish only after explicit “允许发布主主题” or “发布到线上” authorization.
- The theme download, repository split, and GitHub upload do not authorize a Shopify write or publication.
