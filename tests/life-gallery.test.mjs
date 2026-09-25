import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import test from "node:test";
import { Window } from "happy-dom";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import ts from "typescript";
import * as photos from "../app/life-photos.ts";

// Exercise the real TSX and effects, using the same in-memory compilation as
// ambient-motion.test.mjs rather than matching implementation source strings.
const source = await readFile(new URL("../app/life-gallery.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const componentModule = { exports: {} };
const require = createRequire(import.meta.url);
new Function("require", "module", "exports", compiled)(
  name => name === "./life-photos" ? photos : require(name),
  componentModule,
  componentModule.exports,
);
const LifeGallery = componentModule.exports.default;
const { lifePhotos, lifePhotoRows } = photos;

async function setup(t, language = "en") {
  const win = new Window({ url: "https://portfolio.test/" });
  const doc = win.document;
  doc.body.innerHTML = '<div id="gallery"></div>';
  doc.body.style.overflow = "auto";
  doc.body.style.paddingRight = "7px";
  Object.defineProperty(win, "innerWidth", { configurable: true, value: 1000 });
  Object.defineProperty(doc.documentElement, "clientWidth", { configurable: true, value: 980 });
  const showCalls = [];
  const closeCalls = [];
  // happy-dom does not implement the browser's modal top layer. Keep those
  // native boundaries explicit; the component must still call showModal/close.
  win.HTMLDialogElement.prototype.showModal = function () {
    showCalls.push(this);
    this.open = true;
    this.querySelector("[autofocus]")?.focus();
  };
  win.HTMLDialogElement.prototype.close = function () {
    closeCalls.push(this);
    this.open = false;
    this.dispatchEvent(new win.Event("close"));
  };
  const bindings = {
    window: win,
    document: doc,
    HTMLElement: win.HTMLElement,
    HTMLDialogElement: win.HTMLDialogElement,
    getComputedStyle: win.getComputedStyle.bind(win),
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  const originals = new Map(Object.keys(bindings).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  for (const [key, value] of Object.entries(bindings)) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const root = createRoot(doc.getElementById("gallery"));
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
  const render = async nextLanguage => {
    await act(() => root.render(createElement(LifeGallery, { language: nextLanguage })));
  };
  await render(language);
  const dialog = () => doc.querySelector("dialog");
  const buttons = () => [...doc.querySelectorAll("button.life-photo")];
  const click = async element => { await act(() => element.click()); };
  return {
    win, doc, root, showCalls, closeCalls, dispose, render, dialog, buttons, click,
    image: () => dialog().querySelector("img"),
    title: () => dialog().querySelector(".life-lightbox-title"),
    counter: () => dialog().querySelector('.life-lightbox-counter [aria-hidden="true"]'),
    announcement: () => dialog().querySelector(".life-lightbox-counter .sr-only"),
    control: label => dialog().querySelector(`button[aria-label="${label}"]`),
    open: async index => {
      const button = buttons()[index];
      button.focus();
      await click(button);
      return button;
    },
    key: async (key, init = {}) => {
      const event = new win.KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init });
      await act(() => dialog().dispatchEvent(event));
      return event;
    },
    cancel: async () => {
      const event = new win.Event("cancel", { cancelable: true });
      await act(() => dialog().dispatchEvent(event));
      return event;
    },
  };
}

test("the ten bilingual photographs appear exactly once with responsive local assets", async t => {
  assert.equal(lifePhotos.length, 10);
  assert.equal(new Set(lifePhotos.map(photo => photo.id)).size, 10);
  const rowIds = lifePhotoRows.flat();
  assert.equal(rowIds.length, 10);
  assert.equal(new Set(rowIds).size, 10);
  assert.deepEqual([...rowIds].sort(), lifePhotos.map(photo => photo.id).sort());
  const h = await setup(t);
  assert.equal(h.buttons().length, 10);
  assert.equal(h.doc.querySelectorAll(".life-row").length, lifePhotoRows.length);
  assert.equal(h.showCalls.length, 0);
  assert.equal(h.image(), null, "The full-size viewer image must not mount before opening the viewer");
  assert.equal(h.doc.querySelectorAll("[data-ambient], .card-fluid, canvas, video").length, 0);
  for (const [index, button] of h.buttons().entries()) {
    const photo = lifePhotos.find(item => item.id === rowIds[index]);
    const image = button.querySelector("img");
    assert.equal(button.type, "button");
    assert.equal(button.getAttribute("aria-haspopup"), "dialog");
    assert.match(button.getAttribute("aria-label"), /^View photo \d+: .+/);
    assert.equal(image.alt, photo.alt.en);
    assert.ok(photo.alt.zh.trim(), "Every photograph must have a Chinese description");
    assert.equal(image.width, photo.width);
    assert.equal(image.height, photo.height);
    assert.ok(photo.width > 0 && photo.height > 0);
    assert.equal(image.loading, "lazy");
    assert.equal(image.decoding, "async");
    assert.match(image.getAttribute("srcset"), new RegExp(`/life/${photo.id}-480\\.webp 480w`));
    assert.match(image.getAttribute("srcset"), new RegExp(`/life/${photo.id}-960\\.webp 960w`));
    assert.ok(image.getAttribute("sizes"), "Responsive selection needs a declared rendered size");
    for (const suffix of ["-480", "-960", ""]) {
      const asset = await stat(new URL(`../public/life/${photo.id}${suffix}.webp`, import.meta.url));
      assert.ok(asset.size > 0, `${photo.id}${suffix}.webp must exist and be nonempty`);
    }
  }
});

test("every photograph has a visible bilingual poetic title without losing its descriptive alt", async t => {
  const h = await setup(t);
  for (const language of ["en", "zh"]) {
    await h.render(language);
    for (const [index, button] of h.buttons().entries()) {
      const photo = lifePhotos.find(item => item.id === lifePhotoRows.flat()[index]);
      assert.ok(photo.title[language].trim(), `${photo.id} needs a ${language} title`);
      assert.notEqual(photo.title[language], photo.alt[language], "Poetic titles must complement the descriptive image text");
      assert.equal(button.querySelector(".life-photo-title").textContent, photo.title[language]);
      assert.ok(button.querySelector(".life-photo-caption"));
      assert.ok(button.getAttribute("aria-label").includes(photo.title[language]));
      assert.ok(button.getAttribute("aria-label").includes(photo.alt[language]));
      assert.equal(button.querySelector("img").alt, photo.alt[language]);
    }
    assert.equal(new Set(lifePhotos.map(photo => photo.title[language])).size, 10,
      "Each photograph should carry its own poetic title");
  }
});

test("opening a photograph uses a native modal and closing restores focus and body styles", async t => {
  const h = await setup(t);
  const opener = await h.open(3);
  const selected = lifePhotos.find(photo => photo.alt.en === opener.querySelector("img").alt);
  assert.equal(h.showCalls.length, 1);
  assert.equal(h.dialog().open, true);
  assert.equal(h.dialog().getAttribute("aria-label"), "Photo viewer");
  assert.equal(h.image().getAttribute("src"), `/life/${selected.id}.webp`);
  assert.equal(h.image().alt, selected.alt.en);
  assert.equal(h.title().textContent, selected.title.en);
  assert.equal(h.doc.body.style.overflow, "hidden");
  assert.equal(h.doc.body.style.paddingRight, "27px", "Scrollbar compensation must retain existing page padding");
  assert.equal(h.doc.activeElement, h.control("Close photo viewer"), "Initial focus belongs inside the modal");
  await h.click(h.control("Close photo viewer"));
  assert.equal(h.dialog().open, false);
  assert.equal(h.closeCalls.length, 1);
  assert.equal(h.image(), null);
  assert.equal(h.doc.body.style.overflow, "auto");
  assert.equal(h.doc.body.style.paddingRight, "7px");
  assert.equal(h.doc.activeElement, opener);
});

test("viewer buttons and arrow keys wrap without reopening the native modal", async t => {
  const h = await setup(t);
  await h.open(0);
  assert.equal(h.counter().textContent, "01 / 10");
  assert.equal(h.title().textContent, lifePhotos[0].title.en);
  assert.equal(h.announcement().textContent, "Photo 1 of 10");
  await h.click(h.control("Previous photo"));
  assert.equal(h.counter().textContent, "10 / 10");
  assert.equal(h.title().textContent, lifePhotos[9].title.en);
  await h.click(h.control("Next photo"));
  assert.equal(h.counter().textContent, "01 / 10");
  assert.equal((await h.key("ArrowRight")).defaultPrevented, true);
  assert.equal(h.counter().textContent, "02 / 10");
  assert.equal(h.title().textContent, lifePhotos[1].title.en);
  assert.equal((await h.key("ArrowLeft")).defaultPrevented, true);
  assert.equal(h.counter().textContent, "01 / 10");
  for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
    assert.equal((await h.key("ArrowRight", { [modifier]: true })).defaultPrevented, false);
    assert.equal(h.counter().textContent, "01 / 10");
  }
  assert.equal((await h.key("ArrowRight", { isComposing: true })).defaultPrevented, false);
  assert.equal(h.counter().textContent, "01 / 10", "IME composition must not navigate photographs");
  assert.equal(h.showCalls.length, 1, "Changing photos must not reset modal focus or scroll locking");
  assert.equal(h.closeCalls.length, 0);
});

test("native Escape cancellation and backdrop clicks close while image clicks stay open", async t => {
  const h = await setup(t);
  const opener = await h.open(0);
  const event = await h.cancel();
  assert.equal(event.defaultPrevented, true, "Native Escape cancellation must synchronize React state");
  assert.equal(h.dialog().open, false);
  assert.equal(h.doc.activeElement, opener);
  await h.open(0);
  await h.click(h.image());
  assert.equal(h.dialog().open, true, "Photo content must not be treated as a backdrop");
  await h.click(h.dialog());
  assert.equal(h.dialog().open, false);
  assert.equal(h.doc.activeElement, opener);
  for (const selector of [".life-lightbox-inner", ".life-lightbox-stage"]) {
    await h.open(0);
    await h.click(h.dialog().querySelector(selector));
    assert.equal(h.dialog().open, false, `${selector} blank areas must remain dismissible`);
    assert.equal(h.doc.activeElement, opener);
  }
});

test("switching language updates thumbnail and open-viewer accessible text in place", async t => {
  const h = await setup(t);
  await h.open(1);
  const imagePath = h.image().getAttribute("src");
  await h.render("zh");
  assert.match(h.buttons()[0].getAttribute("aria-label"), /^查看第 \d+ 张照片：/);
  assert.equal(h.dialog().getAttribute("aria-label"), "照片查看器");
  assert.ok(h.control("关闭照片查看器"));
  assert.ok(h.control("上一张照片"));
  assert.ok(h.control("下一张照片"));
  assert.equal(h.announcement().textContent, "第 2 张，共 10 张照片");
  assert.equal(h.image().getAttribute("src"), imagePath);
  const photo = lifePhotos.find(item => imagePath === `/life/${item.id}.webp`);
  assert.equal(h.image().alt, photo.alt.zh);
  assert.equal(h.title().textContent, photo.title.zh);
  assert.equal(h.dialog().open, true);
  assert.equal(h.showCalls.length, 1);
});

test("native close events synchronize selection without a stale event closing a reopened viewer", async t => {
  const h = await setup(t);
  await h.open(0);
  await act(() => h.dialog().close());
  assert.equal(h.image(), null);
  assert.equal(h.doc.body.style.overflow, "auto");
  await h.open(1);
  await act(() => h.dialog().dispatchEvent(new h.win.Event("close")));
  assert.equal(h.dialog().open, true);
  assert.equal(h.counter().textContent, "02 / 10");
  assert.equal(h.doc.body.style.overflow, "hidden");
});

test("unmounting an open viewer releases native modal state and restores prior body styles", async t => {
  const h = await setup(t);
  await h.open(0);
  const dialog = h.dialog();
  await h.dispose();
  assert.equal(dialog.open, false);
  assert.equal(h.closeCalls.length, 1);
  assert.equal(h.doc.body.style.overflow, "auto");
  assert.equal(h.doc.body.style.paddingRight, "7px");
  assert.equal(h.doc.querySelector("dialog"), null);
});

test("closing restores preexisting overflow longhands and CSS property priorities", async t => {
  const h = await setup(t);
  h.doc.body.style.setProperty("overflow-x", "clip", "important");
  h.doc.body.style.setProperty("overflow-y", "scroll");
  h.doc.body.style.setProperty("padding-right", "11px", "important");
  const properties = ["overflow", "overflow-x", "overflow-y", "padding-right"];
  const before = properties.map(property => [
    property,
    h.doc.body.style.getPropertyValue(property),
    h.doc.body.style.getPropertyPriority(property),
  ]);
  await h.open(0);
  await h.cancel();
  assert.deepEqual(properties.map(property => [
    property,
    h.doc.body.style.getPropertyValue(property),
    h.doc.body.style.getPropertyPriority(property),
  ]), before);
});
