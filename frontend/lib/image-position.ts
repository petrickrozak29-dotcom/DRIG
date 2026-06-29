export type ImagePosition = {
  x: number;
  y: number;
};

const DEFAULT_POSITION: ImagePosition = { x: 50, y: 50 };
const POSITION_PATTERN = /(?:#|&)mv-position=([0-9]+(?:\.[0-9]+)?),([0-9]+(?:\.[0-9]+)?)$/;

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, value));
}

export function splitImagePosition(value?: string | null) {
  const raw = String(value || '').trim();
  const match = raw.match(POSITION_PATTERN);

  if (!match || match.index === undefined) {
    return { src: raw, position: DEFAULT_POSITION };
  }

  return {
    src: raw.slice(0, match.index),
    position: {
      x: clampPercent(Number(match[1])),
      y: clampPercent(Number(match[2])),
    },
  };
}

export function getImageSrc(value?: string | null, fallback = '') {
  return splitImagePosition(value).src || fallback;
}

export function getImageObjectPosition(value?: string | null) {
  const { position } = splitImagePosition(value);
  return `${position.x}% ${position.y}%`;
}

export function withImagePosition(value: string, nextPosition: ImagePosition) {
  const { src } = splitImagePosition(value);
  const x = Math.round(clampPercent(nextPosition.x));
  const y = Math.round(clampPercent(nextPosition.y));
  const separator = src.includes('#') ? '&' : '#';

  return src ? `${src}${separator}mv-position=${x},${y}` : '';
}
