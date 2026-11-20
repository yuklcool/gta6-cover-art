// Decorations: the sticker that sits on the main panel's top right, and
// the frame drawn around every panel. Both are picked in the editor and
// drawn into the exported PNG. All shapes are drawn in code.

export const STICKERS = {
  none: { name: 'No sticker' },
  burst: { name: 'Starburst' },
  palm: { name: 'Palm badge' },
  sun: { name: 'Sun badge' },
};

export const STICKER_ORDER = Object.keys(STICKERS);

export const FRAMES = {
  white: { name: 'White frame' },
  neon: { name: 'Neon glow' },
  dark: { name: 'Thin dark' },
};

export const FRAME_ORDER = Object.keys(FRAMES);

/** The frame around one panel box. `coverW` scales the stroke. */
export function drawFrame(ctx, box, kind, coverW) {
  if (kind === 'neon') {
    ctx.save();
    ctx.strokeStyle = '#ff2fb3';
    ctx.lineWidth = Math.max(3, coverW * 0.003);
    ctx.shadowColor = '#ff2fb3';
    ctx.shadowBlur = coverW * 0.012;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(box.x + 6, box.y + 6, box.w - 12, box.h - 12);
    ctx.restore();
    return;
  }
  if (kind === 'dark') {
    ctx.strokeStyle = 'rgba(10, 3, 20, 0.85)';
    ctx.lineWidth = Math.max(2, coverW * 0.002);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    return;
  }
  // White poster frame: a bold white edge with a thin dark inner line.
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(4, coverW * 0.004);
  ctx.strokeRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8);
}

/** A sticker centred on (cx, cy) with radius r. `look` colours it. */
export function drawSticker(ctx, kind, cx, cy, r, look) {
  if (kind === 'none' || !r) return;
  ctx.save();
  ctx.translate(cx, cy);
  if (kind === 'burst') {
    // A twelve-point starburst with two lines of text.
    ctx.fillStyle = '#ff2fb3';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.beginPath();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.72;
      const px = Math.cos(a) * rad;
      const py = Math.sin(a) * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${r * 0.34}px "Arial Black", sans-serif`;
    ctx.fillText('★', 0, -r * 0.3);
    ctx.font = `900 ${r * 0.22}px "Arial Black", sans-serif`;
    ctx.fillText('VICE CITY', 0, r * 0.08);
    ctx.font = `700 ${r * 0.18}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillText('EST. 2026', 0, r * 0.38);
  } else if (kind === 'palm') {
    // A round badge with a tiny palm silhouette.
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 4, 22, 0.85)';
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.strokeStyle = '#ffe27a';
    ctx.stroke();
    ctx.strokeStyle = '#ffe27a';
    ctx.fillStyle = '#ffe27a';
    ctx.lineWidth = r * 0.07;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.55);
    ctx.quadraticCurveTo(r * 0.08, 0, r * 0.2, -r * 0.5);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (-0.2 - i * 0.28) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(r * 0.2, -r * 0.5);
      ctx.quadraticCurveTo(
        r * 0.2 + Math.cos(a) * r * 0.3,
        -r * 0.5 + Math.sin(a) * r * 0.16,
        r * 0.2 + Math.cos(a) * r * 0.5,
        -r * 0.5 + Math.sin(a) * r * 0.24 + r * 0.12,
      );
      ctx.stroke();
    }
  } else if (kind === 'sun') {
    // A round badge with a tiny striped sun.
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 4, 22, 0.85)';
    ctx.fill();
    ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.strokeStyle = look.sun;
    ctx.stroke();
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -r * 0.1, r * 0.45, 0, Math.PI * 2);
    ctx.clip();
    const g = ctx.createLinearGradient(0, -r * 0.55, 0, r * 0.35);
    g.addColorStop(0, '#ffe9a8');
    g.addColorStop(0.55, look.sun);
    g.addColorStop(1, '#ff4d6d');
    ctx.fillStyle = g;
    ctx.fillRect(-r * 0.45, -r * 0.55, r * 0.9, r * 0.9);
    ctx.fillStyle = 'rgba(20, 8, 30, 0.9)';
    ctx.fillRect(-r * 0.45, r * 0.05, r * 0.9, r * 0.05);
    ctx.fillRect(-r * 0.45, r * 0.16, r * 0.9, r * 0.07);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `900 ${r * 0.2}px "Arial Black", sans-serif`;
    ctx.fillText('VICE', 0, r * 0.55);
  }
  ctx.restore();
}
