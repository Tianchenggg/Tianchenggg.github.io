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
  assert.match(html, /Building AI that is/);
  assert.match(html, /RareLens: Towards End-to-End Rare Disease Care/);
  assert.match(html, /VCU-LLM: Prompt-efficient On-device Large Language Model/);
  assert.match(html, /Activation Revelation/);
  assert.match(html, /prefers-reduced-motion|skip-link/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("ships the GitHub Pages export and social assets", async () => {
  const [html, layout, css] = await Promise.all([
    readFile(new URL("../out/index.html", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);

  assert.match(html, /Tiancheng He — AI Researcher/);
  assert.match(layout, /https:\/\/tianchenggg\.github\.io/);
  assert.match(layout, /\/og\.png/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /-webkit-backdrop-filter/);

  await Promise.all([
    access(new URL("../out/.nojekyll", import.meta.url)),
    access(new URL("../out/avatar.png", import.meta.url)),
    access(new URL("../out/og.png", import.meta.url)),
    access(new URL("../scripts/prepare-pages.mjs", import.meta.url)),
  ]);
});
