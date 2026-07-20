import type { Block } from './types';

const SIZE = 64;
let canvas: HTMLCanvasElement | undefined;
let linkEl: HTMLLinkElement | undefined;
let defaultHref: string | undefined;

function getLink(): HTMLLinkElement {
  if (!linkEl) {
    let el = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!el) {
      el = document.createElement('link');
      el.rel = 'icon';
      document.head.appendChild(el);
    }
    linkEl = el;
    defaultHref = el.href;
  }
  return linkEl;
}

function getCanvas(): HTMLCanvasElement {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
  }
  return canvas;
}

/** Draws a shrinking-pie "kitchen timer" icon representing time left in the block, and sets it as the tab favicon. */
export function drawFaviconClock(block: Block, now: number): void {
  const c = getCanvas();
  const ctx = c.getContext('2d');
  if (!ctx) return;

  const total = block.end - block.start;
  const remaining = Math.max(0, Math.min(1, (block.end - now) / total));
  const color = block.kind === 'work' ? '#e63946' : '#457b9d';
  const track = block.kind === 'work' ? '#f6d3d6' : '#d3e3ec';

  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const r = SIZE / 2 - 3;

  ctx.clearRect(0, 0, SIZE, SIZE);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = track;
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  const start = -Math.PI / 2;
  const end = start + remaining * Math.PI * 2;
  ctx.arc(cx, cy, r, start, end);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  getLink().href = c.toDataURL('image/png');
}

export function resetFavicon(): void {
  const link = getLink();
  if (defaultHref) link.href = defaultHref;
}
