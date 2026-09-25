import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import ts from "typescript";

// Compile the real client component in memory: Node's type stripper does not
// support TSX, and exercising React effects catches more than source matching.
const source = await readFile(new URL("../app/ambient-motion.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const componentModule = { exports: {} };
new Function("require", "module", "exports", compiled)(
  createRequire(import.meta.url), componentModule, componentModule.exports,
);
const AmbientMotionControl = componentModule.exports.default;

function trackListeners(target, type) {
  const active = new Set();
  const add = target.addEventListener.bind(target);
  const remove = target.removeEventListener.bind(target);
  target.addEventListener = (name, listener, ...options) => {
    if (name === type) active.add(listener);
    add(name, listener, ...options);
  };
  target.removeEventListener = (name, listener, ...options) => {
    if (name === type) active.delete(listener);
    remove(name, listener, ...options);
  };
  return active;
}

async function setup(t, { reducedMotion = false, hidden = false, observerSupported = true, modalOpen = false } = {}) {
  const win = new Window({ url: "https://portfolio.test/" });
  const doc = win.document;
  doc.body.innerHTML = `<div id="controls"></div><dialog id="viewer"${modalOpen ? " open" : ""}></dialog><dialog id="secondary"></dialog>${Array.from({ length: 11 }, (_, index) =>
    `<div id="ambient-${index}" data-ambient="" data-running="false" aria-hidden="true"></div>`,
  ).join("")}`;
  const elements = [...doc.querySelectorAll("[data-ambient]")];
  const observers = [];
  const mutationObservers = [];
  const NativeMutationObserver = win.MutationObserver;
  win.MutationObserver = class extends NativeMutationObserver {
    constructor(callback) {
      super(callback);
      this.observed = new Map();
      this.disconnected = false;
      mutationObservers.push(this);
    }
    observe(element, options) {
      this.observed.set(element, options);
      super.observe(element, options);
    }
    disconnect() {
      this.disconnected = true;
      this.observed.clear();
      super.disconnect();
    }
  };
  const motion = new win.EventTarget();
  motion.matches = reducedMotion;
  win.matchMedia = query => {
    assert.equal(query, "(prefers-reduced-motion: reduce)");
    return motion;
  };
  Object.defineProperty(doc, "hidden", { configurable: true, get: () => hidden });
  const visibilityListeners = trackListeners(doc, "visibilitychange");
  const motionListeners = trackListeners(motion, "change");

  class Observer {
    constructor(callback) {
      this.callback = callback;
      this.observed = new Set();
      this.disconnected = false;
      observers.push(this);
    }
    observe(element) { this.observed.add(element); }
    disconnect() { this.disconnected = true; this.observed.clear(); }
    emit(indices, isIntersecting) {
      if (this.disconnected) return;
      this.callback(indices.map(index => ({ target: elements[index], isIntersecting })));
    }
  }
  if (observerSupported) win.IntersectionObserver = Observer;
  else delete win.IntersectionObserver;

  const bindings = {
    window: win,
    document: doc,
    IntersectionObserver: Observer,
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const originals = new Map(Object.keys(bindings).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(bindings)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const root = createRoot(doc.getElementById("controls"));
  let disposed = false;
  const dispose = async () => {
    if (disposed) return;
    await act(() => root.unmount());
    disposed = true;
  };
  t.after(async () => {
    await dispose();
    await win.happyDOM.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  await act(() => root.render(createElement(AmbientMotionControl, {
    labels: { pause: "Pause background motion", resume: "Resume background motion" },
  })));

  return {
    observers,
    mutationObservers,
    visibilityListeners,
    motionListeners,
    elements,
    dispose,
    running: () => elements.flatMap((element, index) => element.dataset.running === "true" ? [index] : []),
    intersect: (indices, visible = true) => observers.at(-1)?.emit(indices, visible),
    button: () => doc.querySelector("button"),
    toggle: async () => { await act(() => doc.querySelector("button").click()); },
    async setModal(open, id = "viewer") {
      await act(async () => {
        doc.getElementById(id).toggleAttribute("open", open);
        await win.happyDOM.whenAsyncComplete();
      });
    },
    setHidden(value) {
      hidden = value;
      doc.dispatchEvent(new win.Event("visibilitychange"));
    },
    setReducedMotion(value) {
      motion.matches = value;
      motion.dispatchEvent(new win.Event("change"));
    },
  };
}

test("all shared ambient targets wait for visibility and stop immediately offscreen", async t => {
  const h = await setup(t);
  assert.deepEqual(h.running(), []);
  assert.equal(h.observers.length, 1, "A single observer must control every background");
  assert.equal(h.observers[0].observed.size, 11);
  assert.equal(h.visibilityListeners.size, 1);
  assert.equal(h.motionListeners.size, 1);

  h.intersect([0, 1, 7, 9, 10]);
  assert.deepEqual(h.running(), [0, 1, 7, 9, 10]);
  h.intersect([0, 7], false);
  assert.deepEqual(h.running(), [1, 9, 10]);
  h.intersect([4]);
  assert.deepEqual(h.running(), [1, 4, 9, 10]);
});

test("tab visibility and reduced-motion changes gate every visible background", async t => {
  const h = await setup(t);
  h.intersect([0, 4, 7, 9, 10]);
  h.setHidden(true);
  assert.deepEqual(h.running(), []);
  h.intersect([4], false);
  h.setHidden(false);
  assert.deepEqual(h.running(), [0, 7, 9, 10]);

  h.setReducedMotion(true);
  assert.deepEqual(h.running(), []);
  h.intersect([8]);
  h.setHidden(true);
  h.setReducedMotion(false);
  assert.deepEqual(h.running(), [], "Removing reduced motion must not resume a hidden tab");
  h.setHidden(false);
  assert.deepEqual(h.running(), [0, 7, 8, 9, 10]);
});

test("initial reduced motion and a hidden tab remain static after intersection", async t => {
  const h = await setup(t, { reducedMotion: true, hidden: true });
  h.intersect([0, 1, 7, 9]);
  assert.deepEqual(h.running(), []);
  h.setHidden(false);
  assert.deepEqual(h.running(), []);
  h.setReducedMotion(false);
  assert.deepEqual(h.running(), [0, 1, 7, 9]);
});

test("the header pause control stops all surfaces and preserves pause through system changes", async t => {
  const h = await setup(t);
  assert.equal(h.button().getAttribute("aria-label"), "Pause background motion");
  h.intersect([0, 2, 8, 9]);
  await h.toggle();
  assert.deepEqual(h.running(), []);
  assert.equal(h.button().getAttribute("aria-label"), "Resume background motion");
  h.intersect([0, 2, 8, 9]);
  h.setHidden(true);
  h.setReducedMotion(true);
  h.setHidden(false);
  h.setReducedMotion(false);
  assert.deepEqual(h.running(), [], "Visibility or OS settings must not override user pause");

  await h.toggle();
  h.intersect([0, 2, 8, 9]);
  assert.deepEqual(h.running(), [0, 2, 8, 9]);
  assert.equal(h.button().getAttribute("aria-label"), "Pause background motion");
  assert.equal(h.observers.filter(observer => !observer.disconnected).length, 1);
  assert.equal(h.visibilityListeners.size, 1, "Repeated toggles must not leak visibility listeners");
  assert.equal(h.motionListeners.size, 1, "Repeated toggles must not leak media-query listeners");
});

test("unmount releases observers and listeners and leaves every background paused", async t => {
  const h = await setup(t);
  h.intersect([0, 1, 7, 9]);
  await h.dispose();
  assert.deepEqual(h.running(), []);
  assert.ok(h.observers.every(observer => observer.disconnected));
  assert.equal(h.visibilityListeners.size, 0);
  assert.equal(h.motionListeners.size, 0);
  h.intersect([2]);
  h.setHidden(true);
  h.setHidden(false);
  h.setReducedMotion(true);
  h.setReducedMotion(false);
  assert.deepEqual(h.running(), []);
});

test("browsers without IntersectionObserver retain a safe static background", async t => {
  const h = await setup(t, { observerSupported: false });
  assert.equal(h.observers.length, 0);
  assert.equal(h.visibilityListeners.size, 0);
  assert.equal(h.motionListeners.size, 0);
  assert.deepEqual(h.running(), []);
  await h.toggle();
  await h.toggle();
  assert.deepEqual(h.running(), []);
});

test("ambient motion uses event-driven gates rather than a JavaScript render loop", () => {
  assert.doesNotMatch(source, /\b(?:requestAnimationFrame|setInterval|setTimeout)\s*\(/);
  assert.doesNotMatch(source, /addEventListener\(\s*["'](?:scroll|wheel|pointermove|mousemove)["']/);
  assert.doesNotMatch(source, /\b(?:getBoundingClientRect|getComputedStyle)\s*\(/);
});

test("opening a photo viewer pauses every ambient layer until all dialogs close", async t => {
  const h = await setup(t);
  h.intersect([0, 3, 8, 10]);
  assert.deepEqual(h.running(), [0, 3, 8, 10]);
  await h.setModal(true);
  assert.deepEqual(h.running(), [], "The full-page color layer must not continue behind the photo viewer");
  h.intersect([5]);
  assert.deepEqual(h.running(), [], "New intersections must not resume motion while a dialog is open");
  await h.setModal(true, "secondary");
  await h.setModal(false);
  assert.deepEqual(h.running(), [], "Closing one dialog must not resume a background behind another dialog");
  await h.setModal(false, "secondary");
  assert.deepEqual(h.running(), [0, 3, 5, 8, 10]);
});

test("a pre-opened modal and user or system pause never bypass one another", async t => {
  const h = await setup(t, { modalOpen: true });
  h.intersect([0, 9, 10]);
  assert.deepEqual(h.running(), []);
  await h.toggle();
  await h.setModal(false);
  assert.deepEqual(h.running(), [], "Closing a photo must preserve the user's manual pause");
  await h.toggle();
  h.intersect([0, 9, 10]);
  assert.deepEqual(h.running(), [0, 9, 10]);
  await h.setModal(true);
  h.setReducedMotion(true);
  await h.setModal(false);
  assert.deepEqual(h.running(), [], "Closing a photo must preserve reduced-motion preferences");
  h.setReducedMotion(false);
  assert.deepEqual(h.running(), [0, 9, 10]);
});

test("dialog observers are narrowly scoped and cleaned up with the motion controller", async t => {
  const h = await setup(t);
  const active = h.mutationObservers.filter(observer => !observer.disconnected);
  assert.equal(active.length, 1, "One mutation observer can watch every existing dialog");
  assert.equal(active[0].observed.size, 2);
  for (const [element, options] of active[0].observed) {
    assert.equal(element.tagName, "DIALOG");
    assert.deepEqual(options.attributeFilter, ["open"]);
    assert.equal(options.subtree ?? false, false, "Photo viewer state must not require observing the entire page subtree");
  }
  h.intersect([0, 9, 10]);
  await h.dispose();
  assert.ok(h.mutationObservers.every(observer => observer.disconnected));
  await h.setModal(true);
  await h.setModal(false);
  assert.deepEqual(h.running(), []);
});
