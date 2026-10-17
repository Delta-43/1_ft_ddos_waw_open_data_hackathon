import type { Map } from 'maplibre-gl';
import { PIN_CATEGORIES, type PinCategory } from './types';

/** Icon side in device pixels; registered at pixelRatio 2, so 32 CSS px on screen. */
const SIZE = 64;
const PIXEL_RATIO = 2;

/** Accent colour of each category's glyph and rim. */
const ACCENT: Record<PinCategory, string> = {
  landmark: '#e6c27a',
  museum: '#9ecbff',
  park: '#7fd1a8',
  generic: '#c8d6e8',
};

export const iconId = (category: PinCategory) => `pin-hex-${category}`;

/** Simple vector glyphs, drawn in a 64×64 box centred on (32, 32). */
const GLYPHS: Record<PinCategory, (ctx: CanvasRenderingContext2D) => void> = {
  landmark(ctx) {
    // Stepped spire, a nod to the Palace of Culture.
    ctx.beginPath();
    ctx.moveTo(32, 14);
    ctx.lineTo(36, 26);
    ctx.lineTo(39, 26);
    ctx.lineTo(41, 46);
    ctx.lineTo(23, 46);
    ctx.lineTo(25, 26);
    ctx.lineTo(28, 26);
    ctx.closePath();
    ctx.fill();
  },
  museum(ctx) {
    // Pediment, columns and base.
    ctx.beginPath();
    ctx.moveTo(32, 16);
    ctx.lineTo(46, 25);
    ctx.lineTo(18, 25);
    ctx.closePath();
    ctx.fill();
    for (const x of [21, 28, 35, 42]) ctx.fillRect(x - 1.5, 28, 3, 13);
    ctx.fillRect(18, 43, 28, 3);
  },
  park(ctx) {
    // Round tree crown on a trunk.
    ctx.beginPath();
    ctx.arc(32, 27, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(30, 34, 4, 12);
  },
  generic(ctx) {
    ctx.beginPath();
    ctx.arc(32, 32, 6, 0, Math.PI * 2);
    ctx.fill();
  },
};

/** Traces a pointy-top hexagon centred in the icon. */
function hexagonPath(ctx: CanvasRenderingContext2D, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = SIZE / 2 + radius * Math.cos(angle);
    const y = SIZE / 2 + radius * Math.sin(angle);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawIcon(category: PinCategory): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d')!;
  const accent = ACCENT[category];

  // Dark body with a soft outer glow and an accent rim.
  hexagonPath(ctx, 27);
  ctx.shadowColor = accent;
  ctx.shadowBlur = 6;
  ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = accent;
  ctx.stroke();

  ctx.fillStyle = accent;
  GLYPHS[category](ctx);
  return ctx.getImageData(0, 0, SIZE, SIZE);
}

/** Registers one hexagon icon per category with the map (idempotent). */
export function registerPinIcons(map: Map): void {
  for (const category of PIN_CATEGORIES) {
    const id = iconId(category);
    if (!map.hasImage(id)) map.addImage(id, drawIcon(category), { pixelRatio: PIXEL_RATIO });
  }
}
