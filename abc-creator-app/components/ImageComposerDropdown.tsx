"use client";

import { useEffect, useRef, useState } from "react";

type Option = {
  label: string;
  value: string;
  meta?: string;
};

type Props = {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export function ImageComposerDropdown({ label, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (!rootRef.current || rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-[118px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group w-full rounded-xl bg-transparent px-2 py-1.5 text-left transition hover:bg-white/[0.045]"
      >
        <span className="block min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/75">{label}</span>
          <span className="mt-1 block truncate text-sm font-black text-white">{selected?.label || value}</span>
          {selected?.meta ? <span className="mt-0.5 block truncate text-[10px] font-bold text-slate-400">{selected.meta}</span> : null}
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+12px)] z-[9999] max-h-72 w-max min-w-[220px] overflow-y-auto rounded-2xl border border-white/20 bg-black/[0.78] p-1.5 shadow-2xl shadow-purple-950/40 backdrop-blur-2xl">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-start justify-between gap-4 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-white/[0.10] text-white" : "text-slate-300 hover:bg-white/[0.075] hover:text-white"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black">{option.label}</span>
                  {option.meta ? <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">{option.meta}</span> : null}
                </span>
                {active ? <span className="text-xs text-purple-200">●</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
