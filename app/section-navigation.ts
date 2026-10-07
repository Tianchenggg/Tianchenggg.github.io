import { attachSectionDrag } from "./section-drag.ts";
import { clampScrollTarget, resolveActiveSection } from "./navigation-math.ts";

/** Native scrolling owns the motion; this controller only tracks user intent. */
export function attachSectionNavigation(nav: HTMLElement, ids: readonly string[], onActive: (index: number) => void) {
  const anchors = Array.from(nav.querySelectorAll<HTMLAnchorElement>("a"));
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let active = 0;
  let tops: number[] = [];
  let offset = 0;
  let pageHeight = 0;
  let viewportHeight = 0;
  let frame = 0;
  let idleTimer = 0;
  let disposed = false;
  let pending: { index: number; y: number; ownsScroll: boolean } | null = null;
  let settled: { index: number; y: number } | null = null;

  const commit = (index: number) => {
    if (index === active) return;
    active = index;
    onActive(index);
  };
  const measure = () => {
    tops = ids.map(id => (document.getElementById(id)?.getBoundingClientRect().top ?? Infinity) + window.scrollY);
    offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    pageHeight = document.documentElement.scrollHeight;
    viewportHeight = window.innerHeight;
  };
  const targetY = (index: number) => clampScrollTarget(tops[index], offset, pageHeight - viewportHeight);
  const reconcile = () => {
    if (disposed || pending || drag.isDragging) return;
    // Short sections can share the same clamped bottom scroll target.
    if (settled && Math.abs(window.scrollY - settled.y) <= 2) return;
    settled = null;
    commit(resolveActiveSection({ tops, scrollY: window.scrollY, offset, viewportHeight, pageHeight, currentIndex: active }));
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(() => { frame = 0; reconcile(); });
  };
  const finishNavigation = (navigation: NonNullable<typeof pending>) => {
    if (pending !== navigation) return;
    window.clearTimeout(idleTimer);
    pending = null;
    if (Math.abs(window.scrollY - navigation.y) <= 2) {
      settled = navigation;
      commit(navigation.index);
    } else reconcile();
  };
  const armIdle = () => {
    window.clearTimeout(idleTimer);
    const navigation = pending;
    if (navigation) idleTimer = window.setTimeout(() => finishNavigation(navigation), 180);
  };
  const interrupt = (update = true) => {
    window.clearTimeout(idleTimer);
    const ownsScroll = pending?.ownsScroll;
    pending = null;
    settled = null;
    // Hash restoration is browser-owned. Only cancel motion we actually started.
    if (ownsScroll) window.scrollTo({ top: window.scrollY, behavior: "instant" });
    if (update) schedule();
  };
  const navigate = (index: number) => {
    measure();
    settled = null;
    pending = { index, y: targetY(index), ownsScroll: true };
    commit(index);
    const hash = `#${ids[index]}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    window.scrollTo({ top: pending.y, behavior: motion.matches ? "instant" : "smooth" });
    armIdle();
  };
  const onScroll = () => { if (pending) armIdle(); else schedule(); };
  const onScrollEnd = () => {
    if (pending && Math.abs(window.scrollY - pending.y) <= 2) finishNavigation(pending);
    else schedule();
  };
  const onClick = (event: MouseEvent) => {
    if (drag.consumeClick(event.detail)) {
      event.preventDefault();
      return;
    }
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest("a");
    const index = anchors.findIndex(item => item === anchor);
    if (index < 0) return;
    event.preventDefault();
    navigate(index);
  };
  const onIntent = () => { if (pending || settled) interrupt(); };
  const onOutsidePointer = (event: PointerEvent) => { if (pending && !nav.contains(event.target as Node)) interrupt(); };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") { drag.cancel(); interrupt(); return; }
    if ((event.target as Element).closest?.("input, textarea, select, [contenteditable=true]")) return;
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) interrupt();
  };
  const onBlur = () => { drag.cancel(); interrupt(); };
  const onResize = () => { drag.cancel(); onLayout(); };
  const onHashChange = () => {
    window.clearTimeout(idleTimer);
    pending = null;
    settled = null;
    drag.cancel();
    measure();
    const index = ids.indexOf(window.location.hash.slice(1));
    if (index < 0) { interrupt(); return; }
    pending = { index, y: targetY(index), ownsScroll: false };
    commit(index);
    // Back/forward restoration belongs to the browser: never start a second scroll.
    armIdle();
  };
  const onLayout = () => {
    if (disposed) return;
    measure();
    if (pending && Math.abs(targetY(pending.index) - pending.y) > 2) interrupt();
    if (settled && Math.abs(targetY(settled.index) - settled.y) > 2) settled = null;
    schedule();
  };
  const onMotionPreference = () => { if (motion.matches && pending?.ownsScroll) window.scrollTo({ top: pending.y, behavior: "instant" }); };

  const drag = attachSectionDrag(nav, anchors, {
    getActive: () => active,
    onStart: () => interrupt(false),
    onCommit: navigate,
    onCancel: () => { interrupt(); reconcile(); },
  });
  measure();
  const initial = ids.indexOf(window.location.hash.slice(1));
  if (initial >= 0) {
    pending = { index: initial, y: targetY(initial), ownsScroll: false };
    commit(initial);
    if (Math.abs(window.scrollY - pending.y) <= 2) finishNavigation(pending);
    else armIdle();
  } else reconcile();
  const observer = new ResizeObserver(onLayout);
  ids.forEach(id => { const section = document.getElementById(id); if (section) observer.observe(section); });
  document.fonts?.ready.then(onLayout);
  const cleanup: (() => void)[] = [];
  const listen = <K extends keyof WindowEventMap>(target: Window | HTMLElement, type: K, listener: (event: WindowEventMap[K]) => void, options?: AddEventListenerOptions) => {
    target.addEventListener(type, listener as EventListener, options);
    cleanup.push(() => target.removeEventListener(type, listener as EventListener, options));
  };
  listen(window, "scroll", onScroll, { passive: true });
  listen(window, "scrollend", onScrollEnd);
  listen(window, "wheel", onIntent, { passive: true });
  listen(window, "touchstart", onIntent, { passive: true });
  listen(window, "pointerdown", onOutsidePointer);
  listen(window, "keydown", onKeyDown);
  listen(window, "blur", onBlur);
  listen(window, "resize", onResize);
  listen(window, "hashchange", onHashChange);
  listen(nav, "click", onClick);
  motion.addEventListener("change", onMotionPreference);
  return () => {
    disposed = true;
    drag.dispose();
    cleanup.forEach(remove => remove());
    observer.disconnect();
    motion.removeEventListener("change", onMotionPreference);
    window.clearTimeout(idleTimer);
    window.cancelAnimationFrame(frame);
  };
}
