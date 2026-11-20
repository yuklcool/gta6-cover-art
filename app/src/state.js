// The editor's state: one plain object the renderer reads and the UI edits.
// A photo slot is null until a picture lands in it, then
// { img, zoom, ox, oy } — zoom around the panel centre, ox/oy the pan in
// cover pixels. Panel keys are main / left / right.

export function freshState() {
  return {
    size: 'wide',
    look: 'sunset',
    mirror: false,
    sticker: 'burst',
    frame: 'white',
    headline: 'Sunset Heist',
    tagline: 'Vice City · 2026',
    active: 'main',
    shots: { main: null, left: null, right: null },
  };
}

export const PANEL_LABELS = { main: 'Main panel', left: 'Left panel', right: 'Right panel' };
export const PANEL_KEYS = ['main', 'left', 'right'];

export function emptyShot(img) {
  return { img, zoom: 1, ox: 0, oy: 0 };
}
