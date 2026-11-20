// Colour looks for the cover: the sunset and neon moods of the Vice City
// poster genre, in our own values. Each look is a sky gradient for the
// base, a warm wash over the photos, a sun colour, and a canvas filter
// applied to the photos. No palette is taken from any game.

export const LOOKS = {
  sunset: {
    name: 'Sunset',
    sky: ['#ffb347', '#ff6b5e', '#d63384', '#40195c'],
    wash: 'rgba(255, 107, 94, 0.28)',
    sun: '#ffe27a',
    filter: 'saturate(1.25) contrast(1.08)',
  },
  neon: {
    name: 'Neon',
    sky: ['#22e6ff', '#8b3dff', '#ff2fb3', '#170829'],
    wash: 'rgba(34, 230, 255, 0.18)',
    sun: '#ff6bf5',
    filter: 'saturate(1.45) contrast(1.12)',
  },
  lagoon: {
    name: 'Lagoon',
    sky: ['#2ee6c8', '#2f7fc2', '#e53e9e', '#2a0a4a'],
    wash: 'rgba(46, 230, 200, 0.16)',
    sun: '#ffe066',
    filter: 'saturate(1.3) contrast(1.06)',
  },
  mono: {
    name: 'Mono',
    sky: ['#f0f0f0', '#a3a3a3', '#4d4d4d', '#0d0d0d'],
    wash: 'rgba(0, 0, 0, 0.30)',
    sun: '#ffffff',
    filter: 'grayscale(1) contrast(1.25)',
  },
};

export const LOOK_ORDER = Object.keys(LOOKS);
