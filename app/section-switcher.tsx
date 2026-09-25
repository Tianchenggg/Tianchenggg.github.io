"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { attachSectionNavigation } from "./section-navigation";

const sections = [
  { id: "home", labelKey: "home" },
  { id: "research", labelKey: "research" },
  { id: "awards", labelKey: "awards" },
  { id: "life", labelKey: "life" },
] as const;

type SectionLabels = Record<(typeof sections)[number]["labelKey"], string>;

export default function SectionSwitcher({ labels, ariaLabel }: { labels: SectionLabels; ariaLabel: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const switcherRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!switcherRef.current) return;
    return attachSectionNavigation(switcherRef.current, sections.map(({ id }) => id), setActiveIndex);
  }, []);

  return (
    <nav
      ref={switcherRef}
      className="section-switcher"
      aria-label={ariaLabel}
      style={{ "--active-index": activeIndex } as CSSProperties}
    >
      <span className="section-switcher-thumb" aria-hidden="true" />
      {sections.map((section, index) => (
        <a href={`#${section.id}`} draggable={false} aria-current={activeIndex === index ? "location" : undefined} key={section.id}>
          <span>{labels[section.labelKey]}</span>
        </a>
      ))}
    </nav>
  );
}
