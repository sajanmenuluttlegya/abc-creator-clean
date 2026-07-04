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
  compact?: boolean;
};

export function ImageToolDropdown({ label, value, options, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (!rootRef.current || rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative min-w-[150px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`group flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.055] px-4 text-left text-white shadow-lg shadow-black/20 backdrop-blur-2xl transition hover:border-purple-300/30 hover:bg-white/[0.09] ${compact ? "py-2.5" : "py-3"}`}
      >
        <span className="min-w-0">
          <span className="block text-[10px] font-black uppercase tracking-[0.22em] text-purple-200/75">{label}</span>
          <span className="mt-1 block truncate text-sm font-bold text-white">{selected?.label || value}</span>
          {selected?.meta ? <span className="mt-0.5 block truncate text-[11px] font-semibold text-slate-400">{selected.meta}</span> : null}
        </span>
        <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border border-purple-300/20 bg-purple-500/10 text-xs text-purple-100 transition group-hover:bg-purple-500/20 ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+10px)] z-50 max-h-72 w-full min-w-[220px] overflow-y-auto rounded-2xl border border-purple-300/20 bg-black/[0.72] p-1.5 shadow-2xl shadow-purple-950/40 backdrop-blur-2xl">
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
                className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${active ? "bg-purple-500/20 text-white" : "text-slate-300 hover:bg-white/[0.08] hover:text-white"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-bold">{option.label}</span>
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
