"use client";

import { useEffect, useRef, useState } from "react";

export default function HeroSpectrum({ labels }: { labels: { pause: string; resume: string } }) {
  const ref = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || !("IntersectionObserver" in window)) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    const sync = () => {
      element.dataset.running = String(visible && !document.hidden && !motion.matches && !paused);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    });
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
    };
  }, [paused]);

  const label = paused ? labels.resume : labels.pause;
  return (
    <>
      <div ref={ref} className="hero-spectrum" data-running="false" aria-hidden="true" />
      <button className="spectrum-toggle" type="button" aria-label={label} title={label} onClick={() => setPaused(!paused)}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
          {paused ? <path d="M3 1.5 10 6l-7 4.5Z" /> : <path d="M2 1h3v10H2zm5 0h3v10H7z" />}
        </svg>
      </button>
    </>
  );
}
