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

function assertCompositorOnlyKeyframes(source, name) {
  const frames = cssBlock(source, `@keyframes ${name}`);
  const properties = [
    ...new Set(
      [...frames.matchAll(/\b([a-z-]+)\s*:/gi)].map((match) => match[1]),
    ),
  ].sort();

  assert.deepEqual(
    properties,
    ["opacity", "transform"],
    `${name} must animate only opacity and transform`,
  );
  assert.doesNotMatch(frames, /(?:^|-)filter\s*:/i);
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
  assert.match(html, /Research should solve real-world problems/);
  assert.match(html, /and improve people’s lives\./);
  assert.match(html, />Home</);
  assert.match(html, />Research</);
  assert.match(html, />Awards</);
  assert.match(html, />Project</);
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
  assert.equal(switcherMarkup.match(/>Project</g)?.length, 1);
  assert.equal(switcherMarkup.match(/<a\b/g)?.length, 4);
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
  assert.match(html, /Master(?:’|'|&#x27;)s/);
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
  assert.ok(awardsMarkup.indexOf("2026") < awardsMarkup.indexOf("2025"));
  assert.ok(awardsMarkup.indexOf("2025") < awardsMarkup.indexOf("2024"));
  assert.match(html, /Activation Revelation/);
  assert.match(html, /<h2>Project<\/h2>/);
  assert.match(html, /<h3>Activation Revelation<\/h3>/);
  const projectMarkup =
    html.match(/<section class="project-section section-pad"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(projectMarkup, /class="project-topline"/);
  assert.match(projectMarkup, /class="project-main"/);
  assert.match(projectMarkup, /class="project-flow"/);
  assert.match(
    projectMarkup,
    /<ol aria-label="Safety-auditing workflow">[\s\S]*Model response[\s\S]*Unsafe segments[\s\S]*Supporting image regions[\s\S]*<\/ol>/,
  );
  assert.match(
    projectMarkup,
    /<dl class="metric-list" aria-label="Project results">/,
  );
  assert.equal(projectMarkup.match(/<dt>/g)?.length, 3);
  assert.equal(projectMarkup.match(/<dd>/g)?.length, 3);
  assert.match(projectMarkup, /<dt>Macro-F1<\/dt><dd>\+7\.2%<\/dd>/);
  assert.match(projectMarkup, /<dt>ACC@0\.5<\/dt><dd>\+26\.9%<\/dd>/);
  assert.match(projectMarkup, /<dt>new dataset<\/dt><dd>ARGUS<\/dd>/);
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
  assert.match(css, /\.site-header-layout\s*{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(56px,\s*1fr\)\s+minmax\(0,\s*420px\)\s+minmax\(56px,\s*1fr\)/s);
  assert.match(css, /\.site-header-inner\s*{[^}]*display:\s*block[^}]*width:\s*100%/s);
  assert.match(css, /\.language-toggle\s*{[^}]*min-height:\s*53px/s);
  assert.match(css, /\.language-option\.is-active\s*{/);
  assert.match(css, /grid-template-columns:\s*56px\s+minmax\(0,\s*1fr\)\s+56px/);
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

  const switcherRule = cssBlock(css, ".section-switcher {");
  assert.match(
    switcherRule,
    /grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
  );

  const thumbLayoutRule = cssBlock(css, ".section-switcher-thumb {");
  assert.match(thumbLayoutRule, /width:\s*calc\(100%\s*\/\s*4\)/);

  const dragHandleRule = cssBlock(css, ".section-switcher-drag-handle {");
  assert.match(dragHandleRule, /width:\s*calc\(100%\s*\/\s*4\)/);
  assert.doesNotMatch(css, /width:\s*calc\(100%\s*\/\s*3\)/);

  assert.match(
    css,
    /#home,\s*#research,\s*#awards,\s*#project\s*{[^}]*scroll-margin-top:/s,
  );

  const awardItemRule =
    [...css.matchAll(/\.award-item\s*{([^}]*)}/gs)]
      .map((match) => match[1])
      .find((rule) => /contain:\s*paint/.test(rule)) ?? "";
  assert.match(awardItemRule, /contain:\s*paint/);
  assert.doesNotMatch(awardItemRule, /backdrop-filter/);

  const projectPanelRule =
    [...css.matchAll(/\.project-panel\s*{([^}]*)}/gs)]
      .map((match) => match[1])
      .find((rule) => /contain:\s*paint/.test(rule)) ?? "";
  assert.match(projectPanelRule, /contain:\s*paint/);
  assert.doesNotMatch(projectPanelRule, /backdrop-filter/);
  assert.match(css, /\.project-topline\s*{/);
  assert.match(css, /\.project-flow\s*{/);
  assert.match(css, /\.metric-list\s*{[^}]*display:\s*grid/s);

  const cardFocusFrames = cssBlock(css, "@keyframes research-card-focus");
  assert.match(cardFocusFrames, /transform:\s*translate3d/);
  assert.doesNotMatch(cardFocusFrames, /scale:/);

  const heroFrames = cssBlock(css, "@keyframes hero-deemphasize");
  assert.match(heroFrames, /opacity:/);
  assert.doesNotMatch(heroFrames, /scale:|transform:/);

  assertCompositorOnlyKeyframes(css, "award-card-focus");
  assertCompositorOnlyKeyframes(css, "project-panel-reveal");
  assertCompositorOnlyKeyframes(css, "project-layer-reveal");

  const viewTimelineRules = cssBlock(css, "@supports (animation-timeline: view())");
  assert.match(
    viewTimelineRules,
    /@media\s*\(prefers-reduced-motion:\s*no-preference\)\s*{/,
  );
  assert.match(
    viewTimelineRules,
    /\.hero\s*{[^}]*animation:\s*hero-deemphasize linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*exit 0% exit 68%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.publication-card\s*{[^}]*animation:\s*research-card-focus linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*cover 0% cover 100%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.awards-section \.section-heading\s*{[^}]*animation:\s*research-heading-focus linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*cover 0% cover 100%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.award-item\s*{[^}]*animation:\s*award-card-focus linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*cover 0% cover 88%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.award-item:nth-child\(2\)\s*{[^}]*animation-range:\s*cover 6% cover 94%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.award-item:nth-child\(3\)\s*{[^}]*animation-range:\s*cover 12% cover 100%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.project-section \.section-heading\s*{[^}]*animation:\s*project-layer-reveal linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*entry 0% entry 100%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.project-panel\s*{[^}]*animation:\s*project-panel-reveal linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*entry 0% cover 45%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.project-topline,\s*\.project-main,\s*\.metric-list\s*{[^}]*animation:\s*project-layer-reveal linear both[^}]*animation-timeline:\s*view\(block\)[^}]*animation-range:\s*entry 0% entry 100%/s,
  );
  assert.match(
    viewTimelineRules,
    /\.project-panel:focus-within,\s*\.project-topline:focus-within\s*{[^}]*opacity:\s*1\s*!important[^}]*transform:\s*none\s*!important/s,
  );
  assert.match(viewTimelineRules, /\.publication-card:focus-within\s*{[^}]*opacity:\s*1\s*!important/s);
  assert.match(viewTimelineRules, /\.publication-card:hover\s*{[^}]*opacity:\s*1\s*!important/s);

  const reducedMotionRules = cssBlock(css, "@media (prefers-reduced-motion: reduce)");
  assert.match(reducedMotionRules, /\.hero,[\s\S]*\.publication-card,/);
  const reducedAnimationReset = reducedMotionRules.match(
    /\.hero,\s*\.research \.section-heading,\s*\.publication-card,\s*\.awards-section \.section-heading,\s*\.award-item,\s*\.project-section \.section-heading,\s*\.project-panel,\s*\.project-topline,\s*\.project-main,\s*\.metric-list\s*{([^}]*)}/s,
  );
  assert.ok(reducedAnimationReset, "Missing reduced-motion reset for Awards and Project");
  assert.match(reducedAnimationReset[1], /animation:\s*none\s*!important/);
  assert.match(reducedAnimationReset[1], /opacity:\s*1/);
  assert.match(reducedAnimationReset[1], /transform:\s*none/);
  assert.match(reducedMotionRules, /animation:\s*none\s*!important/);
  assert.match(reducedMotionRules, /filter:\s*none/);
  assert.match(reducedMotionRules, /opacity:\s*1/);
  assert.doesNotMatch(css, /\.hero-socials\s*{|\.hero-social-link\s*{/);
  assert.doesNotMatch(layout, /AI Researcher/i);
  assert.match(switcher, /aria-current/);
  const sectionSource =
    switcher.match(/const sections = \[[\s\S]*?\] as const;/)?.[0] ?? "";
  assert.match(sectionSource, /id:\s*"home"/);
  assert.match(sectionSource, /id:\s*"research"/);
  assert.match(sectionSource, /id:\s*"awards"/);
  assert.match(sectionSource, /id:\s*"project"/);
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
      sectionSource.indexOf('id: "project"'),
  );
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
  assert.match(switcher, /labels\[section\.labelKey\]/);
  assert.match(switcher, /aria-label=\{ariaLabel\}/);
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
  assert.match(page, /^"use client";/);
  assert.match(page, /useSyncExternalStore/);
  assert.match(page, /window\.localStorage\.getItem\(LANGUAGE_STORAGE_KEY\)/);
  assert.match(page, /window\.localStorage\.setItem\(LANGUAGE_STORAGE_KEY, language\)/);
  assert.match(page, /document\.documentElement\.lang\s*=\s*language === "zh" \? "zh-CN" : "en"/);
  assert.match(page, /document\.title\s*=\s*copy\.documentTitle/);
  assert.match(page, /onClick=\{\(\) => setLanguagePreference\(nextLanguage\)\}/);
  assert.match(page, /switchLanguage:\s*"切换为英文"/);
  assert.doesNotMatch(page, /aria-pressed/);
  assert.equal(page.match(/awards:\s*"Awards"/g)?.length, 1);
  assert.equal(page.match(/awards:\s*"奖项"/g)?.length, 1);
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
  assert.match(page, /LiveSearchBench：面向动态知识检索与推理/);
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
  const projectSource =
    page.match(/<section className="project-section section-pad"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.match(projectSource, /className="project-topline"/);
  assert.match(projectSource, /className="project-main"/);
  assert.match(projectSource, /className="project-flow"/);
  assert.match(projectSource, /<ol aria-label=\{copy\.projectFlowLabel\}>/);
  assert.match(projectSource, /copy\.projectModelResponse/);
  assert.match(projectSource, /copy\.projectUnsafeSegments/);
  assert.match(projectSource, /copy\.projectSupportingRegions/);
  assert.match(
    projectSource,
    /<dl className="metric-list" aria-label=\{copy\.projectResultsLabel\}>/,
  );
  assert.equal(projectSource.match(/<dt>/g)?.length, 3);
  assert.equal(projectSource.match(/<dd>/g)?.length, 3);
  assert.match(page, /projectModelResponse:\s*"模型回复"/);
  assert.match(page, /projectUnsafeSegments:\s*"不安全片段"/);
  assert.match(page, /projectSupportingRegions:\s*"风险支撑区域"/);
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
