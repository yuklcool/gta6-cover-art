// Wires the editor: photo slots, per-panel crop and position, headline,
// look, decorations and size pickers, live preview and PNG export.
// A `?shot=` query stages a fixed scene for a screenshot (./stage.js).
import { SIZES, boxesFor, clampOffset, boxAt } from './layout.js';
import { LOOKS, LOOK_ORDER } from './looks.js';
import { STICKERS, STICKER_ORDER, FRAMES, FRAME_ORDER } from './decor.js';
import { renderPoster } from './art.js';
import { freshState, PANEL_LABELS, PANEL_KEYS, emptyShot } from './state.js';
import { stageShot } from './stage.js';

const poster = document.getElementById('poster');
const note = document.getElementById('note');
const headlineInput = document.getElementById('headline');
const taglineInput = document.getElementById('tagline');
const zoomInput = document.getElementById('zoom');
const zoomOut = document.getElementById('zoom-out');
const zoomPanel = document.getElementById('zoom-panel');

const state = freshState();

function repaint() {
  const { w, h } = SIZES[state.size];
  if (poster.width !== w || poster.height !== h) {
    poster.width = w;
    poster.height = h;
  }
  renderPoster(poster, state);
  const shot = state.shots[state.active];
  zoomPanel.textContent = PANEL_LABELS[state.active];
  zoomInput.disabled = !shot;
  zoomInput.value = shot ? shot.zoom : 1;
  zoomOut.textContent = shot ? `${Math.round(shot.zoom * 100)}%` : '—';
}

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function putShot(key, img) {
  state.shots[key] = img ? emptyShot(img) : null;
  state.active = key;
  repaint();
}

async function loadUpload(file, key) {
  if (!file) return;
  putShot(key, await loadImage(URL.createObjectURL(file)));
  note.textContent = `Loaded ${file.name} into ${PANEL_LABELS[key]}. Drag it on the cover to position it.`;
}

async function loadSamplePhoto(key, name) {
  putShot(key, await loadImage(`samples/${name}.jpg`));
  note.textContent = `Sample photo loaded into ${PANEL_LABELS[key]}.`;
}

// Photo slots: upload, sample, fill-all, select.
for (const key of PANEL_KEYS) {
  document.getElementById(`file-${key}`).addEventListener('change', (e) => loadUpload(e.target.files[0], key));
  document.getElementById(`sample-${key}`).addEventListener('click', () => loadSamplePhoto(key, key === 'right' ? 'pier' : 'boulevard'));
  document.getElementById(`fill-${key}`).addEventListener('click', () => {
    const src = state.shots[key];
    if (!src) { note.textContent = 'Load a photo into this panel first.'; return; }
    for (const other of PANEL_KEYS) {
      state.shots[other] = emptyShot(src.img);
    }
    repaint();
    note.textContent = 'One photo now fills all three panels.';
  });
  document.getElementById(`choose-${key}`).addEventListener('click', () => {
    state.active = key;
    repaint();
  });
}

// Drag on the cover pans the photo in the box under the pointer.
let drag = null;
function posterPoint(e) {
  const r = poster.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (poster.width / r.width),
    y: (e.clientY - r.top) * (poster.height / r.height),
  };
}
poster.addEventListener('pointerdown', (e) => {
  const p = posterPoint(e);
  const box = boxAt(boxesFor(state.size, state.mirror), p.x, p.y);
  if (!box) return;
  state.active = box.key;
  const shot = state.shots[box.key];
  if (!shot) { repaint(); return; }
  drag = { key: box.key, startX: p.x, startY: p.y, ox: shot.ox, oy: shot.oy };
  poster.setPointerCapture(e.pointerId);
  repaint();
});
poster.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = posterPoint(e);
  const shot = state.shots[drag.key];
  const box = boxesFor(state.size, state.mirror).find((b) => b.key === drag.key);
  const next = clampOffset(box, shot.img, shot.zoom, drag.ox + (p.x - drag.startX), drag.oy + (p.y - drag.startY));
  shot.ox = next.ox;
  shot.oy = next.oy;
  repaint();
});
poster.addEventListener('pointerup', () => { drag = null; });

