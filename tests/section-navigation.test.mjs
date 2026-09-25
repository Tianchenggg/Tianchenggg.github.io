import assert from "node:assert/strict";
import test from "node:test";
import { Window } from "happy-dom";
import { attachSectionNavigation } from "../app/section-navigation.ts";

const ids = ["home", "research", "awards", "life"];

/** Keep browser-owned motion explicit while exercising the real DOM listeners. */
function setup(t, options = {}) {
  const win = new Window({
    url: `https://portfolio.test/${options.hash ?? ""}`,
    settings: {
      navigation: {
        disableMainFrameNavigation: true,
        disableChildPageNavigation: true,
        disableFallbackToSetURL: true,
      },
    },
  });
  const doc = win.document;
  const geometry = {
    tops: [0, 600, 2000, 2240],
    offset: 92,
    pageHeight: 5000,
    viewportHeight: 800,
    navWidth: 400,
    ...options,
  };
  let scrollY = options.scrollY ?? 0;
  let active = 0;
  let now = 0;
  let nextHandle = 1;
  let disposed = false;
  let measurementCount = 0;
  const frames = new Map();
  const timers = new Map();
  const captures = new Set();
  const scrollCalls = [];
  const historyCalls = [];
  const activeChanges = [];
  const observers = [];
  // happy-dom invokes anchor activation while bubbling; leave actual browsing
  // context navigation outside this harness, as with browser-owned scrolling.
  win.open = () => null;

  doc.body.innerHTML = `<nav class="section-switcher">
    <span class="section-switcher-thumb" aria-hidden="true"></span>
    ${ids.map(id => `<a href="#${id}"><span>${id}</span></a>`).join("")}
  </nav>${ids.map(id => `<section id="${id}"></section>`).join("")}`;
  const nav = doc.querySelector("nav");
  const anchors = [...nav.querySelectorAll("a")];
  Object.defineProperty(win, "scrollY", { configurable: true, get: () => scrollY });
  Object.defineProperty(win, "innerHeight", { configurable: true, get: () => geometry.viewportHeight });
  Object.defineProperty(doc.documentElement, "scrollHeight", { configurable: true, get: () => geometry.pageHeight });
  nav.getBoundingClientRect = () => new win.DOMRect(0, 0, geometry.navWidth, 44);
  ids.forEach((id, index) => {
    doc.getElementById(id).getBoundingClientRect = () => {
      measurementCount += 1;
      return new win.DOMRect(0, geometry.tops[index] - scrollY, 1000, 400);
    };
  });
  nav.setPointerCapture = id => { captures.add(id); };
  nav.hasPointerCapture = id => captures.has(id);
  nav.releasePointerCapture = id => {
    if (captures.delete(id)) {
      nav.dispatchEvent(new win.PointerEvent("lostpointercapture", { pointerId: id, bubbles: true }));
    }
  };
  win.requestAnimationFrame = callback => {
    const handle = nextHandle++;
    frames.set(handle, callback);
    return handle;
  };
  win.cancelAnimationFrame = handle => { frames.delete(handle); };
  win.setTimeout = (callback, delay = 0) => {
    const handle = nextHandle++;
    timers.set(handle, { at: now + delay, callback });
    return handle;
  };
  win.clearTimeout = handle => { timers.delete(handle); };
  win.scrollTo = request => {
    scrollCalls.push({ ...request });
    if (request.behavior === "instant" && scrollY !== request.top) {
      scrollY = request.top;
      win.dispatchEvent(new win.Event("scroll"));
    }
  };
  const pushState = win.history.pushState.bind(win.history);
  win.history.pushState = (state, unused, url) => {
    historyCalls.push(String(url));
    pushState(state, unused, url);
  };
  const motion = new win.EventTarget();
  motion.matches = options.reducedMotion ?? false;
  win.matchMedia = () => motion;

  class LayoutObserver {
    constructor(callback) { this.callback = callback; observers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
  }
  const bindings = {
    window: win,
    document: doc,
    ResizeObserver: LayoutObserver,
    getComputedStyle: element => ({
      scrollPaddingTop: element === doc.documentElement ? `${geometry.offset}px` : "0px",
      transform: "none",
    }),
  };
  const originals = new Map(Object.keys(bindings).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(bindings)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const cleanup = attachSectionNavigation(nav, ids, index => {
    active = index;
    activeChanges.push(index);
    anchors.forEach((anchor, anchorIndex) => {
      if (anchorIndex === index) anchor.setAttribute("aria-current", "location");
      else anchor.removeAttribute("aria-current");
    });
  });

  const dispose = () => {
    if (disposed) return;
    cleanup();
    disposed = true;
  };
  t.after(async () => {
    dispose();
    await win.happyDOM.close();
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  const event = type => { win.dispatchEvent(new win.Event(type)); };
  const flushFrames = () => {
    for (let count = 0; frames.size; count += 1) {
      assert.ok(count < 100, "requestAnimationFrame callbacks must settle");
      const batch = [...frames.values()];
      frames.clear();
      batch.forEach(callback => callback(now));
    }
  };
  const advance = milliseconds => {
    const until = now + milliseconds;
    for (let count = 0; ; count += 1) {
      const entry = [...timers.entries()].filter(([, timer]) => timer.at <= until).sort((a, b) => a[1].at - b[1].at)[0];
      if (!entry) break;
      assert.ok(count < 100, "idle timers must settle");
      const [handle, timer] = entry;
      timers.delete(handle);
      now = timer.at;
      timer.callback();
      flushFrames();
    }
    now = until;
    flushFrames();
  };
  const click = (index, init = {}) => {
    const clickEvent = new win.MouseEvent("click", { bubbles: true, cancelable: true, button: 0, detail: 1, ...init });
    anchors[index].querySelector("span").dispatchEvent(clickEvent);
    return clickEvent;
  };
  const pointer = (type, { index = 0, ...init } = {}) => {
    const pointerEvent = new win.PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: 1, isPrimary: true,
      pointerType: "mouse", button: 0, clientX: 50, clientY: 20, ...init,
    });
    (index === null ? win : anchors[index]).dispatchEvent(pointerEvent);
    return pointerEvent;
  };
  const scroll = (y, end = false) => {
    scrollY = y;
    event("scroll");
    flushFrames();
    if (end) event("scrollend");
    flushFrames();
  };
  const restoreHash = (hash, y) => {
    win.history.replaceState(null, "", hash || "/");
    scrollY = y;
    win.dispatchEvent(new win.PopStateEvent("popstate", { state: null }));
    win.dispatchEvent(new win.HashChangeEvent("hashchange"));
    event("scroll");
    event("scrollend");
    flushFrames();
  };
  return {
    win, doc, nav, anchors, geometry, captures, scrollCalls, historyCalls, activeChanges,
    get active() { return active; },
    get scrollY() { return scrollY; },
    get timerCount() { return timers.size; },
    get measurementCount() { return measurementCount; },
    click, pointer, scroll, event, flushFrames, advance, dispose, restoreHash,
    motionChange: matches => { motion.matches = matches; motion.dispatchEvent(new win.Event("change")); },
    layoutChange: () => observers.filter(observer => !observer.disconnected).forEach(observer => observer.callback()),
  };
}

test("rapid clicks replace navigation and ignore an earlier scrollend", t => {
  const h = setup(t);
  h.click(3);
  h.scroll(350);
  h.advance(100);
  h.click(1);
  h.event("scrollend");
  h.advance(100);
  assert.equal(h.active, 1);
  assert.equal(h.timerCount, 1, "the newer navigation must remain pending");
  h.scroll(508, true);
  h.advance(500);
  assert.equal(h.active, 1);
  assert.equal(h.timerCount, 0);
  assert.deepEqual(h.scrollCalls, [{ top: 2148, behavior: "smooth" }, { top: 508, behavior: "smooth" }]);
  assert.deepEqual(h.historyCalls, ["#life", "#research"]);
});

test("tapping the active anchor returns to its start without duplicating its hash", t => {
  const h = setup(t);
  h.click(1);
  h.scroll(508, true);
  h.scroll(1200);
  assert.equal(h.active, 1);
  assert.equal(h.click(1).defaultPrevented, true);
  assert.equal(h.scrollCalls.at(-1).top, 508);
  assert.deepEqual(h.historyCalls, ["#research"]);
});

test("modifier and middle-button clicks remain native", t => {
  const h = setup(t);
  for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
    assert.equal(h.click(1, init).defaultPrevented, false);
  }
  assert.equal(h.active, 0);
  assert.equal(h.scrollCalls.length, 0);
  assert.equal(h.historyCalls.length, 0);
});

test("wheel interruption stops owned motion and resumes the actual scroll selection", t => {
  const h = setup(t);
  h.click(3);
  h.scroll(350);
  h.win.dispatchEvent(new h.win.WheelEvent("wheel", { deltaY: 40 }));
  h.flushFrames();
  assert.equal(h.active, 0);
  assert.deepEqual(h.scrollCalls.at(-1), { top: 350, behavior: "instant" });
  h.scroll(700);
  assert.equal(h.active, 1);
  h.advance(500);
  assert.equal(h.active, 1, "the cancelled navigation must not return later");
});

test("ordinary wheel, touch, and keyboard scrolling never moves the viewport or rereads section geometry", t => {
  const h = setup(t);
  const measurements = h.measurementCount;
  for (const y of [100, 300, 700, 1500, 1950, 2200, 1800, 1000, 0]) {
    h.win.dispatchEvent(new h.win.WheelEvent("wheel", { deltaY: 40 }));
    h.scroll(y);
  }
  h.event("touchstart");
  h.scroll(800);
  h.doc.body.dispatchEvent(new h.win.KeyboardEvent("keydown", { key: "PageDown", bubbles: true }));
  h.scroll(2200);
  h.advance(500);
  assert.equal(h.active, 3);
  assert.equal(h.scrollCalls.length, 0);
  assert.equal(h.historyCalls.length, 0);
  assert.equal(h.measurementCount, measurements, "manual scrolling uses cached section geometry");
});

test("explicit short-section destinations survive shared bottom clamping until user scroll intent", t => {
  const h = setup(t, { tops: [0, 600, 1900, 2120], pageHeight: 2400, viewportHeight: 800 });
  h.click(2);
  assert.equal(h.scrollCalls.at(-1).top, 1600);
  h.scroll(1600, true);
  h.advance(500);
  h.layoutChange();
  h.flushFrames();
  assert.equal(h.active, 2, "awards must not snap to life at the shared target");
  h.event("wheel");
  h.flushFrames();
  assert.equal(h.active, 3);
  h.click(2);
  h.scroll(1600, true);
  h.click(3);
  h.scroll(1600, true);
  assert.equal(h.active, 3);
});

test("keyboard-generated clicks use instant motion when reduced motion is enabled", t => {
  const h = setup(t, { reducedMotion: true });
  const event = h.click(2, { detail: 0 });
  assert.equal(event.defaultPrevented, true);
  assert.equal(h.active, 2);
  assert.deepEqual(h.scrollCalls, [{ top: 1908, behavior: "instant" }]);
  h.advance(180);
  assert.equal(h.active, 2);
});

test("turning on reduced motion finishes the current destination instantly", t => {
  const h = setup(t);
  h.click(3);
  h.scroll(500);
  h.motionChange(true);
  assert.deepEqual(h.scrollCalls.at(-1), { top: 2148, behavior: "instant" });
  h.advance(180);
  assert.equal(h.active, 3);
});

test("sub-threshold movement is a normal active-link tap, not a drag", t => {
  const h = setup(t);
  h.pointer("pointerdown");
  h.pointer("pointermove", { clientX: 54 });
  assert.equal(h.nav.classList.contains("is-dragging"), false);
  assert.equal(h.captures.size, 0);
  h.pointer("pointerup", { clientX: 54 });
  h.click(0);
  assert.deepEqual(h.scrollCalls, [{ top: 0, behavior: "smooth" }]);
  assert.deepEqual(h.historyCalls, ["#home"]);
});

test("vertical touch movement abandons drag without blocking normal page scroll", t => {
  const h = setup(t);
  h.pointer("pointerdown", { pointerType: "touch" });
  const event = h.pointer("pointermove", { pointerType: "touch", clientX: 52, clientY: 50 });
  assert.equal(event.defaultPrevented, false);
  assert.equal(h.nav.classList.contains("is-dragging"), false);
  assert.equal(h.captures.size, 0);
  h.scroll(700);
  assert.equal(h.active, 1);
  assert.equal(h.scrollCalls.length, 0);
});

test("drag previews the nearest segment, commits once, and suppresses its generated click", t => {
  const h = setup(t);
  h.pointer("pointerdown");
  const event = h.pointer("pointermove", { clientX: 260 });
  h.flushFrames();
  assert.equal(event.defaultPrevented, true);
  assert.equal(h.nav.classList.contains("is-dragging"), true);
  assert.equal(h.anchors[2].dataset.preview, "true");
  assert.equal(h.active, 0, "preview must not change the current location");
  assert.equal(h.nav.style.getPropertyValue("--drag-x"), "210px");
  h.pointer("pointerup", { clientX: 260 });
  assert.equal(h.active, 2);
  assert.equal(h.captures.size, 0);
  assert.equal(h.nav.classList.contains("is-dragging"), false);
  assert.equal(h.anchors.some(anchor => "preview" in anchor.dataset), false);
  assert.equal(h.click(0).defaultPrevented, true);
  assert.deepEqual(h.historyCalls, ["#awards"]);
  assert.deepEqual(h.scrollCalls, [{ top: 1908, behavior: "smooth" }]);
});

for (const cancellation of ["pointercancel", "lostpointercapture", "blur", "resize", "Escape"]) {
  test(`${cancellation} cancels drag, releases capture, and reconciles actual page position`, t => {
    const h = setup(t);
    h.pointer("pointerdown");
    h.pointer("pointermove", { clientX: 260 });
    h.flushFrames();
    h.scroll(700);
    assert.equal(h.active, 0, "selection stays committed while dragging");
    if (cancellation === "lostpointercapture") {
      h.nav.releasePointerCapture(1);
    } else if (cancellation === "Escape") {
      h.doc.body.dispatchEvent(new h.win.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    } else if (cancellation === "pointercancel") {
      h.pointer("pointercancel");
    } else {
      h.event(cancellation);
    }
    h.flushFrames();
    assert.equal(h.active, 1);
    assert.equal(h.captures.size, 0);
    assert.equal(h.nav.classList.contains("is-dragging"), false);
    assert.equal(h.anchors.some(anchor => "preview" in anchor.dataset), false);
    assert.equal(h.historyCalls.length, 0);
    assert.equal(h.scrollCalls.length, 0);
    h.pointer("pointerup", { clientX: 260 });
    assert.equal(h.historyCalls.length, 0, "late pointerup must not commit a cancelled drag");
  });
}

test("a secondary pointer cannot replace or commit the primary drag", t => {
  const h = setup(t);
  h.pointer("pointerdown");
  h.pointer("pointerdown", { pointerId: 2, isPrimary: false });
  h.pointer("pointermove", { pointerId: 2, isPrimary: false, clientX: 350 });
  assert.equal(h.nav.classList.contains("is-dragging"), false);
  h.pointer("pointermove", { clientX: 160 });
  h.pointer("pointerup", { pointerId: 2, isPrimary: false, clientX: 350 });
  assert.equal(h.historyCalls.length, 0);
  h.pointer("pointerup", { clientX: 160 });
  assert.deepEqual(h.historyCalls, ["#research"]);
});

test("hash and history restoration select the restored section without starting another scroll", t => {
  const h = setup(t);
  h.click(3);
  h.restoreHash("#research", 508);
  h.advance(500);
  assert.equal(h.active, 1);
  assert.equal(h.scrollCalls.length, 1, "restoration must not duplicate browser scrolling");
  assert.deepEqual(h.historyCalls, ["#life"]);
  h.restoreHash("#awards", 1908);
  assert.equal(h.active, 2);
  assert.equal(h.scrollCalls.length, 1);
  h.restoreHash("", 0);
  assert.equal(h.active, 0);
  assert.equal(h.scrollCalls.length, 1);
});

test("an initial clamped hash preserves its explicit section without scrolling", t => {
  const h = setup(t, {
    hash: "#awards", scrollY: 1600, tops: [0, 600, 1900, 2120], pageHeight: 2400,
  });
  h.event("scroll");
  h.flushFrames();
  assert.equal(h.active, 2);
  assert.equal(h.scrollCalls.length, 0);
  assert.equal(h.historyCalls.length, 0);
});

for (const interruption of ["wheel", "resize", "motion", "layout"]) {
  test(`${interruption} during an initial hash restoration never cancels browser-owned scrolling`, t => {
    const h = setup(t, { hash: "#life", scrollY: 300 });
    if (interruption === "motion") h.motionChange(true);
    else if (interruption === "layout") {
      h.geometry.tops = [0, 600, 2000, 2400];
      h.layoutChange();
    } else h.event(interruption);
    h.flushFrames();
    h.advance(500);
    assert.equal(h.scrollCalls.length, 0);
    assert.equal(h.historyCalls.length, 0);
  });
}

test("a history restoration without a section hash abandons owned navigation without issuing a stop-scroll", t => {
  const h = setup(t);
  h.click(3);
  h.scroll(700);
  h.restoreHash("", 100);
  h.advance(500);
  assert.equal(h.active, 0);
  assert.deepEqual(h.scrollCalls, [{ top: 2148, behavior: "smooth" }]);
});

test("wheel input during a pending history restoration never issues another scroll", t => {
  const h = setup(t);
  h.click(3);
  h.restoreHash("#research", 300);
  h.event("wheel");
  h.scroll(700);
  h.advance(500);
  assert.equal(h.active, 1);
  assert.deepEqual(h.scrollCalls, [{ top: 2148, behavior: "smooth" }]);
});

test("layout changes invalidate a stale pending target and use new geometry", t => {
  const h = setup(t);
  h.click(2);
  h.scroll(700);
  h.geometry.tops = [0, 900, 2500, 3000];
  h.layoutChange();
  h.flushFrames();
  assert.equal(h.active, 0);
  assert.deepEqual(h.scrollCalls.at(-1), { top: 700, behavior: "instant" });
  h.click(2);
  assert.deepEqual(h.scrollCalls.at(-1), { top: 2408, behavior: "smooth" });
});

test("layout changes invalidate a settled destination that no longer matches its anchor", t => {
  const h = setup(t);
  h.click(1);
  h.scroll(508, true);
  assert.equal(h.active, 1);
  h.geometry.tops = [0, 1000, 2400, 2640];
  h.layoutChange();
  h.flushFrames();
  assert.equal(h.active, 0, "a stored destination must not pin selection after the section moves away");
  assert.equal(h.scrollCalls.length, 1, "layout observation must not start an unsolicited scroll");
});

test("scroll keys interrupt navigation but editing keys inside a form do not", t => {
  const h = setup(t);
  const input = h.doc.createElement("input");
  h.doc.body.append(input);
  h.click(3);
  h.scroll(700);
  input.dispatchEvent(new h.win.KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
  h.flushFrames();
  assert.equal(h.active, 3);
  assert.equal(h.scrollCalls.length, 1);
  h.doc.body.dispatchEvent(new h.win.KeyboardEvent("keydown", { key: "PageDown", bubbles: true }));
  h.flushFrames();
  assert.equal(h.active, 1);
  assert.deepEqual(h.scrollCalls.at(-1), { top: 700, behavior: "instant" });
});

test("cleanup removes event work, outstanding timers, and pointer capture", t => {
  const h = setup(t);
  h.click(2);
  h.dispose();
  const calls = h.scrollCalls.length;
  const changes = h.activeChanges.length;
  h.scroll(4000, true);
  h.event("wheel");
  h.layoutChange();
  h.advance(1000);
  assert.equal(h.timerCount, 0);
  assert.equal(h.scrollCalls.length, calls);
  assert.equal(h.activeChanges.length, changes);
});

test("cleanup during drag releases capture and ignores late pointer events", t => {
  const h = setup(t);
  h.pointer("pointerdown");
  h.pointer("pointermove", { clientX: 260 });
  h.flushFrames();
  assert.equal(h.captures.size, 1);
  h.dispose();
  assert.equal(h.captures.size, 0);
  assert.equal(h.nav.classList.contains("is-dragging"), false);
  assert.equal(h.anchors.some(anchor => "preview" in anchor.dataset), false);
  h.pointer("pointerup", { clientX: 260 });
  h.advance(500);
  assert.equal(h.scrollCalls.length, 0);
  assert.equal(h.historyCalls.length, 0);
});
