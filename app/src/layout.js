// Post sizes, the three-panel poster geometry for each, and the maths
// that fits a photo into a panel. Every cover is one big main panel plus
// two smaller ones, split by a dark gutter — the multi-panel poster look.
// `mirror` flips the main panel to the other side (right on wide, bottom
// on square and tall). All coordinates are cover pixels at export size.

export const SIZES = {
  wide: { w: 1920, h: 1080, label: '1920 × 1080 · Wide' },
  square: { w: 1080, h: 1080, label: '1080 × 1080 · Square' },
  tall: { w: 1080, h: 1350, label: '1080 × 1350 · Portrait' },
};

const GAP = 18;

/** The three boxes of a cover: { key, x, y, w, h, main }. */
export function boxesFor(sizeKey, mirror) {
  const { w, h } = SIZES[sizeKey] ?? SIZES.wide;
  if (sizeKey === 'square') {
    const mainH = 640;
    const half = (w - GAP) / 2;
    const small = { h: h - mainH - GAP };
    const top = [
      { key: 'main', x: 0, y: 0, w, h: mainH, main: true },
      { key: 'left', x: 0, y: mainH + GAP, w: half, ...small, main: false },
      { key: 'right', x: half + GAP, y: mainH + GAP, w: half, ...small, main: false },
    ];
    return mirror ? flipVertical(top, w, h) : top;
  }
  if (sizeKey === 'tall') {
    const mainH = 786;
    const half = (w - GAP) / 2;
    const small = { h: h - mainH - GAP };
    const top = [
      { key: 'main', x: 0, y: 0, w, h: mainH, main: true },
      { key: 'left', x: 0, y: mainH + GAP, w: half, ...small, main: false },
      { key: 'right', x: half + GAP, y: mainH + GAP, w: half, ...small, main: false },
    ];
    return mirror ? flipVertical(top, w, h) : top;
  }
  const mainW = 1240;
  const half = (h - GAP) / 2;
  const side = { w: w - mainW - GAP };
  const left = [
    { key: 'main', x: 0, y: 0, w: mainW, h, main: true },
    { key: 'left', x: mainW + GAP, y: 0, ...side, h: half, main: false },
    { key: 'right', x: mainW + GAP, y: half + GAP, ...side, h: half, main: false },
  ];
  return mirror ? flipHorizontal(left, w, h) : left;
}

function flipHorizontal(boxes, w) {
  return boxes.map((b) => ({ ...b, x: w - b.x - b.w }));
}

function flipVertical(boxes, _w, h) {
  return boxes.map((b) => ({ ...b, y: h - b.y - b.h }));
}

/**
 * Where a photo is drawn to cover a box: scaled to cover, zoomed about
 * the box centre, then panned by (ox, oy). Returns { x, y, w, h }.
 */
export function coverRect(box, img, zoom, ox, oy) {
  const base = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight);
  const scale = base * zoom;
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  return { x: box.x + (box.w - w) / 2 + ox, y: box.y + (box.h - h) / 2 + oy, w, h };
}

/** Keeps a pan offset inside the range where the photo still covers its box. */
export function clampOffset(box, img, zoom, ox, oy) {
  const r = coverRect(box, img, zoom, 0, 0);
  const slackX = Math.max(0, (r.w - box.w) / 2);
  const slackY = Math.max(0, (r.h - box.h) / 2);
  return {
    ox: Math.max(-slackX, Math.min(slackX, ox)),
    oy: Math.max(-slackY, Math.min(slackY, oy)),
  };
}

/** Which box, if any, holds the point (x, y) in cover coordinates. */
export function boxAt(boxes, x, y) {
  return boxes.find((b) => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) ?? null;
}
