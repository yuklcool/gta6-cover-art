// Fixed scenes for screenshots: ?shot=cover shows the cover alone at a
// post size; ?shot=editor shows the editor with a sample photo loaded.
// `photo` picks the sample (samples/<photo>.jpg), `caption` the words,
// `size` the post size, `grade` the colour grade. window.__shotReady is
// set once the scene has painted, so a screenshot tool knows it is done.
export async function runShot(shot, query, hooks) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const img = await hooks.loadSample(photo);
  const patch = {
    caption: query.get('caption') ?? 'Sunset Heist',
    sub: query.get('sub') ?? 'Vice City · 2026',
    sizeKey: query.get('size') ?? '1920x1080',
    grade: query.get('grade') ?? 'sunset',
  };
  if (shot === 'editor') {
    // Editor shot: hero gets one photo, panel A the other sample, panel B
    // the first again — three panels, two photos, like a real session.
    const other = await hooks.loadSample(photo === 'pier' ? 'boulevard' : 'pier');
    patch.photos = { hero: img, a: other, b: img };
  } else {
    patch.fill = img;
  }
  hooks.apply(patch);
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
