/** Visibility owns layer allocation; pause only freezes already-visible motion. */
export function attachAmbientMotion(root: ParentNode = document) {
  const elements = [...root.querySelectorAll<HTMLElement>("[data-ambient]")];
  let paused = false;
  let disposed = false;
  const visible = new Set<Element>();
  const write = (element: HTMLElement, key: "visible" | "running", value: boolean) => {
    const next = String(value);
    if (element.dataset[key] !== next) element.dataset[key] = next;
  };
  if (!("IntersectionObserver" in window)) return { setPaused() {}, dispose() {} };
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const sync = () => {
    if (disposed) return;
    const enabled = !paused && !document.hidden && !motion.matches && !root.querySelector("dialog[open]");
    for (const element of elements) {
      const nearby = visible.has(element);
      write(element, "visible", nearby);
      write(element, "running", nearby && enabled);
    }
  };
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) visible.add(entry.target);
      else visible.delete(entry.target);
    }
    sync();
  }, { rootMargin: "96px 0px" });
  elements.forEach(element => observer.observe(element));
  const dialogs = new window.MutationObserver(sync);
  root.querySelectorAll("dialog").forEach(dialog => {
    dialogs.observe(dialog, { attributes: true, attributeFilter: ["open"] });
  });
  document.addEventListener("visibilitychange", sync);
  motion.addEventListener("change", sync);
  sync();
  return {
    setPaused(value: boolean) { paused = value; sync(); },
    dispose() {
      disposed = true;
      observer.disconnect();
      dialogs.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      elements.forEach(element => { write(element, "running", false); write(element, "visible", false); });
    },
  };
}
