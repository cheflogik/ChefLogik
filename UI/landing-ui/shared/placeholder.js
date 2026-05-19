// Generates a striped SVG placeholder with an optional monospace label.
// Used everywhere imagery would otherwise sit, to make clear that real
// photography belongs there.
window.placeholder = function placeholder(opts) {
  const o = opts || {};
  const label = o.label || "image";
  const w = o.w || 800;
  const h = o.h || 600;
  const tone = o.tone || "warm";
  const stripe = o.stripe || 14;
  const className = o.className || "";
  const style = o.style || "";
  const palettes = {
    warm:  { a: "#1c1813", b: "#23201a", text: "#8a7d63", border: "#3a3327" },
    dark:  { a: "#0d0c0a", b: "#15120e", text: "#7a6f57", border: "#2a2620" },
    wine:  { a: "#1a0e12", b: "#22141a", text: "#8a6878", border: "#3a212c" },
    ember: { a: "#0c0a08", b: "#14110d", text: "#9a7a5a", border: "#2e251c" },
    olive: { a: "#13160f", b: "#1a1e13", text: "#7a8060", border: "#2a3022" },
  };
  const p = palettes[tone] || palettes.warm;
  const fs = Math.max(11, Math.min(w, h) / 26);
  const fsSub = Math.max(9, Math.min(w, h) / 40);
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h +
    '" preserveAspectRatio="xMidYMid slice" class="' + className + '" style="' + style + '">' +
      '<defs>' +
        '<pattern id="p' + w + h + tone + '" patternUnits="userSpaceOnUse" width="' + (stripe*2) + '" height="' + (stripe*2) +
        '" patternTransform="rotate(45)">' +
          '<rect width="' + (stripe*2) + '" height="' + (stripe*2) + '" fill="' + p.a + '"/>' +
          '<rect width="' + stripe + '" height="' + (stripe*2) + '" fill="' + p.b + '"/>' +
        '</pattern>' +
      '</defs>' +
      '<rect width="' + w + '" height="' + h + '" fill="url(#p' + w + h + tone + ')"/>' +
      '<rect x="0.5" y="0.5" width="' + (w-1) + '" height="' + (h-1) + '" fill="none" stroke="' + p.border + '" stroke-width="1"/>' +
      '<g font-family="ui-monospace, SF Mono, Menlo, monospace" fill="' + p.text + '" text-anchor="middle">' +
        '<text x="' + (w/2) + '" y="' + (h/2 - 4) + '" font-size="' + fs + '" letter-spacing="2">[ ' + label.toUpperCase() + ' ]</text>' +
        '<text x="' + (w/2) + '" y="' + (h/2 + fs + 8) + '" font-size="' + fsSub + '" letter-spacing="3" opacity="0.55">PHOTOGRAPHY · DROP IN</text>' +
      '</g>' +
    '</svg>'
  );
};

// Returns a data URL useful for CSS background-image.
window.placeholderUrl = function (opts) {
  const svg = window.placeholder(opts);
  return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
};
