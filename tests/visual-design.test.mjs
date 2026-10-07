import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const css = (await readFile(new URL("../app/globals.css", import.meta.url), "utf8"))
  .replace(/\/\*[\s\S]*?\*\//g, "");

function rulesFor(selector, source = css) {
  return [...source.matchAll(/([^{}]+)\{([^{}]*)}/g)]
    .filter(([, selectors]) => selectors.split(",").some(value => value.trim() === selector))
    .map(([, , declarations]) => declarations);
}

function blockAt(marker, start = css.indexOf(marker)) {
  assert.notEqual(start, -1, `Missing CSS block: ${marker}`);
  const opening = css.indexOf("{", start);
  let depth = 0;
  for (let index = opening; index < css.length; index += 1) {
    if (css[index] === "{") depth += 1;
    if (css[index] === "}") depth -= 1;
    if (!depth) return { start, end: index + 1, body: css.slice(opening + 1, index) };
  }
  assert.fail(`Unclosed CSS block: ${marker}`);
}

test("all reading content stays visible during native continuous page scrolling", () => {
  assert.match(rulesFor("html")[0], /scroll-behavior:\s*auto\s*;/,
    "Smooth scrolling should be requested only by explicit navigation, not imposed on every scroll operation");
  assert.doesNotMatch(css, /(?:animation|scroll|view)-timeline\s*:/);
  assert.doesNotMatch(css, /\b(?:view|scroll)\s*\(/);
  assert.doesNotMatch(css, /content-arrive|hero-deemphasize|research-card-focus|award-card-focus/);
  assert.doesNotMatch(css, /scroll-snap-(?:type|align|stop)\s*:/,
    "Reading the page must not snap or redirect the visitor's scroll position");
  const content = [
    ".hero", ".research", ".project-section", ".project-card", ".awards-section", ".life-section", ".section-heading",
    ".publication-card", ".award-item", ".life-gallery", ".life-row", ".life-photo",
  ];
  for (const selector of content) {
    const rules = rulesFor(selector).join("\n");
    for (const [, value] of rules.matchAll(/\banimation(?:-name)?\s*:\s*([^;]+);/g)) {
      assert.match(value, /^none(?:\s*!important)?$/, `${selector} must not animate reading content in or out`);
    }
    for (const [, value] of rules.matchAll(/\bopacity\s*:\s*([^;]+);/g)) {
      assert.match(value, /^1(?:\s*!important)?$/, `${selector} must remain fully visible`);
    }
    assert.doesNotMatch(rules, /(?:visibility:\s*hidden|content-visibility:\s*(?:auto|hidden)|filter:\s*(?:blur|grayscale))/,
      `${selector} must never be hidden, blurred, or desaturated by the scrolling mechanism`);
  }
});

test("navigation has a larger centered desktop layout and readable touch targets at every breakpoint", () => {
  const desktopLayout = rulesFor(".site-header-layout")[0];
  const tracks = desktopLayout.match(/grid-template-columns:\s*(minmax\([^,]+,\s*1fr\))\s+minmax\(0,\s*(\d+)px\)\s+\1\s*;/);
  assert.ok(tracks, "The centered navigation needs matching left and right grid tracks");
  assert.ok(Number(tracks[2]) >= 560, "The desktop navigation should no longer be a small 420 px control");
  const links = rulesFor(".section-switcher a");
  assert.ok(Number(links[0].match(/min-height:\s*(\d+)px/)?.[1]) >= 52);
  assert.ok(Number(links[0].match(/font-size:\s*([\d.]+)rem/)?.[1]) >= 0.95);
  for (const rule of links) {
    for (const [, height] of rule.matchAll(/min-height:\s*([\d.]+)px/g)) {
      assert.ok(Number(height) >= 44, "Mobile navigation must preserve comfortable touch targets");
    }
    for (const [, size] of rule.matchAll(/font-size:\s*([^;]+);/g)) {
      const remSizes = [...size.matchAll(/([\d.]+)rem/g)].map(([, value]) => Number(value));
      assert.ok(remSizes.length && remSizes.every(value => value >= 0.75),
        "Navigation text must not shrink to fit side controls on small phones");
    }
  }
  const narrow = [...css.matchAll(/@media\s*\(max-width:\s*700px\)/g)]
    .map(match => blockAt(match[0], match.index).body).join("\n");
  assert.match(rulesFor(".site-header-inner", narrow).join("\n"), /grid-row:\s*2\s*;/,
    "Narrow screens should give the navigation a full second row instead of squeezing its labels");
  assert.match(rulesFor(".site-header-inner", narrow).join("\n"), /grid-column:\s*1\s*\/\s*-1\s*;/);
  assert.match(rulesFor(".section-switcher a").join("\n"), /touch-action:\s*pan-y\s*;/);
  assert.match(rulesFor(".section-switcher a:focus-visible").join("\n"), /outline:\s*2px\s+solid/);
});

test("glass uses one bounded backdrop layer, specular edges, and accessible opaque fallbacks", () => {
  const outerGlass = rulesFor(".site-header-inner")[0];
  assert.match(rulesFor(".site-header-inner::before")[0], /backdrop-filter:\s*blur\([\d.]+px\)\s+saturate\([\d.]+%?\)/);
  assert.match(outerGlass, /border-radius:/);
  assert.match(outerGlass, /box-shadow:[^;]*\binset\b/s);
  assert.match(rulesFor(".site-header-inner::before").join("\n"), /background:[^;]*(?:radial|linear)-gradient\(/s);
  for (const [, selectors, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)}/g)) {
    for (const [, backdrop] of declarations.matchAll(/(?:^|;)\s*(?:-webkit-)?backdrop-filter\s*:\s*([^;]+);/g)) {
      if (backdrop.trim() === "none") continue;
      assert.equal(selectors.trim(), ".site-header-inner::before",
        "Only the bounded header shell should blur the page; the thumb and full-width header must not blur again");
    }
  }
  const thumb = rulesFor(".section-switcher-thumb").join("\n");
  for (const [, backdrop] of thumb.matchAll(/(?:^|;)\s*(?:-webkit-)?backdrop-filter\s*:\s*([^;]+);/g)) {
    assert.equal(backdrop.trim(), "none", "The moving thumb must not create a second filtered backdrop");
  }
  assert.doesNotMatch(css, /section-switcher-lens-labels|--drag-label-x/,
    "The glass treatment must not duplicate navigation labels");
  const opaque = blockAt("@media (prefers-reduced-transparency: reduce)").body;
  assert.match(rulesFor(".site-header-inner::before", opaque).join("\n"), /backdrop-filter:\s*none/);
  assert.match(rulesFor(".site-header-inner", opaque).join("\n"), /background:/);
  const contrast = blockAt("@media (prefers-contrast: more)").body;
  assert.match(rulesFor(".section-switcher-thumb", contrast).join("\n"), /border-color:/);
});

test("project preview remains uncropped and stacks above details on mobile", () => {
  assert.match(rulesFor(".project-card")[0], /display:\s*grid/);
  const preview = rulesFor(".project-preview img").join("\n");
  assert.match(preview, /object-fit:\s*contain/);
  assert.match(preview, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(rulesFor(".project-action")[0], /min-height:\s*44px/);
  const narrow = [...css.matchAll(/@media\s*\(max-width:\s*700px\)/g)]
    .map(match => blockAt(match[0], match.index).body).join("\n");
  assert.match(rulesFor(".project-card", narrow).join("\n"), /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});

test("awards remain one full-width row per item at every CSS breakpoint", () => {
  const rules = rulesFor(".award-list");
  assert.ok(rules.length, "The award list must have explicit layout rules");
  assert.match(rules[0], /display:\s*grid\s*;/);
  const columns = rules.flatMap(rule => [...rule.matchAll(/grid-template-columns:\s*([^;]+);/g)]
    .map(([, value]) => value.trim()));
  assert.ok(columns.length, "Award rows must declare a single grid track");
  for (const value of columns) {
    assert.match(value, /^(?:minmax\(0,\s*1fr\)|1fr)$/, "No desktop, tablet, or mobile override may create multiple award columns");
  }
  assert.doesNotMatch(rules.join("\n"), /grid-auto-flow:\s*(?:dense\s+)?column\b/);
  for (const rule of rulesFor(".award-item")) {
    assert.doesNotMatch(rule, /(?:^|;)\s*(?:width|max-width):\s*(?:\d+(?:px|rem|em)|(?:[1-9]|[1-9]\d)%)\s*;/,
      "Award items must fill the list rather than retain a narrow card width");
  }
});

test("Queen Mary crown preserves every original path inside a padded standalone asset", async () => {
  const [logo, crown] = await Promise.all([
    readFile(new URL("../public/brand/qmul-logo.svg", import.meta.url), "utf8"),
    readFile(new URL("../public/brand/qmul-crown.svg", import.meta.url), "utf8"),
  ]);
  const paths = source => [...source.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)]
    .map(([, path]) => path.replace(/\s+/g, " ").trim());
  assert.equal(paths(crown).length, 7, "The crown must include its center, both points, both flourishes, base, and top");
  assert.deepEqual(paths(crown), paths(logo).slice(-7), "The standalone crown must not redraw or trim the original artwork");
  assert.match(crown, /viewBox="-198 366 56 48"/,
    "The crown's viewBox needs padding around all seven original paths");
  assert.match(logo, /viewBox="-196 368\.2 217\.6 57\.8"/, "The full university logo must remain intact");
  assert.doesNotMatch(crown, /<(?:clipPath|mask)\b|\btransform\s*=/,
    "The standalone asset must preserve its original geometry without clipping");
});

test("Queen Mary crown stays contained at desktop and mobile sizes without CSS cropping", () => {
  assert.match(rulesFor(".award-icon")[0], /width:\s*64px\s*;/);
  const imageRules = rulesFor(".award-icon img").join("\n");
  assert.match(imageRules, /object-fit:\s*contain\s*;/);
  assert.match(imageRules, /max-width:\s*100%\s*;/);
  assert.match(imageRules, /max-height:\s*100%\s*;/);
  const crownRules = rulesFor(".award-icon.is-qmul img");
  assert.ok(crownRules.length, "The crown needs explicit responsive sizing");
  assert.match(crownRules[0], /width:\s*60px\s*;/);
  for (const rule of crownRules) {
    assert.match(rule, /height:\s*auto\s*;/, "Crown sizing must preserve the asset's aspect ratio");
  }
  const iconRules = [
    ...rulesFor(".award-icon"), ...rulesFor(".award-icon img"),
    ...rulesFor(".award-icon.is-qmul"), ...crownRules,
  ].join("\n");
  assert.doesNotMatch(iconRules, /overflow(?:-[xy])?:\s*(?:hidden|clip)\b|position:\s*absolute\b|\btransform\s*:/,
    "The complete crown must fit normally, not be extracted from the wordmark by cropping or offsets");
  const narrow = [...css.matchAll(/@media\s*\(max-width:\s*700px\)/g)]
    .map(match => blockAt(match[0], match.index).body).join("\n");
  assert.match(rulesFor(".award-icon", narrow).join("\n"), /width:\s*46px\s*;/);
  assert.match(rulesFor(".award-icon.is-qmul img", narrow).join("\n"), /width:\s*44px\s*;/);
});

test("ambient gradients share one bounded, compositor-only animation per surface", () => {
  const frames = blockAt("@keyframes fluid-drift").body;
  const properties = [...new Set([...frames.matchAll(/\b([a-z-]+)\s*:/gi)].map(([, property]) => property))];
  assert.deepEqual(properties, ["transform"]);
  const field = rulesFor(".fluid-field").join("\n");
  assert.equal((field.match(/radial-gradient\(/g) ?? []).length, 4, "Keep all four colors in a single prepainted plane");
  assert.match(field, /inset:\s*-10%/);
  assert.match(field, /transform:\s*none/);
  assert.doesNotMatch(field, /will-change|translate3d/);
  assert.doesNotMatch(css, /fluid-gold|fluid-rose|fluid-violet|fluid-cyan|page-spectrum|nav-refraction/);
});

test("only nearby ambient surfaces allocate animations; pause preserves visible frames", () => {
  const permitted = blockAt("@media (prefers-reduced-motion: no-preference)").body;
  const allocation = rulesFor('[data-ambient][data-visible="true"] > .fluid-field', permitted).join("\n");
  assert.match(allocation, /animation:\s*fluid-drift/);
  assert.match(allocation, /animation-play-state:\s*paused/);
  assert.match(rulesFor('[data-ambient][data-visible="true"][data-running="true"] > .fluid-field', permitted).join("\n"), /animation-play-state:\s*running/);
  assert.doesNotMatch(rulesFor(".fluid-field").join("\n"), /\banimation(?:-name)?\s*:/);
  for (const selector of [".card-fluid", ".hero-spectrum"]) {
    const rules = rulesFor(selector).join("\n");
    assert.match(rules, /background:[^;]*radial-gradient/s, "Every surface keeps static fallback colors regardless of observer state");
    assert.match(rules, /pointer-events:\s*none/);
    assert.doesNotMatch(rules, /\b(?:animation|animation-name|filter|backdrop-filter)\s*:/);
  }
});

test("navigation text is independent of backdrop filtering and layer promotion", () => {
  assert.doesNotMatch(rulesFor(".site-header-inner").join("\n"), /\b(?:filter|backdrop-filter)\s*:/);
  assert.doesNotMatch(css, /backdrop-filter:\s*url\(|translateZ\(/);
  assert.match(rulesFor(".site-header-inner > *").join("\n"), /z-index:\s*1/);
  assert.match(rulesFor(".site-header-inner::before").join("\n"), /z-index:\s*0/);
  assert.doesNotMatch(rulesFor(".section-switcher a > span").join("\n"), /transform:/);
});

test("Creativity has a multicolor treatment with readable browser and forced-color fallbacks", () => {
  const supportMarker = "@supports ((background-clip: text) or (-webkit-background-clip: text))";
  const supportIndex = css.indexOf(supportMarker);
  assert.notEqual(supportIndex, -1, "Transparent text must only be enabled where text clipping is supported");
  const fallback = rulesFor(".creativity-spectrum", css.slice(0, supportIndex)).join("\n");
  assert.match(fallback, /color:\s*#[a-f\d]{3,8}\s*;/i);
  assert.doesNotMatch(fallback, /color:\s*transparent/);
  const gradient = rulesFor(".creativity-spectrum", blockAt(supportMarker).body).join("\n");
  assert.match(gradient, /background:\s*linear-gradient\(/);
  assert.ok(new Set(gradient.match(/#[a-f\d]{6}\b/gi)).size >= 4, "Creativity should show a spectrum, not a two-color tint");
  assert.match(gradient, /background-clip:\s*text/);
  assert.match(gradient, /color:\s*transparent/);
  assert.doesNotMatch(rulesFor(".creativity-spectrum").join("\n"), /\b(?:animation|animation-name|filter)\s*:/,
    "The colorful word must remain stable and legible as the background moves");
  const forced = blockAt("@media (forced-colors: active)").body;
  const forcedText = rulesFor(".creativity-spectrum", forced).join("\n");
  assert.match(forcedText, /background:\s*none/);
  assert.match(forcedText, /color:\s*CanvasText/);
  for (const surface of [".hero-spectrum"]) {
    assert.match(rulesFor(surface, forced).join("\n"), /display:\s*none/);
  }
});

test("color motion stays clipped and underneath stationary reading surfaces", () => {
  const backdrop = rulesFor(".card-fluid").join("\n");
  assert.match(backdrop, /position:\s*absolute/);
  assert.match(backdrop, /overflow:\s*hidden/);
  assert.match(backdrop, /contain:\s*paint/);
  assert.match(backdrop, /pointer-events:\s*none/);
  assert.match(backdrop, /z-index:\s*0/);
  for (const selector of [".publication-body", ".award-item time", ".award-icon", ".award-item h3"]) {
    assert.match(rulesFor(selector).join("\n"), /z-index:\s*1/, `${selector} must sit above the decorative color fields`);
  }
  for (const selector of [".card-fluid::after", ".award-item .card-fluid::after"]) {
    const rules = rulesFor(selector).join("\n");
    assert.match(rules, /background:\s*linear-gradient\(/, `${selector} must retain its stationary contrast veil`);
    assert.doesNotMatch(rules, /\banimation(?:-name)?\s*:/, "The reading surface must not animate with its background");
  }
});

test("photographs retain their original framing and the viewer controls remain accessible", () => {
  assert.match(rulesFor(".life-photo").join("\n"), /flex:\s*var\(--photo-ratio\)/,
    "Desktop rows must size photographs from their original aspect ratios");
  for (const selector of [".life-photo > img", ".life-lightbox-image"]) {
    const rules = rulesFor(selector).join("\n");
    assert.match(rules, /object-fit:\s*contain/);
    assert.doesNotMatch(rules, /\b(?:animation|animation-name|filter|backdrop-filter)\s*:/,
      "Photographs must not inherit the decorative fluid animation");
  }
  assert.match(rulesFor(".life-photo--landscape").join("\n"), /grid-column:\s*1\s*\/\s*-1/,
    "Landscape framing must span the narrow-screen grid");
  for (const selector of [".life-lightbox-close", ".life-lightbox-nav"]) {
    const rules = rulesFor(selector).join("\n");
    assert.match(rules, /width:\s*44px/);
    assert.match(rules, /height:\s*44px/);
    assert.match(rulesFor(`${selector}:focus-visible`).join("\n"), /outline:\s*2px\s+solid/);
  }
  assert.match(rulesFor(".life-lightbox").join("\n"), /height:\s*100dvh/);
  assert.match(rulesFor(".life-lightbox-inner").join("\n"), /env\(safe-area-inset-top\)/);
});

test("poetic photograph titles remain visible without hover or motion", () => {
  for (const selector of [".life-photo-caption", ".life-photo-title", ".life-lightbox-title"]) {
    const rules = rulesFor(selector);
    assert.ok(rules.length, `${selector} must have an intentional visible presentation`);
    assert.doesNotMatch(rules.join("\n"), /(?:display:\s*none|visibility:\s*hidden|opacity:\s*0(?:\s*;|\s*$)|\b(?:animation|animation-name)\s*:)/,
      "Titles must not require hovering or an animation to appear");
  }
});

test("contact icons share circular geometry and distinct email and WeChat colors", () => {
  const icon = rulesFor(".contact-icon").join("\n");
  assert.match(icon, /width:\s*32px\s*;/);
  assert.match(icon, /height:\s*32px\s*;/);
  assert.match(icon, /border-radius:\s*50%\s*;/);
  assert.match(icon, /flex-shrink:\s*0\s*;/, "Narrow layouts must not squash the circular icons");
  assert.doesNotMatch(icon, /\b(?:animation|animation-name|filter|backdrop-filter)\s*:/,
    "Contact symbols must remain sharp and stationary over the ambient background");

  const backgrounds = ["email", "wechat"].map(channel => {
    const rules = rulesFor(`.contact-icon--${channel}`).join("\n");
    const background = rules.match(/background(?:-color)?:\s*([^;]+);/)?.[1];
    assert.ok(background, `${channel} needs its own colored circular backing`);
    assert.doesNotMatch(rules, /(?:width|height|border-radius):/,
      "Both channels must inherit the same circular shape");
    return background;
  });
  assert.notEqual(backgrounds[0], backgrounds[1], "Email and WeChat should be distinguishable at a glance");
});

test("all six identity icons share a fixed size and the rail groups content without truncating contacts", () => {
  const icon = rulesFor(".identity-icon").join("\n");
  assert.match(icon, /width:\s*32px/);
  assert.match(icon, /height:\s*32px/);
  assert.match(icon, /flex-shrink:\s*0/);
  assert.match(icon, /border-radius:\s*50%/);
  assert.doesNotMatch(css, /\.affiliation-item\s*>\s*img\s*\{/,
    "Old phone overrides must not shrink only the school icons");
  assert.match(rulesFor(".hero-info-rail")[0], /display:\s*grid/);
  assert.match(rulesFor(".hero-info-rail")[0], /grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)\s+minmax\(260px,\s*1\.35fr\)/);
  for (const selector of [".affiliation-item", ".profile-link", ".contact-email", ".contact-wechat"]) {
    assert.match(rulesFor(selector).join("\n"), /min-height:\s*44px/);
  }
  const narrow = [...css.matchAll(/@media\s*\(max-width:\s*700px\)/g)]
    .map(match => blockAt(match[0], match.index).body).join("\n");
  assert.match(rulesFor(".hero-info-rail", narrow).join("\n"), /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(rulesFor(".contact-links", narrow).join("\n"), /grid-column:\s*1\s*\/\s*-1/);
  assert.match(rulesFor(".contact-text").join("\n"), /overflow-wrap:\s*anywhere/);
  assert.doesNotMatch(rulesFor(".contact-text").join("\n"), /text-overflow:\s*ellipsis|white-space:\s*nowrap/);
});
