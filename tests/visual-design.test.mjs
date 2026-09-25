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
    ".hero", ".research", ".awards-section", ".life-section", ".section-heading",
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
  assert.match(outerGlass, /backdrop-filter:\s*blur\([\d.]+px\)\s+saturate\([\d.]+%?\)/);
  assert.match(outerGlass, /border-radius:/);
  assert.match(outerGlass, /box-shadow:[^;]*\binset\b/s);
  assert.match(rulesFor(".site-header-inner::before").join("\n"), /background:[^;]*(?:radial|linear)-gradient\(/s);
  for (const [, selectors, declarations] of css.matchAll(/([^{}]+)\{([^{}]*)}/g)) {
    for (const [, backdrop] of declarations.matchAll(/(?:^|;)\s*(?:-webkit-)?backdrop-filter\s*:\s*([^;]+);/g)) {
      if (backdrop.trim() === "none") continue;
      assert.equal(selectors.trim(), ".site-header-inner",
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
  assert.match(rulesFor(".site-header-inner", opaque).join("\n"), /backdrop-filter:\s*none/);
  assert.match(rulesFor(".site-header-inner", opaque).join("\n"), /background:/);
  const contrast = blockAt("@media (prefers-contrast: more)").body;
  assert.match(rulesFor(".section-switcher-thumb", contrast).join("\n"), /border-color:/);
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

test("fluid colors follow independent, visibly flowing compositor-only paths", () => {
  const paths = [];
  for (const color of ["gold", "rose", "violet", "cyan"]) {
    const frames = blockAt(`@keyframes fluid-${color}`).body;
    const properties = [...new Set([...frames.matchAll(/\b([a-z-]+)\s*:/gi)].map(([, property]) => property))];
    assert.deepEqual(properties, ["transform"], "Background motion must not animate layout, blur, filters, or gradients");
    const transforms = [...frames.matchAll(/transform:\s*([^;]+);/g)].map(([, value]) => value);
    assert.ok(new Set(transforms).size >= 3, "Fluid colors need multiple distinct positions along their paths");
    const translations = [...frames.matchAll(/translate3d\((-?[\d.]+)%,\s*(-?[\d.]+)%,\s*0\)/g)]
      .map(([, x, y]) => [Number(x), Number(y)]);
    for (const axis of [0, 1]) {
      const values = translations.map(point => point[axis]);
      assert.ok(Math.max(...values) - Math.min(...values) >= 30, "Color fields must visibly travel, not remain nearly static");
    }
    paths.push(transforms.join(";"));
    const colorRule = rulesFor(`.fluid-color.is-${color}`).join("\n");
    assert.match(colorRule, /background:\s*radial-gradient\(/, "Each color needs a prepainted gradient field");
    assert.match(colorRule, /transform:\s*translate3d\(/, "Reduced-motion users must still get a composed static color field");
  }
  assert.equal(new Set(paths).size, 4, "Colors must not drift in lockstep");
});

test("fluid animation is opt-in to motion preference and gated by the shared controller", () => {
  const motionBlocks = [...css.matchAll(/@media\s*\(prefers-reduced-motion:\s*no-preference\)/g)]
    .map(match => blockAt(match[0], match.index));
  assert.ok(motionBlocks.length);
  const permitted = motionBlocks.map(block => block.body).join("\n");
  let outside = css;
  for (const block of motionBlocks.toReversed()) outside = outside.slice(0, block.start) + outside.slice(block.end);
  for (const selector of [".fluid-color", ...["gold", "rose", "violet", "cyan"].map(color => `.fluid-color.is-${color}`)]) {
    assert.doesNotMatch(rulesFor(selector, outside).join("\n"), /\banimation(?:-name)?\s*:/,
      "Reduced-motion users must not receive ambient animations");
  }
  const animatedFields = rulesFor(".fluid-color", permitted).join("\n");
  assert.match(animatedFields, /animation:\s*fluid-gold\b[^;]*\binfinite/);
  assert.match(animatedFields, /animation-play-state:\s*paused/);
  for (const surface of ["card-fluid", "hero-spectrum", "page-spectrum"]) {
    assert.match(rulesFor(`.${surface}[data-running="true"] .fluid-color`, permitted).join("\n"),
      /animation-play-state:\s*running/, `${surface} must use the shared pause state`);
  }
});

test("the hero and page flow behind stationary content without animating expensive effects", () => {
  for (const surface of ["hero-spectrum", "page-spectrum"]) {
    const rules = rulesFor(`.${surface}`).join("\n");
    assert.match(rules, /overflow:\s*hidden/);
    assert.match(rules, /contain:\s*strict/);
    assert.match(rules, /pointer-events:\s*none/);
    assert.doesNotMatch(rules, /\b(?:animation|animation-name|filter|backdrop-filter)\s*:/,
      "Only the contained color fields should animate, not the full viewport layer");
    assert.doesNotMatch(rulesFor(`.${surface} .fluid-color`).join("\n"), /\b(?:filter|backdrop-filter)\s*:/);
  }
  assert.match(rulesFor(".page-spectrum").join("\n"), /position:\s*fixed/);
  assert.match(rulesFor(".page-spectrum").join("\n"), /inset:\s*0\s*;/);
  assert.match(rulesFor(".page-spectrum").join("\n"), /z-index:\s*0/);
  assert.match(rulesFor(".portfolio-shell").join("\n"), /z-index:\s*1/);
  assert.match(rulesFor(".hero-spectrum").join("\n"), /position:\s*absolute/);
  assert.match(rulesFor(".hero-spectrum").join("\n"), /z-index:\s*-1/);
  const veil = rulesFor(".hero-spectrum::after").join("\n");
  assert.match(veil, /background:\s*linear-gradient\(/);
  assert.doesNotMatch(veil, /\banimation(?:-name)?\s*:/, "The hero contrast veil must stay stationary");
  assert.doesNotMatch(css, /@keyframes\s+spectrum-drift\b/, "The obsolete ring animation must not keep rendering alongside the fluid fields");
  assert.match(rulesFor(".page-spectrum .is-rose").join("\n"), /display:\s*none/);
  assert.match(rulesFor(".page-spectrum .is-violet").join("\n"), /display:\s*none/);
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
  for (const surface of [".hero-spectrum", ".page-spectrum"]) {
    assert.match(rulesFor(surface, forced).join("\n"), /display:\s*none/);
  }
});

test("color motion stays clipped and underneath stationary reading surfaces", () => {
  const backdrop = rulesFor(".card-fluid").join("\n");
  assert.match(backdrop, /position:\s*absolute/);
  assert.match(backdrop, /overflow:\s*hidden/);
  assert.match(backdrop, /contain:\s*strict/);
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
