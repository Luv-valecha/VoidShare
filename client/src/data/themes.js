// src/data/themes.js
//
// Central catalog of every visual theme VoidShare ships with. Each entry's
// `id` must match a `[data-theme="..."]` block in globals.css. `swatch` is
// only used for the little preview dots in the ThemeSwitcher UI — the real
// colors live in CSS custom properties so the whole app (glass cards, glow
// blobs, gradients, QR code) reacts instantly when the theme changes.
//
// "void" is the original look VoidShare shipped with, and stays the default
// so nobody's experience changes unless they go looking for the switcher.

export const THEMES = [
  {
    id: "void",
    name: "Void",
    tagline: "The original — blood red meets deep space blue",
    swatch: ["#ef4444", "#2563eb", "#0a0a0b"],
    mode: "dark",
  },
  {
    id: "synthwave",
    name: "Neon Synthwave",
    tagline: "Magenta grids and electric cyan, straight out of 1986",
    swatch: ["#f472b6", "#22d3ee", "#0b0714"],
    mode: "dark",
  },
  {
    id: "abyssal-teal",
    name: "Abyssal Teal",
    tagline: "Deep-sea teal with a bioluminescent glow",
    swatch: ["#2dd4bf", "#818cf8", "#04100f"],
    mode: "dark",
  },
  {
    id: "solar-flare",
    name: "Solar Flare",
    tagline: "Amber and ember tones, warm as a dying star",
    swatch: ["#f59e0b", "#fb7185", "#120a02"],
    mode: "dark",
  },
  {
    id: "forest-whisper",
    name: "Forest Whisper",
    tagline: "Mossy greens and quiet gold, for late-night calm",
    swatch: ["#4ade80", "#eab308", "#08120a"],
    mode: "dark",
  },
  {
    id: "royal-amethyst",
    name: "Royal Amethyst",
    tagline: "Violet and champagne gold, dressed for the occasion",
    swatch: ["#a78bfa", "#facc15", "#0d0714"],
    mode: "dark",
  },
  {
    id: "arctic-frost",
    name: "Arctic Frost",
    tagline: "A crisp light theme — ice blue on soft white",
    swatch: ["#2563eb", "#0891b2", "#f4f7fb"],
    mode: "light",
  },
  {
    id: "sandstorm",
    name: "Sandstorm",
    tagline: "A warm light theme in terracotta and dune tan",
    swatch: ["#c2410c", "#0d9488", "#faf5ec"],
    mode: "light",
  },
];

export const DEFAULT_THEME = "void";
export const THEME_STORAGE_KEY = "voidshare-theme";
