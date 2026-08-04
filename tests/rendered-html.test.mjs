import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

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
  assert.match(html, /Current affiliation/);
  assert.match(html, /Previous affiliation/);
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
  assert.match(html, /tiancheng-he-cutout-v2\.png/);
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
  const [html, layout, css, page, switcher] = await Promise.all([
    readFile(new URL("../out/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/section-switcher.tsx", import.meta.url), "utf8"),
  ]);

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
  assert.doesNotMatch(switcher, /section-switcher-lens-labels|--drag-label-x/);
  assert.match(css, /backdrop-filter:\s*blur\(22px\)\s+saturate\(138%\)/);
  assert.match(css, /cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
  assert.match(css, /scale\(1\.018\)/);
  assert.doesNotMatch(css, /section-switcher-lens-labels|--drag-label-x/);
  assert.match(css, /\.section-switcher-drag-handle/);
  assert.doesNotMatch(css, /will-change:\s*transform/);
  assert.doesNotMatch(css, /liquid-(?:skew|stretch)/);
  const thumbRule = css.match(/\.section-switcher-thumb\s*{([^}]*)}/s)?.[1] ?? "";
  assert.doesNotMatch(thumbRule, /backdrop-filter/);
  assert.match(css, /\.section-switcher\.is-dragging/);
  assert.match(page, /\/figures\/rarelens\.png/);
  assert.match(page, /\/figures\/vcu-llm\.png/);
  assert.match(page, /\/figures\/safer-steer\.png/);
  assert.match(page, /\/figures\/safer-toolkit\.png/);
  assert.match(page, /\/figures\/livesearchbench\.png/);
  assert.doesNotMatch(page, /RareAlert/);

  await Promise.all([
    access(new URL("../out/.nojekyll", import.meta.url)),
    access(new URL("../out/avatar.png", import.meta.url)),
    access(new URL("../out/og-scientist.png", import.meta.url)),
    access(new URL("../out/tiancheng-he-cutout-v2.png", import.meta.url)),
    access(new URL("../out/figures/rarelens.png", import.meta.url)),
    access(new URL("../out/figures/vcu-llm.png", import.meta.url)),
    access(new URL("../out/figures/safer-steer.png", import.meta.url)),
    access(new URL("../out/figures/safer-toolkit.png", import.meta.url)),
    access(new URL("../out/figures/livesearchbench.png", import.meta.url)),
    access(new URL("../out/brand/huggingface.svg", import.meta.url)),
    access(new URL("../out/brand/github-mark.svg", import.meta.url)),
    access(new URL("../out/brand/hust-seal.jpg", import.meta.url)),
    access(new URL("../out/brand/bupt-seal.jpg", import.meta.url)),
    access(new URL("../scripts/prepare-pages.mjs", import.meta.url)),
  ]);
});
