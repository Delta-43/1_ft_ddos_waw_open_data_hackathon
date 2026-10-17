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
  air: '#6fd3ff',
  aed: '#ff6b6b',
  toilet: '#b9a2ff',
  event: '#ffb74d',
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
  air(ctx) {
    // Three wind lines of different lengths.
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = ctx.fillStyle;
    for (const [y, x2] of [[24, 42], [32, 46], [40, 38]]) {
      ctx.beginPath();
      ctx.moveTo(19, y);
      ctx.lineTo(x2, y);
      ctx.stroke();
    }
  },
  aed(ctx) {
    // Heart with a medical cross cut out of it.
    ctx.beginPath();
    ctx.moveTo(32, 45);
    ctx.bezierCurveTo(14, 33, 18, 17, 32, 25);
    ctx.bezierCurveTo(46, 17, 50, 33, 32, 45);
    ctx.fill();
    ctx.fillStyle = 'rgba(11, 18, 32, 0.92)';
    ctx.fillRect(30, 26, 4, 12);
    ctx.fillRect(26, 30, 12, 4);
  },
  toilet(ctx) {
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WC', 32, 33);
  },
  event(ctx) {
    // Five-pointed star.
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 6.5 : 14;
      const a = (Math.PI / 5) * i - Math.PI / 2;
      const x = 32 + r * Math.cos(a);
      const y = 33 + r * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
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
