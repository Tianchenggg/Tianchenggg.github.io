"use client";

import { useEffect, useState } from "react";

export default function AmbientMotionControl({ labels }: { labels: { pause: string; resume: string } }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const elements = [...document.querySelectorAll<HTMLElement>("[data-ambient]")];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visible = new Set<Element>();
    const sync = () => {
      const enabled = !document.hidden && !motion.matches && !paused && !document.querySelector("dialog[open]");
      elements.forEach(element => { element.dataset.running = String(enabled && visible.has(element)); });
    };
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); });
      sync();
    });
    sync();
    elements.forEach(element => observer.observe(element));
    // A fullscreen photograph hides every color field. Stop the underlying
    // composited layers until the native viewer closes, without a render loop.
    const dialogs = new window.MutationObserver(sync);
    document.querySelectorAll("dialog").forEach(dialog => {
      dialogs.observe(dialog, { attributes: true, attributeFilter: ["open"] });
    });
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    return () => {
      observer.disconnect();
      dialogs.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      elements.forEach(element => { element.dataset.running = "false"; });
    };
  }, [paused]);

  const label = paused ? labels.resume : labels.pause;
  return (
    <button className="spectrum-toggle" type="button" aria-label={label} title={label} onClick={() => setPaused(!paused)}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        {paused ? <path d="M3 1.5 10 6l-7 4.5Z" /> : <path d="M2 1h3v10H2zm5 0h3v10H7z" />}
      </svg>
    </button>
  );
}
