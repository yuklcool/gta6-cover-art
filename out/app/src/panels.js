// Panel layouts for the three post sizes, and the math that fits a photo
// into a panel with a zoom level and a pan offset. Every size is a
// multi-panel poster: one big hero panel plus two smaller panels, split
// by white gutters on a dark base — the GTA poster look, in our own
// proportions. Coordinates are in cover pixels at the export size.

export const SIZES = {
  '1920x1080': { w: 1920, h: 1080, label: '1920 × 1080 · Wide' },
  '1080x1080': { w: 1080, h: 1080, label: '1080 × 1080 · Square' },
  '1080x1350': { w: 1080, h: 1350, label: '1080 × 1350 · Portrait' },
};

const GUTTER = 16;

/** The three panels of a cover: hero, a, b. Each is { id, x, y, w, h, hero }. */
export function layoutFor(sizeKey) {
  const { w, h } = SIZES[sizeKey] ?? SIZES['1920x1080'];
  if (sizeKey === '1080x1080') {
    const heroH = 648;
    const bw = (w - GUTTER) / 2;
    return [
      { id: 'hero', x: 0, y: 0, w, h: heroH, hero: true },
      { id: 'a', x: 0, y: heroH + GUTTER, w: bw, h: h - heroH - GUTTER, hero: false },
      { id: 'b', x: bw + GUTTER, y: heroH + GUTTER, w: bw, h: h - heroH - GUTTER, hero: false },
    ];
  }
  if (sizeKey === '1080x1350') {
    const heroH = 792;
    const bw = (w - GUTTER) / 2;
    return [
      { id: 'hero', x: 0, y: 0, w, h: heroH, hero: true },
      { id: 'a', x: 0, y: heroH + GUTTER, w: bw, h: h - heroH - GUTTER, hero: false },
      { id: 'b', x: bw + GUTTER, y: heroH + GUTTER, w: bw, h: h - heroH - GUTTER, hero: false },
    ];
  }
  const heroW = 1256;
  const bh = (h - GUTTER) / 2;
  return [
    { id: 'hero', x: 0, y: 0, w: heroW, h, hero: true },
    { id: 'a', x: heroW + GUTTER, y: 0, w: w - heroW - GUTTER, h: bh, hero: false },
    { id: 'b', x: heroW + GUTTER, y: bh + GUTTER, w: w - heroW - GUTTER, h: bh, hero: false },
  ];
}

/**
 * The rectangle a photo is drawn in to cover a panel: the photo is scaled
 * so it covers the panel, then zoomed around its centre and panned by
 * (dx, dy) in panel pixels. Returns { x, y, w, h } in panel coordinates.
 */
export function fitPhoto(panel, img, zoom, dx, dy) {
  const base = Math.max(panel.w / img.naturalWidth, panel.h / img.naturalHeight);
  const scale = base * zoom;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return { x: panel.x + (panel.w - w) / 2 + dx, y: panel.y + (panel.h - h) / 2 + dy, w, h };
}

/** Clamps a pan offset so the photo still covers its panel at the given zoom. */
export function clampPan(panel, img, zoom, dx, dy) {
  const r = fitPhoto(panel, img, zoom, 0, 0);
  const overX = Math.max(0, (r.w - panel.w) / 2);
  const overY = Math.max(0, (r.h - panel.h) / 2);
  return {
    dx: Math.max(-overX, Math.min(overX, dx)),
    dy: Math.max(-overY, Math.min(overY, dy)),
  };
}

/** Which panel, if any, holds the point (x, y) in cover coordinates. */
export function panelAt(panels, x, y) {
  return panels.find((p) => x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h) ?? null;
}
