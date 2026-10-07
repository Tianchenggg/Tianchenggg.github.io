"use client";

import { useEffect, useRef, useState } from "react";
import { attachAmbientMotion } from "./ambient-motion-controller";

export default function AmbientMotionControl({ labels }: { labels: { pause: string; resume: string } }) {
  const [paused, setPaused] = useState(false);
  const controller = useRef<ReturnType<typeof attachAmbientMotion> | null>(null);

  useEffect(() => {
    controller.current = attachAmbientMotion();
    return () => {
      controller.current?.dispose();
      controller.current = null;
    };
  }, []);

  const toggle = () => {
    controller.current?.setPaused(!paused);
    setPaused(!paused);
  };

  const label = paused ? labels.resume : labels.pause;
  return (
    <button className="spectrum-toggle" type="button" aria-label={label} title={label} onClick={toggle}>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
        {paused ? <path d="M3 1.5 10 6l-7 4.5Z" /> : <path d="M2 1h3v10H2zm5 0h3v10H7z" />}
      </svg>
    </button>
  );
}
