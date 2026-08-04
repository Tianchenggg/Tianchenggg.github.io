"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
} from "react";

const sections = [
  { id: "home", label: "Home" },
  { id: "research", label: "Research" },
  { id: "project", label: "Project" },
] as const;

export default function SectionSwitcher() {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigationLock = useRef<number | null>(null);
  const settleTimer = useRef<number | null>(null);
  const armSettleTimer = useRef<() => void>(() => undefined);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
      if (navigationLock.current !== null) return;

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

  return (
    <nav
      className="section-switcher"
      aria-label="Page sections"
      style={{ "--active-index": activeIndex } as CSSProperties}
    >
      <span className="section-switcher-thumb" aria-hidden="true" />
      {sections.map((section, index) => (
        <a
          href={`#${section.id}`}
          aria-current={activeIndex === index ? "location" : undefined}
          onClick={(event) => handleNavigation(event, index)}
          key={section.id}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
