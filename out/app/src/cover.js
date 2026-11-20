// Draws the cover onto a canvas 2D context, at the canvas's own size.
// The state is { sizeKey, grade, caption, sub, photos: { hero, a, b } },
// where each photo is { img, zoom, dx, dy } or null. Everything here is
// drawn in code: gradients, silhouettes and lettering — no artwork files.

import { layoutFor, fitPhoto } from './panels.js';
import { GRADES } from './grades.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A palm tree silhouette: a curved trunk and seven drooping fronds. */
function drawPalm(ctx, x, y, s, color) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // Trunk, leaning slightly, drawn as two tapering strokes.
  ctx.lineWidth = s * 0.09;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + s * 0.08, y - s * 0.5, x + s * 0.22, y - s * 0.95);
  ctx.stroke();
  const topX = x + s * 0.22;
  const topY = y - s * 0.95;
  // Fronds: each a filled curved blade fanning out from the crown.
  for (let i = 0; i < 7; i++) {
    const a = (-0.15 - i * 0.22) * Math.PI;
    const len = s * (0.62 - Math.abs(i - 3) * 0.06);
    const ex = topX + Math.cos(a) * len;
    const ey = topY + Math.sin(a) * len * 0.45 + s * 0.18;
    const mx = topX + Math.cos(a) * len * 0.5;
    const my = topY + Math.sin(a) * len * 0.22 - s * 0.08;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.quadraticCurveTo(mx + s * 0.03, my + s * 0.1, topX, topY);
    ctx.fill();
  }
  // Coconuts.
  ctx.beginPath();
  ctx.arc(topX - s * 0.03, topY + s * 0.04, s * 0.05, 0, Math.PI * 2);
  ctx.arc(topX + s * 0.05, topY + s * 0.05, s * 0.045, 0, Math.PI * 2);
  ctx.fill();
}

/** A skyline silhouette along a baseline, with a few lit windows. */
function drawSkyline(ctx, x, baseY, w, h, color, lit) {
  ctx.fillStyle = color;
  let cx = x;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  while (cx < x + w) {
    const bw = w * (0.05 + rnd() * 0.09);
    const bh = h * (0.35 + rnd() * 0.65);
    ctx.fillRect(cx, baseY - bh, bw, bh);
    if (rnd() > 0.6) ctx.fillRect(cx + bw * 0.3, baseY - bh - h * 0.12, bw * 0.16, h * 0.12);
    cx += bw + w * 0.012;
  }
  ctx.fillStyle = lit;
  for (let i = 0; i < 26; i++) {
    ctx.fillRect(x + rnd() * w, baseY - rnd() * h * 0.8, 3, 4);
  }
}

