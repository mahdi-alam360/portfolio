# Document Search Lab

An AI-assisted personal learning project by Mahdi Alam, built in October 2026. React and TypeScript frontend, Node.js HTTP API, and an inspectable BM25 implementation. Live demo: https://mahdialam.com/search-lab/

## Run from the repository root

```sh
pnpm install
pnpm server  # terminal 1: API on 127.0.0.1:3001
pnpm dev     # terminal 2: Vite UI at /search-lab/
pnpm test
pnpm typecheck
pnpm build
```

The root Vercel configuration deploys the static portfolio, compiled React app, and `/api/search` Node.js function together. No API key or paid model is needed.

## What it implements

- Add/remove documents in browser memory; restore the six original example notes.
- POST query and corpus to `/api/search`. Return ranked results and per-term score contributions.
- Unicode lowercase tokenization, unique query terms, BM25 with k1=1.2 and b=0.75, deterministic ID tie-breaking.
- Title and text indexed together. Maximum 40 documents, 8,000 characters per body, 200 query characters, and 100,000 request bytes.
- Accessible labels, keyboard-operable native details controls, loading/error/empty states, responsive layout.
- Fifteen automated tests, including a real local HTTP integration test, plus TypeScript and production build checks.

## Request example

```json
{"query":"registration","documents":[{"id":"note-1","title":"Research note","text":"Self-supervised medical image registration."}]}
```

## Tradeoffs and limitations

This extends the learning direction of the earlier Python retrieval prototype with a separate React/Node implementation. It is a newly built personal project, not prior professional or client experience. It was built with AI coding assistance; no independent-authorship claim is made.

BM25 is lexical retrieval: it can miss synonyms, and ranking scores are not confidence or factual correctness. The included corpus is synthetic demonstration text, not a benchmark. Passing tests do not establish retrieval quality on real datasets or production readiness. No LLM, agents, database, authentication, persistence, or production-scale evaluation is implemented. Custom documents are transmitted to the hosting API for each search; avoid sensitive information. Browser state resets when the page reloads. Platform logs are governed by the hosting provider.

## Verification

`tests/search.test.mjs` checks ranking, summed contributions, rare-term weighting, frequency deduplication, length normalization, deterministic ordering, Unicode tokenization, malformed input, duplicate IDs, size limits, HTTP method/media-type validation, and a real HTTP request/response contract. Browser checks cover a successful search, expanded explanation, custom document search/removal, invalid punctuation query, and an empty-result query.
