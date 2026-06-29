'use client';

import { getImageObjectPosition, getImageSrc, splitImagePosition, withImagePosition } from '../lib/image-position';

type ImagePositionEditorProps = {
  value: string;
  onChange: (value: string) => void;
  alt: string;
  className?: string;
  previewClassName?: string;
};

export default function ImagePositionEditor({
  value,
  onChange,
  alt,
  className = '',
  previewClassName = 'h-48 w-full',
}: ImagePositionEditorProps) {
  const { position } = splitImagePosition(value);
  const src = getImageSrc(value);

  const updatePosition = (axis: 'x' | 'y', nextValue: string) => {
    onChange(
      withImagePosition(value, {
        ...position,
        [axis]: Number(nextValue),
      })
    );
  };

  if (!src) return null;

  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-950/70 p-3 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`${previewClassName} rounded-lg border border-slate-800 object-cover`}
        style={{ objectPosition: getImageObjectPosition(value) }}
      />
      <div className="mt-3 grid gap-3 text-xs font-semibold text-slate-300">
        <label className="grid gap-2">
          Geser horizontal
          <input
            type="range"
            min="0"
            max="100"
            value={position.x}
            onChange={(event) => updatePosition('x', event.target.value)}
            className="w-full accent-cyan-400"
          />
        </label>
        <label className="grid gap-2">
          Geser vertikal
          <input
            type="range"
            min="0"
            max="100"
            value={position.y}
            onChange={(event) => updatePosition('y', event.target.value)}
            className="w-full accent-cyan-400"
          />
        </label>
      </div>
    </div>
  );
}
