import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";

function cssBlock(source, marker) {
  const markerIndex = source.indexOf(marker);
  assert.notEqual(markerIndex, -1, `Missing CSS block: ${marker}`);

  const openingBrace = source.indexOf("{", markerIndex);
  assert.notEqual(openingBrace, -1, `Missing opening brace: ${marker}`);

  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail(`Missing closing brace: ${marker}`);
}

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished research portfolio", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Tiancheng He — AI Scientist<\/title>/i);
  assert.match(html, /<h1>\s*Tiancheng\s*<span>He<\/span>\s*<\/h1>/);
  assert.match(html, /The greatest innovation solves real problems/);
  assert.match(html, /makes life easier/);
  assert.match(html, />Home</);
  assert.match(html, />Research</);
  assert.match(html, />Project</);
  const switcherMarkup = html.match(/<nav class="section-switcher"[\s\S]*?<\/nav>/)?.[0] ?? "";
  assert.equal(switcherMarkup.match(/>Home</g)?.length, 1);
  assert.equal(switcherMarkup.match(/>Research</g)?.length, 1);
  assert.equal(switcherMarkup.match(/>Project</g)?.length, 1);
  assert.match(
    html,
    /class="profile-link profile-huggingface"[^>]*href="https:\/\/huggingface\.co\/htcwang"/,
  );
  assert.match(html, />Hugging Face</);
  assert.match(html, /class="profile-link profile-github"[^>]*href="https:\/\/github\.com\/Tianchenggg"/);
  const headerMarkup = html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0] ?? "";
  assert.doesNotMatch(headerMarkup, /Hugging Face|GitHub/);
  assert.match(headerMarkup, /class="section-switcher"/);
  assert.match(html, />AI Scientist</);
  assert.doesNotMatch(html, /AI Researcher/i);
  assert.match(html, /class="hero-info-rail"/);
  assert.match(html, /Undergraduate/);
  assert.match(html, /Master(?:'|&#x27;)s/);
  const affiliationsMarkup =
    html.match(/<div class="hero-affiliations"[\s\S]*?<\/div><nav class="hero-profiles"/)?.[0] ?? "";
  assert.ok(affiliationsMarkup.indexOf("BUPT") < affiliationsMarkup.indexOf("HUST"));
  assert.match(html, /\/brand\/huggingface\.svg/);
  assert.match(html, /\/brand\/github-mark\.svg/);
  assert.match(html, /\/brand\/hust-seal\.jpg/);
  assert.match(html, /\/brand\/bupt-seal\.jpg/);
  assert.match(html, /LLM safety/i);
  assert.doesNotMatch(html, /large-model safety/i);
  assert.match(html, /agent creativity/i);
  assert.match(html, /RareLens: Towards End-to-End Rare Disease Care/);
  assert.match(html, /VCU-LLM: Prompt-efficient On-device Large Language Model/);
  assert.match(
    html,
    /https:\/\/www\.kaggle\.com\/datasets\/liema77\/on-device-vcu-llm-vague-smart-home-commands/,
  );
  assert.match(html, />Code</);
  assert.doesNotMatch(html, />DOI</);
  assert.match(html, /Activation Revelation/);
  assert.match(html, /<h2>Project<\/h2>/);
  assert.match(html, /<h3>Activation Revelation<\/h3>/);
  assert.match(html, /tiancheng-he-portrait-800\.webp/);
  assert.doesNotMatch(html, /RareAlert/);
  assert.doesNotMatch(html, /Two questions guide my work|Research should leave the lab/);
  assert.doesNotMatch(
    html,
    /Selected research|GitHub profile|Selected publications|Research path|Open research project/i,
  );
  assert.doesNotMatch(html, /<footer\b/i);
  assert.match(html, /prefers-reduced-motion|skip-link/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships the GitHub Pages export and social assets", async () => {
  const [html, docsHtml, layout, css, page, switcher] = await Promise.all([
    readFile(new URL("../out/index.html", import.meta.url), "utf8"),
    readFile(new URL("../docs/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/section-switcher.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal(docsHtml, html);
  assert.match(html, /Tiancheng He — AI Scientist/);
  assert.match(layout, /https:\/\/tianchenggg\.github\.io/);
  assert.match(layout, /\/og-scientist\.png/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /-webkit-backdrop-filter/);
  assert.match(css, /section-switcher-thumb/);
  assert.match(css, /--radius-card:\s*24px/);
  assert.match(css, /--muted-light:\s*#5a6f85/i);
  assert.match(css, /aspect-ratio:\s*2\s*\/\s*1/);
  assert.match(css, /\.site-header-inner\s*{[^}]*display:\s*block[^}]*width:\s*min\(348px,\s*100%\)/s);
  assert.match(css, /\.hero-info-rail\s*{/);
  assert.match(css, /\.hero-affiliations\s*{/);
  assert.match(css, /\.hero-profiles\s*{/);
  assert.match(css, /\.profile-link\s*{/);
  assert.match(css, /min-height:\s*100svh/);
  assert.match(css, /@supports\s*\(animation-timeline:\s*view\(\)\)/);
  assert.match(css, /animation-timeline:\s*view\(block\)/);
  assert.match(css, /animation-range:\s*cover 0% cover 100%/);
  assert.doesNotMatch(css, /@keyframes\s+research-card-arrive/);
  assert.match(css, /@keyframes\s+research-card-focus/);
  assert.match(css, /@keyframes\s+research-heading-focus/);
  assert.match(css, /@keyframes\s+hero-deemphasize/);
  assert.match(css, /76%\s*{[^}]*opacity:\s*0\.45/s);
  assert.match(css, /100%\s*{[^}]*opacity:\s*0\.22/s);
  assert.match(css, /animation-range:\s*exit 0% exit 68%/);
  assert.match(css, /prefers-reduced-motion:\s*no-preference/);
  assert.match(css, /animation:\s*none\s*!important/);
  assert.match(css, /filter:\s*none/);

  const baseHeroRule = cssBlock(css, ".hero {");
  assert.match(baseHeroRule, /filter:\s*none/);
  assert.match(baseHeroRule, /opacity:\s*1/);
  assert.doesNotMatch(baseHeroRule, /grayscale\([^0]|opacity:\s*0/);

  const baseCardRule = cssBlock(css, ".publication-card {");
  assert.match(baseCardRule, /filter:\s*none/);
  assert.match(baseCardRule, /opacity:\s*1/);
  assert.match(baseCardRule, /contain:\s*paint/);
  assert.doesNotMatch(baseCardRule, /backdrop-filter/);

  const projectPanelRule = cssBlock(css, ".project-panel {");
  assert.doesNotMatch(projectPanelRule, /backdrop-filter/);

  const cardFocusFrames = cssBlock(css, "@keyframes research-card-focus");
  assert.match(cardFocusFrames, /transform:\s*translate3d/);
  assert.doesNotMatch(cardFocusFrames, /scale:/);

  const heroFrames = cssBlock(css, "@keyframes hero-deemphasize");
  assert.match(heroFrames, /opacity:/);
  assert.doesNotMatch(heroFrames, /scale:|transform:/);

  const viewTimelineRules = cssBlock(css, "@supports (animation-timeline: view())");
  assert.match(
    viewTimelineRules,
    /\.hero\s*{[^}]*animation:\s*hero-deemphasize linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*exit 0% exit 68%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.publication-card\s*{[^}]*animation:\s*research-card-focus linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*cover 0% cover 100%/s,
  );
  assert.match(viewTimelineRules, /\.publication-card:focus-within\s*{[^}]*opacity:\s*1\s*!important/s);
  assert.match(viewTimelineRules, /\.publication-card:hover\s*{[^}]*opacity:\s*1\s*!important/s);

  const reducedMotionRules = cssBlock(css, "@media (prefers-reduced-motion: reduce)");
  assert.match(reducedMotionRules, /\.hero,[\s\S]*\.publication-card\s*{/);
  assert.match(reducedMotionRules, /animation:\s*none\s*!important/);
  assert.match(reducedMotionRules, /filter:\s*none/);
  assert.match(reducedMotionRules, /opacity:\s*1/);
  assert.doesNotMatch(css, /\.hero-socials\s*{|\.hero-social-link\s*{/);
  assert.doesNotMatch(layout, /AI Researcher/i);
  assert.match(switcher, /aria-current/);
  assert.match(switcher, /requestAnimationFrame/);
  assert.match(switcher, /navigationLock/);
  assert.match(switcher, /releaseNavigationAfterIdle/);
  assert.match(switcher, /setPointerCapture/);
  assert.match(switcher, /onPointerMove/);
  assert.match(switcher, /section-switcher-drag-handle/);
  assert.match(switcher, /--drag-x/);
  assert.match(switcher, /previewIndex/);
  assert.match(switcher, /ResizeObserver/);
  assert.match(switcher, /sectionTops/);
  assert.match(switcher, /activeIndexRef/);
  assert.doesNotMatch(switcher, /--lens-light-x/);
  assert.doesNotMatch(switcher, /section-switcher-lens-labels|--drag-label-x/);
  assert.match(css, /backdrop-filter:\s*blur\(14px\)\s+saturate\(125%\)/);
  assert.match(css, /cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
  assert.match(css, /scale\(1\.018\)/);
  assert.doesNotMatch(css, /font-weight\s+170ms/);
  assert.doesNotMatch(css, /--lens-light-x/);
  assert.doesNotMatch(css, /section-switcher-lens-labels|--drag-label-x/);
  assert.match(css, /\.section-switcher-drag-handle/);
  assert.doesNotMatch(css, /will-change:\s*transform/);
  assert.doesNotMatch(css, /liquid-(?:skew|stretch)/);
  const thumbRule = css.match(/\.section-switcher-thumb\s*{([^}]*)}/s)?.[1] ?? "";
  assert.doesNotMatch(thumbRule, /backdrop-filter/);
  assert.match(css, /\.section-switcher\.is-dragging/);
  assert.match(page, /loading="lazy"/);
  assert.match(page, /decoding="async"/);
  assert.doesNotMatch(page, /loading=\{index === 0/);
  assert.match(page, /\/images\/paper-rarelens-1000\.webp/);
  assert.match(page, /\/images\/paper-vcu-llm-1000\.webp/);
  assert.match(page, /\/images\/paper-safer-steer-1000\.webp/);
  assert.match(page, /\/images\/paper-safer-toolkit-1000\.webp/);
  assert.match(page, /\/images\/paper-livesearchbench-1000\.webp/);
  assert.match(page, /imageWidth:\s*1000/);
  assert.match(page, /imageHeight:/);
  assert.doesNotMatch(page, /\/figures\/.+\.png/);
  assert.doesNotMatch(page, /RareAlert/);

  await Promise.all([
    access(new URL("../out/.nojekyll", import.meta.url)),
    access(new URL("../out/avatar.png", import.meta.url)),
    access(new URL("../out/og-scientist.png", import.meta.url)),
    access(new URL("../out/images/tiancheng-he-portrait-800.webp", import.meta.url)),
    access(new URL("../out/images/paper-rarelens-1000.webp", import.meta.url)),
    access(new URL("../out/images/paper-vcu-llm-1000.webp", import.meta.url)),
    access(new URL("../out/images/paper-safer-steer-1000.webp", import.meta.url)),
    access(new URL("../out/images/paper-safer-toolkit-1000.webp", import.meta.url)),
    access(new URL("../out/images/paper-livesearchbench-1000.webp", import.meta.url)),
    access(new URL("../out/brand/huggingface.svg", import.meta.url)),
    access(new URL("../out/brand/github-mark.svg", import.meta.url)),
    access(new URL("../out/brand/hust-seal.jpg", import.meta.url)),
    access(new URL("../out/brand/bupt-seal.jpg", import.meta.url)),
    access(new URL("../scripts/prepare-pages.mjs", import.meta.url)),
  ]);

  const optimizedImages = await Promise.all([
    stat(new URL("../out/images/tiancheng-he-portrait-800.webp", import.meta.url)),
    stat(new URL("../out/images/paper-rarelens-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-vcu-llm-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-safer-steer-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-safer-toolkit-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-livesearchbench-1000.webp", import.meta.url)),
  ]);
  const optimizedImageBytes = optimizedImages.reduce((total, image) => total + image.size, 0);
  assert.ok(optimizedImageBytes < 450_000, `Optimized images total ${optimizedImageBytes} bytes`);
});
