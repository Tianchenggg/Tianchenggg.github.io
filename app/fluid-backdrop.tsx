/** Independent color fields merge as they move; the reading surface stays still. */
export default function FluidBackdrop() {
  return (
    <div className="card-fluid" data-ambient="" data-running="false" aria-hidden="true">
      <span className="fluid-color is-gold" />
      <span className="fluid-color is-rose" />
      <span className="fluid-color is-violet" />
      <span className="fluid-color is-cyan" />
    </div>
  );
}
