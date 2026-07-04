"use client";

import { useState } from "react";

type Props = {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
  alt?: string;
  checkerboard?: boolean;
};

export function ImageBeforeAfterSlider({ beforeSrc, afterSrc, beforeLabel = "Before", afterLabel = "After", alt = "Before and after preview", checkerboard = false }: Props) {
  const [position, setPosition] = useState(50);

  return (
    <div className={`relative overflow-hidden rounded-[1.45rem] border border-white/10 ${checkerboard ? "bg-[linear-gradient(45deg,rgba(255,255,255,.08)_25%,transparent_25%,transparent_75%,rgba(255,255,255,.08)_75%),linear-gradient(45deg,rgba(255,255,255,.08)_25%,transparent_25%,transparent_75%,rgba(255,255,255,.08)_75%)] bg-[length:32px_32px] bg-[position:0_0,16px_16px]" : "bg-black/50"}`}>
      <img src={beforeSrc} alt={`${alt} before`} className="block w-full select-none object-contain" draggable={false} />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <img src={afterSrc} alt={`${alt} after`} className="block h-full w-full select-none object-contain" draggable={false} />
      </div>

      <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl">{afterLabel}</div>
      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-xl">{beforeLabel}</div>

      <div className="pointer-events-none absolute bottom-0 top-0 w-px bg-white/80 shadow-[0_0_24px_rgba(255,255,255,.65)]" style={{ left: `${position}%` }} />
      <div className="pointer-events-none absolute top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/55 text-white shadow-2xl backdrop-blur-xl" style={{ left: `${position}%` }}>↔</div>

      <input
        type="range"
        min="0"
        max="100"
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label="Move before and after comparison"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}