/** A halftone dot field fading out to the right, in one corner. */
function drawHalftone(ctx, x, y, w, h, color) {
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
function drawSun(ctx, cx, cy, r, color) {
  const glow = ctx.createRadialGradient(cx, cy, r * 0.2, cx, cy, r * 1.6);
  glow.addColorStop(0, color);
  glow.addColorStop(1, 'rgba(255, 120, 80, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  g.addColorStop(0, '#ffe9a8');
  g.addColorStop(0.55, color);
  g.addColorStop(1, '#ff4d6d');
  ctx.fillStyle = g;
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

/** Fits the caption into at most two lines at the largest size that fits. */
function fitCaption(ctx, text, maxW, startSize) {
  const words = text.split(/\s+/).filter(Boolean);
  let size = startSize;
  while (size > 14) {
    ctx.font = `italic 900 ${size}px "Arial Black", "Helvetica Neue", Arial, sans-serif`;
    const lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxW || !line) line = test;
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
 * Draws the whole cover. `canvas` must already be at the export size
 * (its width/height are the post size). `state` is the editor state.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const panels = layoutFor(state.sizeKey);

  // Base: the grade's sky, deep at the bottom.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  for (const panel of panels) {
    const photo = state.photos[panel.id];
    ctx.save();
    ctx.beginPath();
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
    ctx.clip();
    if (photo && photo.img) {
      ctx.filter = grade.filter;
      const r = fitPhoto(panel, photo.img, photo.zoom, photo.dx, photo.dy);
      ctx.drawImage(photo.img, r.x, r.y, r.w, r.h);
      ctx.filter = 'none';
      const tint = ctx.createLinearGradient(0, panel.y, 0, panel.y + panel.h);
      tint.addColorStop(0, 'rgba(0,0,0,0)');
      tint.addColorStop(1, grade.tint);
      ctx.fillStyle = tint;
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
    } else {
      const g = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
      g.addColorStop(0, '#3d1a5e');
      g.addColorStop(1, '#12081f');
      ctx.fillStyle = g;
      ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      ctx.lineWidth = 2;
      for (let d = -panel.h; d < panel.w; d += 34) {
        ctx.beginPath();
        ctx.moveTo(panel.x + d, panel.y + panel.h);
        ctx.lineTo(panel.x + d + panel.h, panel.y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = `900 ${Math.max(18, panel.w * 0.045)}px "Arial Black", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ADD A PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2);
    }
    ctx.restore();
    // White poster frame around the panel.
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(4, W * 0.004);
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(panel.x + 4, panel.y + 4, panel.w - 8, panel.h - 8);
  }

  const hero = panels[0];
  // Sun, skyline and palms across the hero's lower half.
  const sunR = hero.w * 0.11;
  drawSun(ctx, hero.x + hero.w * 0.74, hero.y + hero.h * 0.34, sunR, grade.sun);
  drawSkyline(ctx, hero.x, hero.y + hero.h * 0.86, hero.w, hero.h * 0.14, 'rgba(16, 6, 28, 0.92)', grade.sun);
  const palmH = hero.h * 0.34;
  drawPalm(ctx, hero.x + hero.w * 0.06, hero.y + hero.h * 0.88, palmH, 'rgba(12, 4, 22, 0.95)');
  drawPalm(ctx, hero.x + hero.w * 0.93, hero.y + hero.h * 0.9, palmH * 0.8, 'rgba(12, 4, 22, 0.95)');
  drawHalftone(ctx, hero.x + hero.w * 0.02, hero.y + hero.h * 0.03, hero.w * 0.2, hero.h * 0.12, 'rgba(255,255,255,0.5)');

  // Brand pill, top left of the hero.
  const pillText = 'VICE NIGHTS';
  ctx.font = `900 ${Math.max(16, hero.w * 0.022)}px "Arial Black", sans-serif`;
  const pillW = ctx.measureText(pillText).width + hero.w * 0.04;
  const pillH = hero.w * 0.038;
  ctx.fillStyle = 'rgba(12, 4, 22, 0.85)';
  roundRect(ctx, hero.x + hero.w * 0.03, hero.y + hero.h * 0.045, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(pillText, hero.x + hero.w * 0.03 + hero.w * 0.02, hero.y + hero.h * 0.045 + pillH / 2 + 1);
  ctx.textBaseline = 'alphabetic';

  // Caption band across the hero's foot.
  const bandH = hero.h * 0.26;
  const bandY = hero.y + hero.h - bandH;
  const band = ctx.createLinearGradient(0, bandY, 0, hero.y + hero.h);
  band.addColorStop(0, 'rgba(10, 3, 20, 0)');
  band.addColorStop(0.45, 'rgba(10, 3, 20, 0.72)');
  band.addColorStop(1, 'rgba(10, 3, 20, 0.92)');
  ctx.fillStyle = band;
  ctx.fillRect(hero.x, bandY, hero.w, bandH);

  const caption = (state.caption || '').trim().toUpperCase() || 'YOUR STORY';
  const { size, lines } = fitCaption(ctx, caption, hero.w * 0.9, hero.h * 0.115);
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
  let ty = hero.y + hero.h - hero.h * 0.075 - totalH + size;
  for (const line of lines) {
    ctx.strokeText(line, hero.x + hero.w / 2, ty);
    ctx.fillText(line, hero.x + hero.w / 2, ty);
    ty += lineH;
  }
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  const sub = (state.sub || '').trim().toUpperCase();
  if (sub) {
    ctx.font = `700 ${Math.max(14, hero.w * 0.016)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillText(sub.split('').join('  '), hero.x + hero.w / 2, hero.y + hero.h - hero.h * 0.028);
  }
}
