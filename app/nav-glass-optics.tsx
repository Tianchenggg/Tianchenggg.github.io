// A static, neutral-centered displacement map bends only the outer rim.
// It never samples or duplicates the navigation labels, and needs no JS loop.
const rimMap = `<svg xmlns="http://www.w3.org/2000/svg" width="560" height="66" viewBox="0 0 560 66" preserveAspectRatio="none"><defs><linearGradient id="x"><stop stop-color="#000080"/><stop offset=".05" stop-color="#800080"/><stop offset=".95" stop-color="#800080"/><stop offset="1" stop-color="#ff0080"/></linearGradient><linearGradient id="y" x1="0%" y1="0%" x2="0%" y2="100%"><stop stop-color="#000000"/><stop offset=".16" stop-color="#008000"/><stop offset=".84" stop-color="#008000"/><stop offset="1" stop-color="#00ff00"/></linearGradient></defs><rect width="560" height="66" fill="url(#x)"/><rect width="560" height="66" fill="url(#y)" style="mix-blend-mode:screen"/></svg>`;

export default function NavGlassOptics() {
  return (
    <svg className="nav-glass-optics" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="nav-refraction" x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feImage href={`data:image/svg+xml,${encodeURIComponent(rimMap)}`} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="rim" />
          <feDisplacementMap in="SourceGraphic" in2="rim" scale="12" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
}
