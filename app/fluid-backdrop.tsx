/** One prepainted multicolor surface moves behind stationary reading content. */
export default function FluidBackdrop({ variant = "card" }: { variant?: "card" | "hero" }) {
  return (
    <div className={variant === "card" ? "card-fluid" : "hero-spectrum"} data-ambient="" data-visible="false" data-running="false" aria-hidden="true">
      <span className="fluid-field" />
    </div>
  );
}
