import assert from "node:assert/strict";
import { access, readFile, stat } from "node:fs/promises";
import test from "node:test";
import { Window } from "happy-dom";
import { lifePhotos } from "../app/life-photos.ts";

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

function cssRulesForSelector(source, selector) {
  const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)}/g)]
    .filter(([, selectors]) => selectors.split(",").some((value) => value.trim() === selector))
    .map(([, , declarations]) => declarations);
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

test("server-renders the finished research portfolio", async t => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Tiancheng He — AI Scientist<\/title>/i);
  assert.match(html, /<h1>\s*Tiancheng\s*<span>He<\/span>\s*<\/h1>/);
  assert.match(html, /Research should solve real-world problems/);
  assert.match(html, /and improve people’s lives\./);
  assert.match(html, />Home</);
  assert.match(html, />Research</);
  assert.match(html, />Awards</);
  assert.match(html, />Life</);
  assert.match(
    html,
    /class="language-toggle"[^>]*aria-label="Switch to Chinese"/,
  );
  assert.doesNotMatch(html, /class="language-toggle"[^>]*aria-pressed=/);
  assert.match(html, /class="language-option[^>]*lang="zh-CN"[^>]*>中</);
  const switcherMarkup = html.match(/<nav class="section-switcher"[\s\S]*?<\/nav>/)?.[0] ?? "";
  assert.equal(switcherMarkup.match(/>Home</g)?.length, 1);
  assert.equal(switcherMarkup.match(/>Research</g)?.length, 1);
  assert.equal(switcherMarkup.match(/>Awards</g)?.length, 1);
  assert.equal(switcherMarkup.match(/>Life</g)?.length, 1);
  assert.doesNotMatch(switcherMarkup, />Project</);
  assert.equal(switcherMarkup.match(/<a\b/g)?.length, 4);
  for (const id of ["home", "research", "awards", "life"]) {
    assert.match(switcherMarkup, new RegExp(`<a\\b[^>]*href="#${id}"`));
  }
  assert.doesNotMatch(switcherMarkup, /section-switcher-drag-handle/);
  assert.equal(switcherMarkup.match(/class="section-switcher-thumb"/g)?.length, 1);
  assert.match(switcherMarkup, /class="section-switcher-thumb"[^>]*aria-hidden="true"/);
  assert.doesNotMatch(switcherMarkup, /section-switcher-lens-labels|<svg\b|<canvas\b/,
    "Glass must not duplicate text or add a rendering loop to the navigation");
  assert.match(
    html,
    /class="profile-link profile-huggingface"[^>]*href="https:\/\/huggingface\.co\/htcwang"/,
  );
  assert.match(html, />Hugging Face</);
  assert.match(html, /class="profile-link profile-github"[^>]*href="https:\/\/github\.com\/Tianchenggg"/);
  const headerMarkup = html.match(/<header class="site-header"[\s\S]*?<\/header>/)?.[0] ?? "";
  assert.doesNotMatch(headerMarkup, /Hugging Face|GitHub/);
  assert.match(headerMarkup, /class="section-switcher"/);
  assert.match(headerMarkup, /<button\b[^>]*class="spectrum-toggle"[^>]*aria-label="Pause background motion"/);
  assert.equal(html.match(/class="spectrum-toggle"/g)?.length, 1, "A single header control must pause all ambient motion");
  const ambientMarkup = [...html.matchAll(/<[^>]+\bdata-ambient(?:="[^"]*")?[^>]*>/g)].map(([element]) => element);
  assert.equal(ambientMarkup.length, 11, "Page, hero, publications, and awards must share ambient-motion control");
  for (const element of ambientMarkup) {
    assert.match(element, /data-running="false"/, "Ambient motion must wait for visibility before starting");
    assert.match(element, /aria-hidden="true"/, "Decorative motion must not enter the accessibility tree");
  }
  const fluidMarkup = [...html.matchAll(/<div class="card-fluid"[^>]*>[\s\S]*?<\/div>/g)].map(([element]) => element);
  assert.equal(fluidMarkup.length, 9, "Each publication and award row must have a shared fluid backdrop");
  const pageBackdrop = html.match(/<div class="page-spectrum"[^>]*>[\s\S]*?<\/div>/)?.[0] ?? "";
  const heroBackdrop = html.match(/<div class="hero-spectrum"[^>]*>[\s\S]*?<\/div>/)?.[0] ?? "";
  assert.ok(pageBackdrop, "The overall page must have one decorative flowing backdrop");
  assert.ok(heroBackdrop, "Home must have its own composed color fields");
  assert.equal(html.match(/class="page-spectrum"/g)?.length, 1);
  assert.equal(html.match(/class="hero-spectrum"/g)?.length, 1);
  assert.ok(html.indexOf(pageBackdrop) < html.indexOf(headerMarkup), "The page backdrop must not be nested inside the navigation");
  for (const backdrop of [...fluidMarkup, pageBackdrop, heroBackdrop]) {
    for (const color of ["gold", "rose", "violet", "cyan"]) {
      assert.match(backdrop, new RegExp(`<span class="fluid-color is-${color}"></span>`));
    }
    assert.equal(backdrop.match(/class="fluid-color /g)?.length, 4);
    assert.doesNotMatch(backdrop, /<(?:canvas|video|img)\b/, "Fluid colors must not add media downloads or a canvas render loop");
  }
  assert.match(html, />AI Scientist</);
  assert.doesNotMatch(html, /AI Researcher/i);
  assert.match(html, /class="hero-info-rail"/);
  const homeMarkup = html.match(/<section\b[^>]*id="home"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? "";
  const win = new Window();
  t.after(() => win.happyDOM.close());
  const homeDocument = new win.DOMParser().parseFromString(homeMarkup, "text/html");
  assert.ok(homeDocument.querySelector("#home .hero-spectrum"), "Home colors must remain scoped to the hero");
  const creativity = homeDocument.querySelector(".focus-creativity");
  assert.ok(creativity, "The creativity research focus must have its own semantic emphasis");
  assert.equal(creativity.textContent.replace(/\s+/g, " ").trim(), "Agent Creativity");
  assert.equal(creativity.querySelector(".creativity-spectrum")?.textContent, "Creativity");
  assert.equal(creativity.querySelectorAll(".creativity-spectrum").length, 1, "Color only the Creativity word, not the entire research focus");
  assert.equal(creativity.querySelector("span:not(.creativity-spectrum)")?.textContent.trim(), "Agent");
  const contacts = homeDocument.querySelector("#home .contact-links");
  assert.ok(contacts, "Contact information must be inside Home");
  const rail = homeDocument.querySelector("#home .hero-info-rail");
  assert.deepEqual([...rail.children].map(element => element.className), ["hero-affiliations", "hero-profiles", "contact-links"]);
  const identityIcons = [...rail.querySelectorAll(".identity-icon")];
  assert.equal(identityIcons.length, 6, "Both schools, both profiles, and both contact methods need the shared icon geometry");
  assert.ok(identityIcons.every(icon => icon.getAttribute("aria-hidden") === "true"));
  const email = contacts.querySelector('a[href="mailto:tianchenghe77bupt@gmail.com"]');
  assert.equal(email?.textContent.trim(), "tianchenghe77bupt@gmail.com");
  const wechat = contacts.querySelector("span.contact-wechat");
  assert.match(wechat?.textContent ?? "", /WeChat/);
  assert.match(wechat?.textContent ?? "", /Tancyne/);
  assert.equal(contacts.querySelectorAll("a").length, 1, "WeChat must be readable text, not an invented external link");
  const emailIcon = email.querySelector(".contact-icon.contact-icon--email");
  const wechatIcon = wechat.querySelector(".contact-icon.contact-icon--wechat");
  for (const icon of [emailIcon, wechatIcon]) {
    assert.ok(icon, "Each contact method must have its own circular icon wrapper");
    assert.equal(icon.getAttribute("aria-hidden"), "true", "Decorative icons must not repeat the adjacent contact label");
  }
  const envelope = emailIcon.querySelector("svg");
  assert.ok(envelope, "Email must display an envelope symbol");
  assert.equal(envelope.getAttribute("focusable"), "false", "The decorative envelope must not create a keyboard stop");
  const wechatMark = wechatIcon.querySelector('img[src="/brand/wechat.svg"]');
  assert.ok(wechatMark, "WeChat must use its recognizable brand mark rather than a generic chat bubble");
  assert.equal(wechatMark.getAttribute("alt"), "");
  assert.equal(contacts.querySelectorAll(".contact-icon").length, 2);
  assert.match(html, /Undergraduate/);
  assert.match(html, /Master(?:’|'|&#x27;)s/);
  const affiliationNames = [...homeDocument.querySelectorAll("#home .hero-affiliations .affiliation-copy > strong")]
    .map(element => element.textContent.trim());
  assert.deepEqual(affiliationNames, ["BUPT", "HUST"], "Affiliations must retain their order independently of adjacent contact layout");
  assert.match(html, /\/brand\/huggingface\.svg/);
  assert.match(html, /\/brand\/github-mark\.svg/);
  assert.match(html, /\/brand\/hust-seal\.jpg/);
  assert.match(html, /\/brand\/bupt-seal\.jpg/);
  assert.doesNotMatch(html, /LLM creativity/i);
  assert.doesNotMatch(html, /large-model safety/i);
  assert.match(html, /Post-training/);
  assert.match(html, /Interpretability/);
  assert.equal(html.match(/<article class="publication-card"/g)?.length, 6);
  const papers = [...html.matchAll(/<article class="publication-card"[\s\S]*?<\/article>/g)].map(([card]) => card);
  for (const [title, venue, paperId] of [
    ["SaFeR-ToolKit", "AACL-IJCNLP 2026 Main", "UglumGIKbl"],
    ["SaFeR-Steer", "EMNLP 2026 Main", "cxpvH46GvW"],
    ["An Automated Pipeline", "EMNLP 2026 Findings", "ulUTEPCCNE"],
    ["LatticeMind", "EMNLP 2026 Main", "eZ1kdXXe9x"],
  ]) {
    const card = papers.find((paper) => paper.includes(title));
    assert.ok(card?.includes(venue), `${title} must show its accepted venue`);
    assert.ok(card?.includes(`https://openreview.net/forum?id=${paperId}`));
    assert.ok(!card?.includes("arXiv"), `${title} must not show a preprint venue`);
  }
  assert.match(papers[0], /SaFeR-ToolKit/);
  assert.match(html, />IMWUT 2026</);
  assert.doesNotMatch(html, /LiveSearchBench: An Automatically|PACM IMWUT/);
  assert.match(html, /RareLens: Towards End-to-End Rare Disease Care/);
  assert.match(html, /VCU-LLM: Prompt-efficient On-device Large Language Model/);
  assert.match(
    html,
    /https:\/\/www\.kaggle\.com\/datasets\/liema77\/on-device-vcu-llm-vague-smart-home-commands/,
  );
  assert.match(html, />Code</);
  assert.doesNotMatch(html, />DOI</);
  const awardsMarkup =
    html.match(/<section class="awards-section section-pad"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(awardsMarkup, /id="awards"/);
  assert.match(awardsMarkup, /aria-labelledby="awards-heading"/);
  assert.match(awardsMarkup, /<h2 id="awards-heading">Awards<\/h2>/);
  assert.match(
    awardsMarkup,
    /<ol class="award-list" aria-label="Awards in reverse chronological order">/,
  );
  assert.equal(awardsMarkup.match(/<li class="award-item">/g)?.length, 3);
  assert.match(awardsMarkup, /<time datetime="2026">2026<\/time>/i);
  assert.match(awardsMarkup, /Queen Mary Prize/);
  assert.match(awardsMarkup, /<time datetime="2025">2025<\/time>/i);
  assert.match(awardsMarkup, /BUPT First-Class Scholarship/);
  assert.match(awardsMarkup, /<time datetime="2024">2024<\/time>/i);
  assert.match(awardsMarkup, /National Scholarship/);
  assert.match(awardsMarkup, /\/brand\/qmul-logo\.svg/);
  assert.match(awardsMarkup, /Queen Mary University of London logo/);
  assert.match(awardsMarkup, /\/brand\/bupt-seal\.jpg/);
  assert.match(awardsMarkup, /BUPT emblem/);
  assert.match(awardsMarkup, /\/brand\/prc-national-emblem\.png/);
  assert.match(awardsMarkup, /National Emblem of the People’s Republic of China/);
  assert.equal(awardsMarkup.match(/class="award-icon /g)?.length, 3);
  assert.doesNotMatch(awardsMarkup, /class="award-mark"|>✦</);
  assert.ok(awardsMarkup.indexOf("2026") < awardsMarkup.indexOf("2025"));
  assert.ok(awardsMarkup.indexOf("2025") < awardsMarkup.indexOf("2024"));
  const lifeMarkup =
    html.match(/<section class="life-section section-pad"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(lifeMarkup, /id="life"/);
  assert.match(lifeMarkup, /aria-labelledby="life-heading"/);
  assert.match(lifeMarkup, /<h2 id="life-heading">Life<\/h2>/);
  assert.equal(lifeMarkup.match(/class="life-photo-caption"/g)?.length, 10);
  assert.equal(lifeMarkup.match(/class="life-photo-title"/g)?.length, 10);
  const lifeImages = [...lifeMarkup.matchAll(/<img\b[^>]*>/g)].map(([image]) => image);
  assert.equal(lifeImages.length, 10, "All ten photographs must be available in the server-rendered gallery");
  for (const image of lifeImages) {
    assert.match(image, /src="\/life\/[^\"]+\.webp"/);
    assert.match(image, /srcSet="[^\"]+-480\.webp 480w,\s*[^\"]+-960\.webp 960w(?:,|"|\s)/i);
    assert.match(image, /loading="lazy"/);
    assert.match(image, /decoding="async"/);
    assert.match(image, /width="\d+"/);
    assert.match(image, /height="\d+"/);
    assert.match(image, /alt="[^\"]+"/);
  }
  assert.doesNotMatch(lifeMarkup, /card-fluid|data-ambient|<canvas\b|<video\b/);
  assert.doesNotMatch(html, /Activation Revelation|id="project"|class="project-section/);
  assert.match(papers.join(""), />Project</, "Publication project links must be retained");
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
  assert.match(css, /\.site-header-layout\s*{[^}]*display:\s*grid/s);
  assert.match(css, /\.site-header-inner\s*{[^}]*display:\s*block[^}]*width:\s*100%/s);
  assert.match(css, /\.language-toggle\s*{[^}]*min-height:/s);
  assert.match(css, /\.language-option\.is-active\s*{/);
  assert.match(css, /\.hero-info-rail\s*{/);
  assert.match(cssRulesForSelector(css, ".hero-affiliations").join("\n"), /display:\s*grid/);
  assert.match(cssRulesForSelector(css, ".hero-profiles").join("\n"), /display:\s*grid/);
  assert.match(css, /\.profile-link\s*{/);
  assert.match(css, /\.award-icon\.is-qmul\s*{/);
  assert.match(css, /\.award-icon\.is-bupt img\s*{/);
  assert.match(css, /\.award-icon\.is-national img\s*{/);
  assert.match(css, /min-height:\s*100svh/);
  assert.doesNotMatch(css, /(?:animation|view|scroll)-timeline\s*:/);
  assert.doesNotMatch(css, /@keyframes\s+(?:content-arrive|hero-deemphasize|research-card-focus|research-heading-focus|award-card-focus|project-layer-reveal)/);
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

  const switcherRule = cssBlock(css, ".section-switcher {");
  assert.match(
    switcherRule,
    /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
  );

  const thumbLayoutRule = cssBlock(css, ".section-switcher-thumb {");
  assert.match(thumbLayoutRule, /width:\s*calc\(100%\s*\/\s*4\)/);

  assert.doesNotMatch(css, /\.section-switcher-drag-handle\b/);
  assert.match(cssRulesForSelector(css, ".section-switcher a").join("\n"), /touch-action:\s*pan-y/);
  assert.doesNotMatch(css, /width:\s*calc\(100%\s*\/\s*3\)/);

  assert.match(cssBlock(css, "html {"), /scroll-padding-top:\s*var\(--section-offset\)/);
  assert.match(cssBlock(css, "html {"), /scroll-behavior:\s*auto/);
  for (const id of ["home", "research", "awards", "life"]) {
    assert.doesNotMatch(cssRulesForSelector(css, `#${id}`).join("\n"), /scroll-margin(?:-top|-block(?:-start)?)?\s*:/);
  }

  const awardItemRule =
    [...css.matchAll(/\.award-item\s*{([^}]*)}/gs)]
      .map((match) => match[1])
      .find((rule) => /contain:\s*paint/.test(rule)) ?? "";
  assert.match(awardItemRule, /contain:\s*paint/);
  assert.doesNotMatch(awardItemRule, /backdrop-filter/);

  assert.match(css, /\.life-row\s*{/);
  assert.doesNotMatch(css, /\.(?:project-panel|project-topline|project-main|project-flow|metric-list)\b/);

  const reducedMotionRules = cssBlock(css, "@media (prefers-reduced-motion: reduce)");
  assert.match(reducedMotionRules, /animation:\s*none\s*!important/);
  assert.doesNotMatch(css, /\.hero-socials\s*{|\.hero-social-link\s*{/);
  assert.doesNotMatch(layout, /AI Researcher/i);
  assert.match(switcher, /aria-current/);
  const sectionSource =
    switcher.match(/const sections = \[[\s\S]*?\] as const;/)?.[0] ?? "";
  assert.match(sectionSource, /id:\s*"home"/);
  assert.match(sectionSource, /id:\s*"research"/);
  assert.match(sectionSource, /id:\s*"awards"/);
  assert.match(sectionSource, /id:\s*"life"/);
  assert.equal(sectionSource.match(/id:\s*"/g)?.length, 4);
  assert.ok(
    sectionSource.indexOf('id: "home"') <
      sectionSource.indexOf('id: "research"'),
  );
  assert.ok(
    sectionSource.indexOf('id: "research"') <
      sectionSource.indexOf('id: "awards"'),
  );
  assert.ok(
    sectionSource.indexOf('id: "awards"') <
      sectionSource.indexOf('id: "life"'),
  );
  assert.doesNotMatch(switcher, /section-switcher-drag-handle/);
  assert.match(switcher, /labels\[section\.labelKey\]/);
  assert.match(switcher, /aria-label=\{ariaLabel\}/);
  assert.doesNotMatch(switcher, /--lens-light-x/);
  assert.doesNotMatch(switcher, /section-switcher-lens-labels|--drag-label-x/);
  assert.match(cssBlock(css, ".site-header-inner {"), /backdrop-filter:\s*blur\([\d.]+px\)\s+saturate\([\d.]+%?\)/);
  assert.match(css, /cubic-bezier\(0\.22,\s*1,\s*0\.36,\s*1\)/);
  assert.doesNotMatch(css, /font-weight\s+170ms/);
  assert.doesNotMatch(css, /--lens-light-x/);
  assert.doesNotMatch(css, /section-switcher-lens-labels|--drag-label-x/);
  assert.doesNotMatch(css, /will-change:\s*transform/);
  assert.doesNotMatch(css, /liquid-(?:skew|stretch)/);
  const thumbRule = css.match(/\.section-switcher-thumb\s*{([^}]*)}/s)?.[1] ?? "";
  assert.doesNotMatch(thumbRule, /backdrop-filter/);
  assert.match(css, /\.section-switcher\.is-dragging/);
  assert.match(page, /loading="lazy"/);
  assert.match(page, /decoding="async"/);
  assert.match(page, /^"use client";/);
  assert.match(page, /useSyncExternalStore/);
  assert.match(page, /window\.localStorage\.getItem\(LANGUAGE_STORAGE_KEY\)/);
  assert.match(page, /window\.localStorage\.setItem\(LANGUAGE_STORAGE_KEY, language\)/);
  assert.match(page, /document\.documentElement\.lang\s*=\s*language === "zh" \? "zh-CN" : "en"/);
  assert.match(page, /document\.title\s*=\s*copy\.documentTitle/);
  assert.match(page, /onClick=\{\(\) => setLanguagePreference\(nextLanguage\)\}/);
  assert.match(page, /switchLanguage:\s*"切换为英文"/);
  assert.match(page, /wechat:\s*"WeChat"/);
  assert.match(page, /wechat:\s*"微信"/);
  assert.doesNotMatch(page, /aria-pressed/);
  assert.equal(page.match(/awards:\s*"Awards"/g)?.length, 1);
  assert.equal(page.match(/awards:\s*"奖项"/g)?.length, 1);
  assert.equal(page.match(/life:\s*"Life"/g)?.length, 1);
  assert.equal(page.match(/life:\s*"生活"/g)?.length, 1);
  assert.match(page, /awardsListLabel:\s*"Awards in reverse chronological order"/);
  assert.match(page, /awardsListLabel:\s*"按时间倒序排列的奖项"/);
  assert.match(page, /何天成/);
  assert.doesNotMatch(page, /天成和|何天诚/);
  assert.match(page, /研究应解决现实问题，改善人们的生活。/);
  assert.match(page, /北京邮电大学/);
  assert.match(page, /华中科技大学/);
  assert.match(page, /RareLens：通过对齐差异化大语言模型推理/);
  assert.match(page, /VCU-LLM：面向智能家居模糊指令理解/);
  assert.match(page, /SaFeR-Steer：基于合成自举与反馈动力学/);
  assert.match(page, /SaFeR-ToolKit：借助虚拟工具调用/);
  assert.match(page, /面向动态知识的可证明检索依赖型基准自动构建流程/);
  assert.match(page, /LatticeMind：面向多智能体系统的冲突感知记忆原语/);
  assert.match(page, /智能体/);
  assert.match(page, /创造力/);
  assert.doesNotMatch(page, /LLM creativity|大模型创造力/i);
  assert.match(page, /后训练/);
  assert.match(page, /可解释性/);
  const awardsSource =
    page.match(/const awards: Award\[\] = \[[\s\S]*?\n\];/)?.[0] ?? "";
  assert.match(
    awardsSource,
    /year:\s*"2026"[\s\S]*?title:\s*{\s*en:\s*"Queen Mary Prize",\s*zh:\s*"Queen Mary Prize"\s*}/,
  );
  assert.match(
    awardsSource,
    /year:\s*"2025"[\s\S]*?title:\s*{[\s\S]*?en:\s*"BUPT First-Class Scholarship",[\s\S]*?zh:\s*"北京邮电大学一等奖学金"[\s\S]*?}/,
  );
  assert.match(
    awardsSource,
    /year:\s*"2024"[\s\S]*?title:\s*{\s*en:\s*"National Scholarship",\s*zh:\s*"国家奖学金"\s*}/,
  );
  assert.ok(
    awardsSource.indexOf('year: "2026"') <
      awardsSource.indexOf('year: "2025"'),
  );
  assert.ok(
    awardsSource.indexOf('year: "2025"') <
      awardsSource.indexOf('year: "2024"'),
  );
  assert.match(
    page,
    /<section[\s\S]*className="awards-section section-pad"[\s\S]*id="awards"[\s\S]*aria-labelledby="awards-heading"/,
  );
  assert.match(page, /<ol className="award-list" aria-label=\{copy\.awardsListLabel\}>/);
  assert.match(page, /<li className="award-item" key=\{award\.year\}>/);
  assert.match(page, /<time dateTime=\{award\.year\}>\{award\.year\}<\/time>/);
  const lifeSource =
    page.match(/<section\b[^>]*className="life-section section-pad"[^>]*>[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(lifeSource, /id="life"/);
  assert.match(lifeSource, /aria-labelledby="life-heading"/);
  assert.match(lifeSource, /<h2 id="life-heading">\{copy\.lifeHeading\}<\/h2>/);
  assert.match(lifeSource, /<LifeGallery language=\{language\}\s*\/>/);
  assert.doesNotMatch(page, /projectFlowLabel|projectModelResponse|projectUnsafeSegments|projectSupportingRegions|projectResultsLabel/);
  assert.match(page, /opensInNewTab/);
  assert.match(page, /publication\.imageAlt\[language\]/);
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
  assert.match(layout, /何天成/);

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
    access(new URL("../out/images/paper-latticemind-1000.webp", import.meta.url)),
    access(new URL("../out/brand/huggingface.svg", import.meta.url)),
    access(new URL("../out/brand/github-mark.svg", import.meta.url)),
    access(new URL("../public/brand/wechat.svg", import.meta.url)),
    access(new URL("../out/brand/wechat.svg", import.meta.url)),
    access(new URL("../docs/brand/wechat.svg", import.meta.url)),
    access(new URL("../out/brand/hust-seal.jpg", import.meta.url)),
    access(new URL("../out/brand/bupt-seal.jpg", import.meta.url)),
    access(new URL("../out/brand/qmul-logo.svg", import.meta.url)),
    access(new URL("../out/brand/prc-national-emblem.png", import.meta.url)),
    access(new URL("../scripts/prepare-pages.mjs", import.meta.url)),
    ...lifePhotos.flatMap(photo => ["out", "docs"].flatMap(directory =>
      ["-480", "-960", ""].map(suffix =>
        access(new URL(`../${directory}/life/${photo.id}${suffix}.webp`, import.meta.url)),
      ),
    )),
  ]);

  const optimizedImages = await Promise.all([
    stat(new URL("../out/images/tiancheng-he-portrait-800.webp", import.meta.url)),
    stat(new URL("../out/images/paper-rarelens-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-vcu-llm-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-safer-steer-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-safer-toolkit-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-livesearchbench-1000.webp", import.meta.url)),
    stat(new URL("../out/images/paper-latticemind-1000.webp", import.meta.url)),
  ]);
  const optimizedImageBytes = optimizedImages.reduce((total, image) => total + image.size, 0);
  assert.ok(optimizedImageBytes < 550_000, `Optimized images total ${optimizedImageBytes} bytes`);
});
