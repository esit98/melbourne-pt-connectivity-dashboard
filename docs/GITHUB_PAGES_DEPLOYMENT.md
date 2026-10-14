# GitHub Pages deployment

## Deployment status

The [separate public repository](https://github.com/esit98/melbourne-pt-connectivity-dashboard) is deployed at [GitHub Pages](https://esit98.github.io/melbourne-pt-connectivity-dashboard/). The original `esit98/melbourne-cross-suburban-pt-connectivity` was checked and remains private. The source-linked CC BY assessment and ODbL compliance package are documented in [publication readiness](PUBLICATION_READINESS.md) and [licensing review](LICENSING_REVIEW.md).

Release source commit `aa6a181aa3857b5cded093940de4f910dc0268b1` passed [Actions run 38545950279, attempt 2](https://github.com/esit98/melbourne-pt-connectivity-dashboard/actions/runs/38545950279). The first attempt ran before Pages was enabled and stopped at `configure-pages`; after enabling Pages with `build_type=workflow`, the rerun completed both build and deploy jobs at 09:57:29 UTC on 14 October 2026. The deployed site and static data hashes were verified afterward in [PUBLIC_WEBSITE_VERIFICATION.md](PUBLIC_WEBSITE_VERIFICATION.md).

The CARTO Light source commit `7d9838db935b007f1d048b813cbc6740dca3f419` passed [Actions run 38551322211](https://github.com/esit98/melbourne-pt-connectivity-dashboard/actions/runs/38551322211) on 14 October 2026. The live site passed both browser suites with CARTO tiles from the domain-restricted public key. See [public website verification](PUBLIC_WEBSITE_VERIFICATION.md) for tile, interaction and data-integrity results.

## Release procedure

1. Confirm the source-linked licence assessment and data notices still match the packaged files. Keep the original research repository private.
2. In CARTO Basemaps, use a browser key for this dashboard, restrict the public key to `esit98.github.io`, and use a separate localhost-capable key for local preview if needed. CARTO's [key guide](https://carto.com/basemaps/apikey/) and [terms](https://carto.com/legal/basemap-terms/) describe restrictions, attribution and the qualifying non-commercial allowance of five million tile requests per calendar month. Monitor use in the CARTO dashboard. A Vite key is visible in the compiled browser code and tile URL.
3. Store the public key as the existing repository's Actions secret `CARTO_BASEMAP_KEY`. For local builds, put `VITE_CARTO_BASEMAP_KEY` in ignored `.env.local`. Do not commit either value. The workflow passes the secret to `npm run build:public` and `scripts/check_publication.mjs`; the build fails for a missing or placeholder key.
4. Run `npm ci`, `npm test`, `npm run verify:geometry`, `npm run verify:notices`, `npm run build:public`, `node scripts/check_publication.mjs`, and both production browser scripts. Review `public/data/manifest.json`, the actual `dist/` files, CARTO tile responses, visible © OpenStreetMap contributors and © CARTO attribution, and desktop/mobile screenshots.
5. Commit only reviewed source and documentation in this existing public repository. The `.gitignore` excludes dependencies, output, logs and environment files. Confirm the staged file list and search it for unrelated credentials, machine paths and excluded raw inputs before pushing `main`.
6. The repository already has Pages configured for **GitHub Actions**. The workflow builds with `VITE_PUBLICATION_MODE=static`, audits `dist/` and deploys that artifact. Confirm the Actions build and deployment jobs succeed. Open `https://esit98.github.io/melbourne-pt-connectivity-dashboard/`, test all eight sections, direct hash URLs, CARTO Light tiles, route geometry, mobile layout and browser console/network, then record the commit, workflow run and URL in `PUBLIC_WEBSITE_VERIFICATION.md`.

The workflow follows [GitHub's custom Pages workflow guidance](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): `configure-pages`, `upload-pages-artifact`, `deploy-pages`, and `pages: write`/`id-token: write` for the deployment job.

Updated research results must be validated in the private project first. Regenerate only the static snapshot and manifest, review changed data rights and file hashes, rerun the public tests, then publish a new public commit. The original analysis and database remain separate.
