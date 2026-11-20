// Fixed scenes for screenshots: ?shot=cover shows the cover alone at a
// post size; ?shot=editor shows the editor with sample photos loaded.
// Query params: photo (the sample), caption, sub (tag line), size, look,
// sticker, frame, mirror. window.__shotReady is set once the scene has
// painted, so a screenshot tool knows it is done.
export async function stageShot(kind, params, hooks) {
  if (kind === 'cover') document.body.classList.add('shot-cover');
  const photo = params.get('photo') ?? 'pier';
  const img = await hooks.loadSample(photo);
  const patch = {
    headline: params.get('caption') ?? 'Sunset Heist',
    tagline: params.get('sub') ?? 'Vice City · 2026',
    size: params.get('size') ?? 'wide',
    look: params.get('look') ?? 'sunset',
    sticker: params.get('sticker') ?? 'burst',
    frame: params.get('frame') ?? 'white',
    mirror: params.get('mirror') === '1',
  };
  if (kind === 'editor') {
    // Editor scene: main gets one sample, left the other, right the first
    // again — three panels, two photos, like a real session.
    const other = await hooks.loadSample(photo === 'pier' ? 'boulevard' : 'pier');
    patch.shots = { main: img, left: other, right: img };
  } else {
    patch.fill = img;
  }
  hooks.apply(patch);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
