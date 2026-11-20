// Draws the whole cover onto a 2D canvas context, at the canvas's own
// size. The state comes from state.js; geometry from layout.js; looks
// from looks.js; stickers and frames from decor.js. Every visual is drawn
// in code — gradients, silhouettes and lettering — no artwork files.

import { boxesFor, coverRect } from './layout.js';
import { LOOKS } from './looks.js';
import { drawFrame, drawSticker } from './decor.js';

function pill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A palm silhouette: a leaning trunk and seven drooping fronds. */
function palmTree(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.22, y - s * 0.95);
  ctx.stroke();
  const crownX = x + s * 0.22;
  const crownY = y - s * 0.95;
  for (let i = 0; i < 7; i++) {
    const a = (-0.15 - i * 0.22) * Math.PI;
    const len = s * (0.62 - Math.abs(i - 3) * 0.06);
    const tipX = crownX + Math.cos(a) * len;
    const tipY = crownY + Math.sin(a) * len * 0.45 + s * 0.18;
    const midX = crownX + Math.cos(a) * len * 0.5;
    const midY = crownY + Math.sin(a) * len * 0.22 - s * 0.08;
    ctx.beginPath();
    ctx.moveTo(crownX, crownY);
    ctx.quadraticCurveTo(midX, midY, tipX, tipY);
    ctx.quadraticCurveTo(midX + s * 0.03, midY + s * 0.1, crownX, crownY);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.arc(crownX - s * 0.03, crownY + s * 0.04, s * 0.05, 0, Math.PI * 2);
  ctx.arc(crownX + s * 0.05, crownY + s * 0.05, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
}

/** A skyline silhouette along a baseline, with a few lit windows. */
function cityLine(ctx, x, baseY, w, h, color, lit) {
  ctx.fillStyle = color;
  let seed = 11;
  const next = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let cx = x;
  while (cx < x + w) {
    const bw = w * (0.05 + next() * 0.09);
    const bh = h * (0.35 + next() * 0.65);
    ctx.fillRect(cx, baseY - bh, bw, bh);
    if (next() > 0.6) ctx.fillRect(cx + bw * 0.3, baseY - bh - h * 0.12, bw * 0.16, h * 0.12);
    cx += bw + w * 0.012;
  }
  ctx.fillStyle = lit;
  const win = Math.max(2, w * 0.002);
  for (let i = 0; i < 26; i++) {
    ctx.fillRect(x + next() * w, baseY - next() * h * 0.8, win, win * 1.3);
  }
}

/** A halftone dot field that fades out to the right. */
function dotField(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  const step = Math.max(10, w / 14);
  for (let row = 0; row * step < h; row++) {
    for (let col = 0; col * step < w; col++) {
      const fade = 1 - col / (w / step);
      const r = step * 0.32 * fade;
      if (r < 0.8) continue;
      ctx.beginPath();
      ctx.arc(x + col * step + step / 2, y + row * step + step / 2, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** A synthwave sun: a glowing disc cut by horizontal slits. */
function stripedSun(ctx, cx, cy, r, color) {
  const halo = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  halo.addColorStop(0, color);
  halo.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const disc = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  disc.addColorStop(0, '#ffe9a8');
  disc.addColorStop(0.55, color);
  disc.addColorStop(1, '#ff4d6d');
  ctx.fillStyle = disc;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.fillStyle = 'rgba(20, 8, 30, 0.9)';
  let y = cy + r * 0.08;
  let thick = r * 0.05;
  while (y < cy + r) {
    ctx.fillRect(cx - r, y, r * 2, thick);
    y += thick + r * 0.16;
    thick += r * 0.03;
  }
  ctx.restore();
}

/** Splits the headline into at most two lines at the largest size that fits. */
function fitHeadline(ctx, text, maxW, startSize) {
  const words = text.split(/\s+/).filter(Boolean);
  let size = startSize;
  while (size > 14) {
    ctx.font = `italic 900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const trial = line ? `${line} ${word}` : word;
      if (ctx.measureText(trial).width <= maxW || !line) line = trial;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    if (lines.length <= 2 && lines.every((l) => ctx.measureText(l).width <= maxW)) return { size, lines };
    size -= 4;
  }
  ctx.font = `italic 900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
  return { size, lines: [text] };
}

/**
 * Renders the full cover. `canvas` must already be at the export size
 * (its width/height are the post size). `state` is the editor state.
 */
export function renderPoster(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const look = LOOKS[state.look] ?? LOOKS.sunset;
  const boxes = boxesFor(state.size, state.mirror);

  // Base: the look's sky, deep at the bottom.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  look.sky.forEach((c, i) => sky.addColorStop(i / (look.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  for (const box of boxes) {
    const shot = state.shots[box.key];
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    if (shot && shot.img) {
      ctx.filter = look.filter;
      const r = coverRect(box, shot.img, shot.zoom, shot.ox, shot.oy);
      ctx.drawImage(shot.img, r.x, r.y, r.w, r.h);
      ctx.filter = 'none';
      const wash = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
      wash.addColorStop(0, 'rgba(0,0,0,0)');
      wash.addColorStop(1, look.wash);
      ctx.fillStyle = wash;
      ctx.fillRect(box.x, box.y, box.w, box.h);
    } else {
      const g = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
      g.addColorStop(0, '#3d1a5e');
      g.addColorStop(1, '#12081f');
      ctx.fillStyle = g;
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      for (let d = -box.h; d < box.w; d += 34) {
        ctx.beginPath();
        ctx.moveTo(box.x + d, box.y + box.h);
        ctx.lineTo(box.x + d + box.h, box.y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `900 ${Math.max(18, box.w * 0.045)}px "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', box.x + box.w / 2, box.y + box.h / 2);
    }
    ctx.restore();
    drawFrame(ctx, box, state.frame, W);
  }

  const main = boxes[0];
  // Sun, skyline and palms across the main panel's lower half.
  const sunR = main.w * 0.11;
  stripedSun(ctx, main.x + main.w * 0.74, main.y + main.h * 0.34, sunR, look.sun);
  cityLine(ctx, main.x, main.y + main.h * 0.86, main.w, main.h * 0.14, 'rgba(16, 6, 28, 0.92)', look.sun);
  const palmH = main.h * 0.34;
  palmTree(ctx, main.x + main.w * 0.06, main.y + main.h * 0.88, palmH, 'rgba(12, 4, 22, 0.95)');
  palmTree(ctx, main.x + main.w * 0.93, main.y + main.h * 0.9, palmH * 0.8, 'rgba(12, 4, 22, 0.95)');
  dotField(ctx, main.x + main.w * 0.02, main.y + main.h * 0.03, main.w * 0.2, main.h * 0.12, 'rgba(255,255,255,0.5)');

  // Brand pill, top left of the main panel.
  const pillText = 'VICE NIGHTS';
  ctx.font = `900 ${Math.max(16, main.w * 0.022)}px "Arial Black", sans-serif`;
  const pillW = ctx.measureText(pillText).width + main.w * 0.04;
  const pillH = main.w * 0.038;
  ctx.fillStyle = 'rgba(12, 4, 22, 0.85)';
  pill(ctx, main.x + main.w * 0.03, main.y + main.h * 0.045, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, main.x + main.w * 0.03 + main.w * 0.02, main.y + main.h * 0.045 + pillH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // Sticker, top right of the main panel.
  drawSticker(ctx, state.sticker, main.x + main.w * 0.9, main.y + main.h * 0.09, main.w * 0.055, look);

  // Headline band across the main panel's foot.
  const bandH = main.h * 0.26;
  const bandY = main.y + main.h - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, main.y + main.h);
  band.addColorStop(0, 'rgba(10, 3, 20, 0)');
  band.addColorStop(0.45, 'rgba(10, 3, 20, 0.72)');
  band.addColorStop(1, 'rgba(10, 3, 20, 0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(main.x, bandY, main.w, bandH);

  const headline = (state.headline || '').trim().toUpperCase() || 'YOUR STORY';
  const { size, lines } = fitHeadline(ctx, headline, main.w * 0.9, main.h * 0.115);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0d0318';
  ctx.lineWidth = size * 0.16;
  ctx.lineJoin = 'round';
  ctx.shadowColor = '#ff2fb3';
  ctx.shadowBlur = size * 0.25;
  ctx.shadowOffsetY = size * 0.05;
  const lineH = size * 1.04;
  const totalH = lines.length * lineH;
  let ty = main.y + main.h - main.h * 0.075 - totalH + size;
  for (const line of lines) {
    ctx.strokeText(line, main.x + main.w / 2, ty);
    ctx.fillText(line, main.x + main.w / 2, ty);
    ty += lineH;
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const tagline = (state.tagline || '').trim().toUpperCase();
  if (tagline) {
    ctx.font = `700 ${Math.max(14, main.w * 0.016)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(tagline.split('').join('  '), main.x + main.w / 2, main.y + main.h - main.h * 0.028);
  }
}
