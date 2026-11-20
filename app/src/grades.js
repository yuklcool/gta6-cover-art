// Colour grades: the sunset and neon looks of the Vice City poster genre.
// Each grade is a sky gradient for the cover's base, a warm tint washed
// over the photos, a sun colour, and a canvas filter for the photos.
// All colours are our own; no artwork or palette is taken from any game.

export const GRADES = {
  sunset: {
    name: 'Sunset',
    sky: ['#ff9a3d', '#ff5e62', '#c22e7a', '#3d1a5e'],
    tint: 'rgba(255, 94, 98, 0.30)',
    sun: '#ffd76a',
    filter: 'saturate(1.25) contrast(1.08)',
  },
  neon: {
    name: 'Neon',
    sky: ['#19e3ff', '#7b2ff7', '#ff2fb3', '#150826'],
    tint: 'rgba(0, 227, 255, 0.20)',
    sun: '#ff5df2',
    filter: 'saturate(1.45) contrast(1.12)',
  },
  vice: {
    name: 'Vice',
    sky: ['#2de1c2', '#2b6cb0', '#e53e9e', '#2a0a4a'],
    tint: 'rgba(45, 225, 194, 0.18)',
    sun: '#ffe066',
    filter: 'saturate(1.3) contrast(1.06)',
  },
  noir: {
    name: 'Noir',
    sky: ['#e8e8e8', '#9a9a9a', '#4a4a4a', '#0d0d0d'],
    tint: 'rgba(0, 0, 0, 0.28)',
    sun: '#ffffff',
    filter: 'grayscale(1) contrast(1.25)',
  },
};

export const GRADE_KEYS = Object.keys(GRADES);
