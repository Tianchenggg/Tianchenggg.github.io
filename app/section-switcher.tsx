"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

const sections = [
  { id: "home", label: "Home" },
  { id: "research", label: "Research" },
  { id: "project", label: "Project" },
] as const;

export default function SectionSwitcher() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const switcherRef = useRef<HTMLElement | null>(null);
  const navigationLock = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const dragFrame = useRef<number | null>(null);
  const dragGesture = useRef<{
    pointerId: number;
    startClientX: number;
    startX: number;
    currentX: number;
    thumbWidth: number;
    maxX: number;
    switcherLeft: number;
    lastClientX: number;
  } | null>(null);
  const armSettleTimer = useRef<() => void>(() => undefined);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      if (dragGesture.current || navigationLock.current !== null) return;

      const viewportMarker = window.scrollY + Math.max(112, window.innerHeight * 0.28);
      const atPageEnd =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4;

      let nextIndex = 0;
      sections.forEach((section, index) => {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= viewportMarker) {
          nextIndex = index;
        }
      });

      setActiveIndex(atPageEnd ? sections.length - 1 : nextIndex);
    };

    const releaseNavigationAfterIdle = () => {
      if (settleTimer.current !== null) {
        window.clearTimeout(settleTimer.current);
      }

      settleTimer.current = window.setTimeout(() => {
        navigationLock.current = null;
        settleTimer.current = null;
        updateActiveSection();
      }, 180);
    };

    armSettleTimer.current = releaseNavigationAfterIdle;

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateActiveSection);
      }
    };

    const handleScroll = () => {
      if (dragGesture.current) return;

      if (navigationLock.current !== null) {
        releaseNavigationAfterIdle();
        return;
      }

      requestUpdate();
    };

    updateActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      if (dragFrame.current !== null) {
        window.cancelAnimationFrame(dragFrame.current);
      }
      if (settleTimer.current !== null) {
        window.clearTimeout(settleTimer.current);
      }
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
    };
  }, []);

  const handleNavigation = (event: MouseEvent<HTMLAnchorElement>, index: number) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    navigationLock.current = index;
    setActiveIndex(index);
    armSettleTimer.current();
  };

  const paintDrag = () => {
    dragFrame.current = null;
    const gesture = dragGesture.current;
    const switcher = switcherRef.current;
    if (!gesture || !switcher) return;

    switcher.style.setProperty("--drag-x", `${gesture.currentX}px`);
    const localPointer = Math.max(
      0,
      Math.min(
        gesture.thumbWidth,
        gesture.lastClientX - gesture.switcherLeft - gesture.currentX,
      ),
    );
    switcher.style.setProperty(
      "--lens-light-x",
      `${(localPointer / gesture.thumbWidth) * 100}%`,
    );
  };

  const queueDragPaint = () => {
    if (dragFrame.current === null) {
      dragFrame.current = window.requestAnimationFrame(paintDrag);
    }
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0 || !switcherRef.current) return;

    const switcher = switcherRef.current;
    const switcherRect = switcher.getBoundingClientRect();
    const thumbWidth = switcherRect.width / sections.length;
    const maxX = thumbWidth * (sections.length - 1);
    const computedTransform = window.getComputedStyle(event.currentTarget).transform;
    let renderedX = activeIndex * thumbWidth;

    if (computedTransform && computedTransform !== "none") {
      try {
        renderedX = new DOMMatrixReadOnly(computedTransform).m41;
      } catch {
        renderedX = activeIndex * thumbWidth;
      }
    }

    const startX = Math.max(0, Math.min(maxX, renderedX));
    dragGesture.current = {
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startX,
      currentX: startX,
      thumbWidth,
      maxX,
      switcherLeft: switcherRect.left,
      lastClientX: event.clientX,
    };

    navigationLock.current = activeIndex;
    switcher.style.setProperty("--drag-x", `${startX}px`);
    switcher.style.setProperty("--lens-light-x", "50%");
    setPreviewIndex(activeIndex);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const gesture = dragGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    gesture.lastClientX = event.clientX;
    gesture.currentX = Math.max(
      0,
      Math.min(
        gesture.maxX,
        gesture.startX + event.clientX - gesture.startClientX,
      ),
    );
    const nextPreviewIndex = Math.max(
      0,
      Math.min(
        sections.length - 1,
        Math.round(gesture.currentX / gesture.thumbWidth),
      ),
    );
    setPreviewIndex((current) =>
      current === nextPreviewIndex ? current : nextPreviewIndex,
    );
    queueDragPaint();
    event.preventDefault();
  };

  const finishDrag = (
    event: ReactPointerEvent<HTMLSpanElement>,
    shouldNavigate: boolean,
  ) => {
    const gesture = dragGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    if (dragFrame.current !== null) {
      window.cancelAnimationFrame(dragFrame.current);
      dragFrame.current = null;
    }
    paintDrag();

    const targetIndex = shouldNavigate
      ? Math.max(
          0,
          Math.min(
            sections.length - 1,
            Math.round(gesture.currentX / gesture.thumbWidth),
          ),
        )
      : activeIndex;

    dragGesture.current = null;
    setActiveIndex(targetIndex);
    setPreviewIndex(targetIndex);
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (shouldNavigate && targetIndex !== activeIndex) {
      const target = document.getElementById(sections[targetIndex].id);
      navigationLock.current = targetIndex;
      armSettleTimer.current();
      window.history.pushState(null, "", `#${sections[targetIndex].id}`);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigationLock.current = null;
    }

    const switcher = switcherRef.current;
    if (switcher) {
      switcher.style.setProperty("--lens-light-x", "50%");
    }
  };

  return (
    <nav
      ref={switcherRef}
      className={`section-switcher${isDragging ? " is-dragging" : ""}`}
      aria-label="Page sections"
      style={{ "--active-index": activeIndex } as CSSProperties}
    >
      <span
        className="section-switcher-thumb"
        aria-hidden="true"
      />
      <span
        className="section-switcher-drag-handle"
        aria-hidden="true"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(event) => finishDrag(event, true)}
        onPointerCancel={(event) => finishDrag(event, false)}
      />
      {sections.map((section, index) => (
        <a
          href={`#${section.id}`}
          aria-current={
            (isDragging ? previewIndex : activeIndex) === index
              ? "location"
              : undefined
          }
          onClick={(event) => handleNavigation(event, index)}
          key={section.id}
        >
          <span>{section.label}</span>
        </a>
      ))}
    </nav>
  );
}
