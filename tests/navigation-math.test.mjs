import assert from "node:assert/strict";
import test from "node:test";
import {
  clampScrollTarget,
  resolveActiveSection,
  resolveDragIndex,
} from "../app/navigation-math.ts";

const layout = {
  tops: [0, 600, 2000, 2240],
  offset: 92,
  viewportHeight: 800,
  pageHeight: 5000,
  currentIndex: 0,
};

function activeAt(scrollY, overrides = {}) {
  return resolveActiveSection({ ...layout, scrollY, ...overrides });
}

test("scroll targets subtract the header offset exactly once", () => {
  assert.equal(clampScrollTarget(600, 92, 4200), 508);
  assert.equal(clampScrollTarget(600, 72, 4200), 528);
  assert.equal(clampScrollTarget(2000.5, 92.25, 4200), 1908.25);
});

test("scroll targets clamp to the reachable document ends", () => {
  assert.equal(clampScrollTarget(0, 92, 4200), 0);
  assert.equal(clampScrollTarget(40, 92, 4200), 0);
  assert.equal(clampScrollTarget(5000, 92, 4200), 4200);
  assert.equal(clampScrollTarget(4292, 92, 4200), 4200);
  assert.equal(clampScrollTarget(600, 92, 0), 0);
});

test("active section follows the header reading edge in small and large viewports", () => {
  for (const viewportHeight of [320, 480, 800, 1600]) {
    assert.equal(activeAt(480, { viewportHeight }), 0);
    assert.equal(activeAt(517, { viewportHeight }), 1);
    assert.equal(activeAt(1200, { viewportHeight, currentIndex: 1 }), 1);
    assert.equal(activeAt(1917, { viewportHeight, currentIndex: 1 }), 2);
  }
});

test("a selected anchor remains selected at its single-offset destination", () => {
  for (const offset of [72, 92]) {
    for (const viewportHeight of [320, 480, 1400]) {
      for (let currentIndex = 1; currentIndex < layout.tops.length; currentIndex += 1) {
        const scrollY = clampScrollTarget(layout.tops[currentIndex], offset, 3600);
        assert.equal(activeAt(scrollY, { offset, viewportHeight, currentIndex }), currentIndex);
      }
    }
  }
});

test("forward crossing waits for eight pixels beyond the next section top", () => {
  assert.equal(activeAt(507.99), 0);
  assert.equal(activeAt(508), 0);
  assert.equal(activeAt(515.99), 0);
  assert.equal(activeAt(516.01), 1);
});

test("backward crossing waits for eight pixels before the current section top", () => {
  assert.equal(activeAt(508, { currentIndex: 1 }), 1);
  assert.equal(activeAt(500.01, { currentIndex: 1 }), 1);
  assert.equal(activeAt(499.99, { currentIndex: 1 }), 0);
});

test("jitter within the hysteresis band does not alternate the selected section", () => {
  for (const scrollY of [504, 509, 512, 507, 503, 515]) {
    assert.equal(activeAt(scrollY, { currentIndex: 0 }), 0);
    assert.equal(activeAt(scrollY, { currentIndex: 1 }), 1);
  }
});

test("fast scrolls can cross multiple sections in either direction", () => {
  assert.equal(activeAt(2200, { currentIndex: 0 }), 3);
  assert.equal(activeAt(1200, { currentIndex: 3 }), 1);
  assert.equal(activeAt(0, { currentIndex: 3 }), 0);
});

test("short sections receive their own active interval beside a tall section", () => {
  assert.equal(activeAt(1917, { currentIndex: 1 }), 2);
  assert.equal(activeAt(2130, { currentIndex: 2 }), 2);
  assert.equal(activeAt(2155.99, { currentIndex: 2 }), 2);
  assert.equal(activeAt(2156.01, { currentIndex: 2 }), 3);
});

test("within two pixels of a scrollable page bottom selects the final section", () => {
  const bottomLayout = { pageHeight: 2600, viewportHeight: 800, currentIndex: 1 };
  assert.equal(activeAt(1797.99, bottomLayout), 1);
  assert.equal(activeAt(1798, bottomLayout), 3);
  assert.equal(activeAt(1800, bottomLayout), 3);
  assert.equal(activeAt(1804, bottomLayout), 3);
});

test("a page fitting the viewport stays on home rather than treating it as page end", () => {
  assert.equal(activeAt(0, { pageHeight: 800, viewportHeight: 800, currentIndex: 3 }), 0);
  assert.equal(activeAt(0, { pageHeight: 700, viewportHeight: 900, currentIndex: 2 }), 0);
});

test("drag selects the nearest segment and clamps either end", () => {
  for (const [position, expected] of [
    [-100, 0],
    [0, 0],
    [49.99, 0],
    [50, 1],
    [149.99, 1],
    [150, 2],
    [249.99, 2],
    [250, 3],
    [300, 3],
    [500, 3],
  ]) {
    assert.equal(resolveDragIndex(position, 100, 4), expected);
  }
});

test("drag handles fractional geometry and a single segment", () => {
  assert.equal(resolveDragIndex(29.99, 60, 4), 0);
  assert.equal(resolveDragIndex(30, 60, 4), 1);
  assert.equal(resolveDragIndex(157.5, 105, 4), 2);
  assert.equal(resolveDragIndex(500, 100, 1), 0);
});

test("drag safely returns home when segment width is not positive", () => {
  assert.equal(resolveDragIndex(100, 0, 4), 0);
  assert.equal(resolveDragIndex(0, 0, 4), 0);
  assert.equal(resolveDragIndex(100, -10, 4), 0);
});
