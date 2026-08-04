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
  assert.match(html, /<title>Tiancheng He — AI Researcher<\/title>/i);
  assert.match(html, /<h1>\s*Tiancheng\s*<span>He<\/span>\s*<\/h1>/);
  assert.match(html, /The greatest innovation solves real problems/);
  assert.match(html, /makes life easier/);
  assert.match(html, />Home</);
  assert.match(html, />Research</);
  assert.match(html, />Project</);
  assert.match(
    html,
    /class="header-huggingface"[^>]*href="https:\/\/huggingface\.co\/htcwang"/,
  );
  assert.match(html, />Hugging Face</);
  assert.match(html, /class="header-github"[^>]*href="https:\/\/github\.com\/Tianchenggg"/);
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

  assert.match(html, /Tiancheng He — AI Researcher/);
  assert.match(layout, /https:\/\/tianchenggg\.github\.io/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /-webkit-backdrop-filter/);
  assert.match(css, /section-switcher-thumb/);
  assert.match(css, /--radius-card:\s*24px/);
  assert.match(css, /--muted-light:\s*#5a6f85/i);
  assert.match(css, /aspect-ratio:\s*2\s*\/\s*1/);
  assert.doesNotMatch(css, /grid-row:\s*2/);
  assert.match(switcher, /aria-current/);
  assert.match(switcher, /requestAnimationFrame/);
  assert.match(switcher, /navigationLock/);
  assert.match(switcher, /releaseNavigationAfterIdle/);
  assert.match(page, /\/figures\/rarelens\.png/);
  assert.match(page, /\/figures\/vcu-llm\.png/);
  assert.match(page, /\/figures\/safer-steer\.png/);
  assert.match(page, /\/figures\/safer-toolkit\.png/);
  assert.match(page, /\/figures\/livesearchbench\.png/);
  assert.doesNotMatch(page, /RareAlert/);

  await Promise.all([
    access(new URL("../out/.nojekyll", import.meta.url)),
    access(new URL("../out/avatar.png", import.meta.url)),
    access(new URL("../out/og.png", import.meta.url)),
    access(new URL("../out/tiancheng-he-cutout-v2.png", import.meta.url)),
    access(new URL("../out/figures/rarelens.png", import.meta.url)),
    access(new URL("../out/figures/vcu-llm.png", import.meta.url)),
    access(new URL("../out/figures/safer-steer.png", import.meta.url)),
    access(new URL("../out/figures/safer-toolkit.png", import.meta.url)),
    access(new URL("../out/figures/livesearchbench.png", import.meta.url)),
    access(new URL("../scripts/prepare-pages.mjs", import.meta.url)),
  ]);
});
