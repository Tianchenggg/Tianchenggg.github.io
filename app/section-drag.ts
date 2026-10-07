import { resolveDragIndex } from "./navigation-math.ts";

type DragCallbacks = { getActive(): number; onStart(): void; onCommit(index: number): void; onCancel(): void };

/** Optional pointer gesture. Move listeners exist only between pointerdown and release. */
export function attachSectionDrag(nav: HTMLElement, anchors: HTMLAnchorElement[], callbacks: DragCallbacks) {
  let dragFrame = 0;
  let suppressClick = false;
  let previewIndex = -1;
  let drag: { id: number; startX: number; startY: number; x: number; origin: number; width: number; moved: boolean } | null = null;
  const paintDrag = () => {
    dragFrame = 0;
    if (!drag?.moved) return;
    nav.style.setProperty("--drag-x", `${drag.x}px`);
    const preview = resolveDragIndex(drag.x, drag.width, anchors.length);
    if (preview !== previewIndex) {
      previewIndex = preview;
      anchors.forEach((anchor, index) => { anchor.dataset.preview = String(index === preview); });
    }
  };
  const endDrag = (navigateToTarget: boolean) => {
    const gesture = drag;
    if (!gesture) return;
    drag = null;
    previewIndex = -1;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    window.removeEventListener("pointercancel", onPointerCancel);
    nav.removeEventListener("lostpointercapture", onPointerCancel);
    window.cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    nav.classList.remove("is-dragging");
    anchors.forEach(anchor => { delete anchor.dataset.preview; });
    if (nav.hasPointerCapture(gesture.id)) nav.releasePointerCapture(gesture.id);
    if (!gesture.moved) return;
    suppressClick = true;
    if (navigateToTarget) {
      const index = resolveDragIndex(gesture.x, gesture.width, anchors.length);
      callbacks.onCommit(index);
      anchors[index]?.focus({ preventScroll: true });
    } else { callbacks.onCancel(); }
  };
  const onPointerDown = (event: PointerEvent) => {
    suppressClick = false;
    if (!event.isPrimary || event.button !== 0 || drag || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = (event.target as Element).closest("a");
    if (anchor !== anchors[callbacks.getActive()]) return;
    const width = nav.getBoundingClientRect().width / anchors.length;
    const thumb = nav.querySelector<HTMLElement>(".section-switcher-thumb");
    let origin = callbacks.getActive() * width;
    const transform = thumb && getComputedStyle(thumb).transform;
    if (transform && transform !== "none") {
      try { origin = new DOMMatrixReadOnly(transform).m41; } catch { /* Use the committed segment if a browser cannot parse its matrix. */ }
    }
    drag = { id: event.pointerId, startX: event.clientX, startY: event.clientY, x: origin, origin, width, moved: false };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    nav.addEventListener("lostpointercapture", onPointerCancel);
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!drag || drag.id !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved) {
      if (Math.abs(dy) > Math.max(5, Math.abs(dx))) { endDrag(false); return; }
      if (Math.abs(dx) < 5) return;
      drag.moved = true;
      callbacks.onStart();
      nav.style.setProperty("--drag-x", `${drag.origin}px`);
      nav.classList.add("is-dragging");
      nav.setPointerCapture(event.pointerId);
    }
    drag.x = Math.max(0, Math.min((anchors.length - 1) * drag.width, drag.origin + dx));
    if (!dragFrame) dragFrame = window.requestAnimationFrame(paintDrag);
    event.preventDefault();
  };
  const onPointerUp = (event: PointerEvent) => { if (event.pointerId === drag?.id) endDrag(true); };
  const onPointerCancel = (event: PointerEvent) => { if (event.pointerId === drag?.id) endDrag(false); };
  nav.addEventListener("pointerdown", onPointerDown);
  return {
    get isDragging() { return Boolean(drag?.moved); },
    consumeClick(detail: number) {
      if (!suppressClick || detail === 0) return false;
      suppressClick = false;
      return true;
    },
    cancel() { endDrag(false); },
    dispose() {
      endDrag(false);
      nav.removeEventListener("pointerdown", onPointerDown);
    },
  };
}
