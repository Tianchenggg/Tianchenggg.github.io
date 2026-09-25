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
  assert.match(rulesFor('.card-fluid[data-running="true"] .fluid-color', permitted).join("\n"),
    /animation-play-state:\s*running/);
});

test("color motion stays clipped and underneath stationary reading surfaces", () => {
  const backdrop = rulesFor(".card-fluid").join("\n");
  assert.match(backdrop, /position:\s*absolute/);
  assert.match(backdrop, /overflow:\s*hidden/);
  assert.match(backdrop, /contain:\s*strict/);
  assert.match(backdrop, /pointer-events:\s*none/);
  assert.match(backdrop, /z-index:\s*0/);
  for (const selector of [".publication-body", ".award-item time", ".award-icon", ".award-item h3", ".project-panel > *"]) {
    assert.match(rulesFor(selector).join("\n"), /z-index:\s*1/, `${selector} must sit above the decorative color fields`);
  }
  for (const selector of [".card-fluid::after", ".award-item .card-fluid::after", ".project-panel .card-fluid::after"]) {
    const rules = rulesFor(selector).join("\n");
    assert.match(rules, /background:\s*linear-gradient\(/, `${selector} must retain its stationary contrast veil`);
    assert.doesNotMatch(rules, /\banimation(?:-name)?\s*:/, "The reading surface must not animate with its background");
  }
});
