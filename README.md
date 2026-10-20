# Mahdi Alam — Portfolio

Software developer portfolio built with HTML, CSS, and JavaScript.

## Files

- `index.html`: profile, project breakdowns, education, and contact links
- `style.css`: responsive design and reduced-motion support
- `script.js`: email copying and section navigation
- `icon.svg`: favicon
- `mahdi-alam-resume.pdf`: downloadable resume

## Run locally

The portfolio homepage remains static HTML/CSS/JavaScript. The new React/TypeScript search app and Node.js API require `pnpm install`. Run `pnpm server` and `pnpm dev` in separate terminals. Run `pnpm test`, `pnpm typecheck`, and `pnpm build` for verification. See `projects/search-lab/README.md` for architecture and limitations.

## Hosting

The repository is connected to the existing `mahdi-alam-portfolio` Vercel project. Pushes to `main` trigger production deployments. The custom domain is https://mahdialam.com/.

## Project links

The October 2026 AI-assisted Document Search API prototype has executable source and eight passing tests at https://github.com/mahdi-alam360/search-engine-nlp/tree/main/prototype. It implements BM25 retrieval and a REST API on a small toy corpus. Its optional local LLM adapter has not been exercised against a real model. The older project repositories primarily contain documentation; no recovered historical source is claimed.


Document Search Lab: https://mahdialam.com/search-lab/ — React, TypeScript, Node.js, BM25 score explanations, and 15 automated tests. Newly built in October 2026 with AI assistance.


Order Pipeline: /order-pipeline/ - new AI-assisted Python/SQLite ETL learning project, October 2026. Source and six tests: projects/order-pipeline. Public page shows a generated synthetic report, not a hosted ETL service. No AWS claims.
