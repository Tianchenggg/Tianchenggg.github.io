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
  { id: "home", labelKey: "home" },
  { id: "research", labelKey: "research" },
  { id: "project", labelKey: "project" },
] as const;

type SectionLabels = Record<(typeof sections)[number]["labelKey"], string>;

export default function SectionSwitcher({
  labels,
  ariaLabel,
}: {
  labels: SectionLabels;
  ariaLabel: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const switcherRef = useRef<HTMLElement | null>(null);
  const activeIndexRef = useRef(0);
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
  } | null>(null);
  const armSettleTimer = useRef<() => void>(() => undefined);

  useEffect(() => {
    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    let sectionTops: number[] = [];
    let pageHeight = 0;

    const measureLayout = () => {
      sectionTops = sections.map(
        (section) => document.getElementById(section.id)?.offsetTop ?? Number.POSITIVE_INFINITY,
      );
      pageHeight = document.documentElement.scrollHeight;
    };

    const updateActiveSection = () => {
      frame = 0;
      if (dragGesture.current || navigationLock.current !== null) return;

      const viewportMarker = window.scrollY + Math.max(112, window.innerHeight * 0.28);
      const atPageEnd = window.innerHeight + window.scrollY >= pageHeight - 4;

      let nextIndex = 0;
      sectionTops.forEach((sectionTop, index) => {
        if (sectionTop <= viewportMarker) {
          nextIndex = index;
        }
      });

      const resolvedIndex = atPageEnd ? sections.length - 1 : nextIndex;
      if (activeIndexRef.current !== resolvedIndex) {
        activeIndexRef.current = resolvedIndex;
        setActiveIndex(resolvedIndex);
      }
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

    const handleLayoutChange = () => {
      measureLayout();
      requestUpdate();
    };

    const handleScroll = () => {
      if (dragGesture.current) return;

      if (navigationLock.current !== null) {
        releaseNavigationAfterIdle();
        return;
      }

      requestUpdate();
    };

    measureLayout();
    updateActiveSection();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleLayoutChange);
    window.addEventListener("hashchange", requestUpdate);

    if ("ResizeObserver" in window) {
      resizeObserver = new ResizeObserver(handleLayoutChange);
      sections.forEach((section) => {
        const element = document.getElementById(section.id);
        if (element) resizeObserver?.observe(element);
      });
    }

    return () => {
      window.cancelAnimationFrame(frame);
      if (dragFrame.current !== null) {
        window.cancelAnimationFrame(dragFrame.current);
      }
      if (settleTimer.current !== null) {
        window.clearTimeout(settleTimer.current);
      }
      window.removeEventListener("scroll", handleScroll);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleLayoutChange);
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
    activeIndexRef.current = index;
    setActiveIndex(index);
    armSettleTimer.current();
  };

  const paintDrag = () => {
    dragFrame.current = null;
    const gesture = dragGesture.current;
    const switcher = switcherRef.current;
    if (!gesture || !switcher) return;

    switcher.style.setProperty("--drag-x", `${gesture.currentX}px`);
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
    };

    navigationLock.current = activeIndex;
    switcher.style.setProperty("--drag-x", `${startX}px`);
    setPreviewIndex(activeIndex);
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLSpanElement>) => {
    const gesture = dragGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

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
    activeIndexRef.current = targetIndex;
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

  };

  return (
    <nav
      ref={switcherRef}
      className={`section-switcher${isDragging ? " is-dragging" : ""}`}
      aria-label={ariaLabel}
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
          <span>{labels[section.labelKey]}</span>
        </a>
      ))}
    </nav>
  );
}
