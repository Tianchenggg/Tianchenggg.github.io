# Tiancheng He — Research Portfolio

Personal academic homepage for [Tiancheng He](https://github.com/Tianchenggg), featuring six selected works and a research focus on LLM creativity, post-training, and interpretability.

## Local development

```bash
npm ci
npm run dev
```

The site supports two production targets:

- `npm run build` creates the Cloudflare-compatible Sites build.
- `npm run build:pages` creates the static `out/` bundle.
- `npm run prepare:pages` refreshes the committed `docs/` snapshot served by GitHub Pages.

## Publication data

Publication metadata was updated in September 2026 using the author's supplied accepted OpenReview records, primary arXiv pages, and official code repositories. LiveSearchBench is listed once under its accepted title, “An Automated Pipeline for Provably Retrieval-Dependent Benchmark Construction over Dynamic Knowledge.” The project avoids automated author aggregators because several unrelated researchers share the name Tiancheng He.

LatticeMind's overview is Figure 1 from [arXiv:2608.08236](https://arxiv.org/abs/2608.08236), checked against PDF page 4 and exported from the author's original figure as a 1000px WebP. Existing paper figures remain unchanged.

Awards use full-width rows on desktop and mobile. The card backdrops use four independently moving gold, rose, violet, and cyan gradient fields, with a stationary contrast veil that keeps text readable. These are lightweight CSS fluid-style gradients, not a simulation of Apple's internal renderer. The iridescent hero and card colors animate transforms only, pause offscreen or when the tab is hidden, and respect reduced-motion preferences. The header pause control stops all ambient motion. Scroll reveals share one gentle entrance and stay readable on exit; project children do not stack additional fades.

Navigation uses native scrolling with a single header offset. Manual scroll input cancels an in-flight jump; explicit short-section destinations remain selected even when their anchors share the document's bottom limit. Real links handle clicks and keyboard activation, and horizontal dragging has a threshold and cancellation handling.

`npm test` builds both targets and runs rendered-output, scroll geometry, and DOM interaction regression tests. The DOM tests use controlled layout and time; they complement, rather than replace, visual/device testing.
