"use client";

import { useEffect, useState, type CSSProperties } from "react";

const sections = [
  { id: "home", label: "Home" },
  { id: "research", label: "Research" },
  { id: "project", label: "Project" },
] as const;

export default function SectionSwitcher() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let frame = 0;

    const updateActiveSection = () => {
      frame = 0;
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

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(updateActiveSection);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
    };
  }, []);

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
          onClick={() => setActiveIndex(index)}
          key={section.id}
        >
          {section.label}
        </a>
      ))}
    </nav>
  );
}
