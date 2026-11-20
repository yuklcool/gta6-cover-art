// Wires the editor: photo slots, per-panel crop and position, caption,
// grade and size pickers, live preview and PNG export. A `?shot=` query
// stages a fixed scene for a screenshot instead (./shots.js).
import { SIZES, layoutFor, clampPan, panelAt } from './panels.js';
import { GRADES, GRADE_KEYS } from './grades.js';
import { drawCover } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const status = document.getElementById('status');
const captionInput = document.getElementById('caption');
const subInput = document.getElementById('sub');
const zoomInput = document.getElementById('zoom');
const zoomLabel = document.getElementById('zoom-value');
const panelName = document.getElementById('panel-name');

const state = {
  sizeKey: '1920x1080',
  grade: 'sunset',
  caption: 'Sunset Heist',
  sub: 'Vice City · 2026',
  selected: 'hero',
  photos: { hero: null, a: null, b: null },
};

function redraw() {
  const { w, h } = SIZES[state.sizeKey];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  const slot = state.photos[state.selected];
  panelName.textContent = { hero: 'Hero panel', a: 'Panel A', b: 'Panel B' }[state.selected];
  zoomInput.disabled = !slot;
  zoomInput.value = slot ? slot.zoom : 1;
  zoomLabel.textContent = slot ? `${Math.round(slot.zoom * 100)}%` : '—';
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

function setPhoto(id, img) {
  state.photos[id] = img ? { img, zoom: 1, dx: 0, dy: 0 } : null;
  state.selected = id;
  redraw();
}

async function loadFile(file, id) {
  if (!file) return;
  setPhoto(id, await loadImage(URL.createObjectURL(file)));
  status.textContent = `Loaded ${file.name} into ${id === 'hero' ? 'the hero panel' : `panel ${id.toUpperCase()}`}. Drag it on the cover to position it.`;
}

async function loadSample(id, name) {
  setPhoto(id, await loadImage(`samples/${name}.jpg`));
  status.textContent = `Sample photo loaded into ${id === 'hero' ? 'the hero panel' : `panel ${id.toUpperCase()}`}.`;
}

// Photo slots: upload, sample, fill-all.
for (const id of ['hero', 'a', 'b']) {
  document.getElementById(`file-${id}`).addEventListener('change', (e) => loadFile(e.target.files[0], id));
  document.getElementById(`sample-${id}`).addEventListener('click', () => loadSample(id, id === 'b' ? 'pier' : 'boulevard'));
  document.getElementById(`fill-${id}`).addEventListener('click', () => {
    const src = state.photos[id];
    if (!src) { status.textContent = 'Load a photo into this panel first.'; return; }
    for (const other of ['hero', 'a', 'b']) {
      state.photos[other] = { img: src.img, zoom: 1, dx: 0, dy: 0 };
    }
    redraw();
    status.textContent = 'One photo now fills all three panels.';
  });
  document.getElementById(`pick-${id}`).addEventListener('click', () => {
    state.selected = id;
    redraw();
  });
}

// Drag on the cover pans the photo in the panel under the pointer.
let drag = null;
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}
canvas.addEventListener('pointerdown', (e) => {
  const p = canvasPoint(e);
  const panel = panelAt(layoutFor(state.sizeKey), p.x, p.y);
  if (!panel) return;
  state.selected = panel.id;
  const slot = state.photos[panel.id];
  if (!slot) { redraw(); return; }
  drag = { id: panel.id, startX: p.x, startY: p.y, dx: slot.dx, dy: slot.dy };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = canvasPoint(e);
  const slot = state.photos[drag.id];
  const panel = layoutFor(state.sizeKey).find((x) => x.id === drag.id);
  const next = clampPan(panel, slot.img, slot.zoom, drag.dx + (p.x - drag.startX), drag.dy + (p.y - drag.startY));
  slot.dx = next.dx;
  slot.dy = next.dy;
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });

zoomInput.addEventListener('input', () => {
  const slot = state.photos[state.selected];
  if (!slot) return;
  slot.zoom = Number(zoomInput.value);
  const panel = layoutFor(state.sizeKey).find((x) => x.id === state.selected);
  const next = clampPan(panel, slot.img, slot.zoom, slot.dx, slot.dy);
  slot.dx = next.dx;
  slot.dy = next.dy;
  redraw();
});

captionInput.addEventListener('input', () => { state.caption = captionInput.value; redraw(); });
subInput.addEventListener('input', () => { state.sub = subInput.value; redraw(); });

// Grade swatches.
const gradeBox = document.getElementById('grades');
for (const key of GRADE_KEYS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'swatch';
  b.textContent = GRADES[key].name;
  b.style.background = `linear-gradient(135deg, ${GRADES[key].sky[0]}, ${GRADES[key].sky[2]})`;
  b.addEventListener('click', () => {
    state.grade = key;
    gradeBox.querySelectorAll('.swatch').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    redraw();
  });
  if (key === state.grade) b.classList.add('on');
  gradeBox.appendChild(b);
}

// Post-size buttons.
const sizeBox = document.getElementById('sizes');
for (const [key, size] of Object.entries(SIZES)) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'size-btn';
  b.textContent = size.label;
  b.addEventListener('click', () => {
    state.sizeKey = key;
    sizeBox.querySelectorAll('.size-btn').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    redraw();
  });
  if (key === state.sizeKey) b.classList.add('on');
  sizeBox.appendChild(b);
}

// Export: re-render at full size on an offscreen canvas and save the PNG.
document.getElementById('export').addEventListener('click', () => {
  const { w, h } = SIZES[state.sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-nights-${state.sizeKey}.png`;
    a.click();
    status.textContent = `Saved vice-nights-${state.sizeKey}.png (${w} × ${h}).`;
  }, 'image/png');
});

const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadSample: async (name) => loadImage(`samples/${name}.jpg`),
    apply: (patch) => {
      if (patch.sizeKey) state.sizeKey = patch.sizeKey;
      if (patch.grade) state.grade = patch.grade;
      if (patch.caption !== undefined) { state.caption = patch.caption; captionInput.value = patch.caption; }
      if (patch.sub !== undefined) { state.sub = patch.sub; subInput.value = patch.sub; }
      if (patch.fill) {
        for (const id of ['hero', 'a', 'b']) state.photos[id] = { img: patch.fill, zoom: 1, dx: 0, dy: 0 };
      }
      if (patch.photos) {
        for (const [id, img] of Object.entries(patch.photos)) {
          state.photos[id] = { img, zoom: 1, dx: 0, dy: 0 };
        }
      }
      redraw();
    },
  });
} else {
  redraw();
}