zoomInput.addEventListener('input', () => {
  const shot = state.shots[state.active];
  if (!shot) return;
  shot.zoom = Number(zoomInput.value);
  const box = boxesFor(state.size, state.mirror).find((b) => b.key === state.active);
  const next = clampOffset(box, shot.img, shot.zoom, shot.ox, shot.oy);
  shot.ox = next.ox;
  shot.oy = next.oy;
  repaint();
});

headlineInput.addEventListener('input', () => { state.headline = headlineInput.value; repaint(); });
taglineInput.addEventListener('input', () => { state.tagline = taglineInput.value; repaint(); });

// Look swatches.
const lookBox = document.getElementById('looks');
for (const key of LOOK_ORDER) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'swatch';
  b.textContent = LOOKS[key].name;
  b.style.background = `linear-gradient(135deg, ${LOOKS[key].sky[0]}, ${LOOKS[key].sky[2]})`;
  b.addEventListener('click', () => {
    state.look = key;
    lookBox.querySelectorAll('.swatch').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    repaint();
  });
  if (key === state.look) b.classList.add('active');
  lookBox.appendChild(b);
}

// Sticker picker.
const stickerBox = document.getElementById('stickers');
for (const key of STICKER_ORDER) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = STICKERS[key].name;
  b.addEventListener('click', () => {
    state.sticker = key;
    stickerBox.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    repaint();
  });
  if (key === state.sticker) b.classList.add('active');
  stickerBox.appendChild(b);
}

// Frame picker.
const frameBox = document.getElementById('frames');
for (const key of FRAME_ORDER) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = FRAMES[key].name;
  b.addEventListener('click', () => {
    state.frame = key;
    frameBox.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    repaint();
  });
  if (key === state.frame) b.classList.add('active');
  frameBox.appendChild(b);
}

// Post-size buttons.
const sizeBox = document.getElementById('sizes');
for (const [key, size] of Object.entries(SIZES)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.textContent = size.label;
  b.addEventListener('click', () => {
    state.size = key;
    sizeBox.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    repaint();
  });
  if (key === state.size) b.classList.add('active');
  sizeBox.appendChild(b);
}

// Flip layout: main panel swaps to the other side.
document.getElementById('flip').addEventListener('click', () => {
  state.mirror = !state.mirror;
  document.getElementById('flip').classList.toggle('active', state.mirror);
  repaint();
});

// Export: re-render at full size on an offscreen canvas and save the PNG.
document.getElementById('save').addEventListener('click', () => {
  const { w, h } = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderPoster(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${w}x${h}.png`;
    a.click();
    note.textContent = `Saved vice-nights-${w}x${h}.png (${w} × ${h}).`;
  }, 'image/png');
});

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(shot, params, {
    loadSample: async (name) => loadImage(`samples/${name}.jpg`),
    apply: (patch) => {
      if (patch.size) state.size = patch.size;
      if (patch.look) state.look = patch.look;
      if (patch.sticker) state.sticker = patch.sticker;
      if (patch.frame) state.frame = patch.frame;
      if (patch.mirror !== undefined) state.mirror = patch.mirror;
      if (patch.headline !== undefined) { state.headline = patch.headline; headlineInput.value = patch.headline; }
      if (patch.tagline !== undefined) { state.tagline = patch.tagline; taglineInput.value = patch.tagline; }
      if (patch.fill) {
        for (const key of PANEL_KEYS) state.shots[key] = emptyShot(patch.fill);
      }
      if (patch.shots) {
        for (const [key, img] of Object.entries(patch.shots)) {
          state.shots[key] = emptyShot(img);
        }
      }
      repaint();
    },
  });
} else {
  repaint();
}
