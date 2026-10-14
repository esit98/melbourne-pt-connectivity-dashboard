# GitHub Pages deployment

## Deployment status

The [separate public repository](https://github.com/esit98/melbourne-pt-connectivity-dashboard) is deployed at [GitHub Pages](https://esit98.github.io/melbourne-pt-connectivity-dashboard/). The original `esit98/melbourne-cross-suburban-pt-connectivity` was checked and remains private. The source-linked CC BY assessment and ODbL compliance package are documented in [publication readiness](PUBLICATION_READINESS.md) and [licensing review](LICENSING_REVIEW.md).

Release source commit `aa6a181aa3857b5cded093940de4f910dc0268b1` passed [Actions run 38545950279, attempt 2](https://github.com/esit98/melbourne-pt-connectivity-dashboard/actions/runs/38545950279). The first attempt ran before Pages was enabled and stopped at `configure-pages`; after enabling Pages with `build_type=workflow`, the rerun completed both build and deploy jobs at 09:57:29 UTC on 14 October 2026. The deployed site and static data hashes were verified afterward in [PUBLIC_WEBSITE_VERIFICATION.md](PUBLIC_WEBSITE_VERIFICATION.md).

## Release procedure

1. Confirm the source-linked licence assessment and data notices still match the packaged files; recheck GTFS terms and the public file allowlist.
2. Run `npm ci`, `npm test`, `npm run verify:geometry`, `npm run verify:notices`, `npm run build:public`, `node scripts/check_publication.mjs`, and both production browser scripts. Review `public/data/manifest.json` and the actual `dist/` files.
3. Create a **new public** repository named `melbourne-pt-connectivity-dashboard` under `esit98`. Do not change the private research repository's visibility or push its contents.
4. Commit only this isolated project. The `.gitignore` excludes dependencies, output, logs and environment files. Confirm the staged file list and search it for credentials, machine paths and excluded raw inputs before the first push.
5. Push `main`. In repository Settings → Pages, select **GitHub Actions** as the build/deployment source. The workflow in `.github/workflows/pages.yml` runs tests, builds with `VITE_PUBLICATION_MODE=static`, audits `dist/` and deploys that artifact with Pages permissions. The existing repository already has this Pages setting.
6. Confirm the Actions build and deployment jobs succeed. Open `https://esit98.github.io/melbourne-pt-connectivity-dashboard/`, test all eight sections, direct hash URLs, map route geometry, mobile layout and browser console/network, then record the commit, workflow run and URL in `PUBLIC_WEBSITE_VERIFICATION.md`.

The workflow follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): `configure-pages`, `upload-pages-artifact`, `deploy-pages`, and `pages: write`/`id-token: write` for the deployment job.

Updated research results must be validated in the private project first. Regenerate only the static snapshot and manifest, review changed data rights and file hashes, rerun the public tests, then publish a new public commit. The original analysis and database remain separate.
