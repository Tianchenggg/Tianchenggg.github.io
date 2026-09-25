# Tiancheng He — Research Portfolio

Personal academic homepage for [Tiancheng He](https://github.com/Tianchenggg), featuring six selected works and a research focus on agent creativity, post-training, and interpretability.

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

Awards use full-width rows on desktop and mobile. The card backdrops use four independently moving gold, rose, violet, and cyan gradient fields, with a stationary contrast veil that keeps text readable. These are lightweight CSS fluid-style gradients, not a simulation of Apple's internal renderer. The iridescent hero and card colors animate transforms only, pause offscreen or when the tab is hidden, and respect reduced-motion preferences. The header pause control stops all ambient motion. All content stays visible in normal document flow; scrolling never animates its opacity or position.

Home highlights **Agent Creativity / 智能体创造力**, with a static, high-contrast rainbow gradient on **Creativity / 创造力**. Its stronger, independently moving color fields sit above a quieter fixed page glow. Background raster bounds stay close to their containers, and mobile uses only two page-wide fields. Opening the photograph viewer pauses all underlying ambient motion; closing it preserves the user's pause and reduced-motion settings. The gradient text has normal-color and forced-colors fallbacks.

Life replaces the former Project section with ten user-supplied photographs. Desktop rows balance landscape and portrait compositions without cropping; mobile uses a two-column gallery with full-width landscapes. Each photograph has a short bilingual poetic title, without inferred locations or dates. A keyboard-accessible native dialog displays the full-size photographs. Grid images have responsive WebP sources and lazy loading; the lightbox image mounts only when opened. Web derivatives strip EXIF/GPS metadata and leave the uploaded originals untouched. Regenerate them with `node scripts/prepare-life-photos.mjs <upload-directory>`.

Home groups the author's email and WeChat handle alongside the research profile links. Email uses a standard `mailto:` link; the WeChat handle remains selectable text without an invented profile URL.

Contact icons use matching circular blue and green badges. The WeChat dual-bubble mark is sourced from [Simple Icons](https://github.com/simple-icons/simple-icons/blob/develop/icons/wechat.svg) and stored locally; the envelope is an inline SVG.

Navigation uses native scrolling with a single responsive header offset. Manual scroll input cancels only a jump initiated by the navigation, never browser-owned history restoration. Explicit short-section destinations remain selected even when their anchors share the document's bottom limit. Real links handle clicks and keyboard activation, and horizontal dragging has a threshold and cancellation handling. The larger glass capsule uses one backdrop layer, rim highlights, and a static edge-refraction map on supported desktop browsers. Mobile and other browsers use a light blur fallback; no text duplication or per-frame optical JavaScript is needed. Reduced transparency removes the backdrop effect.

`npm test` builds both targets and runs rendered-output, scroll geometry, and DOM interaction regression tests. The DOM tests use controlled layout and time; they complement, rather than replace, visual/device testing.
