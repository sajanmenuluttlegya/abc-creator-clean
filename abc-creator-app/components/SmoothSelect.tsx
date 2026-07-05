"use client";

import { useState } from "react";

type SmoothSelectProps = {
  id: string;
  value: string;
  options?: string[];
  required?: boolean;
  onChange: (id: string, value: string) => void;
};

export function SmoothSelect({ id, value, options = [], required, onChange }: SmoothSelectProps) {
  const [open, setOpen] = useState(false);
  const label = value || "Select an option";

  return (
    <div
      className="relative"
      onBlur={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!nextTarget || !event.currentTarget.contains(nextTarget)) setOpen(false);
      }}
    >
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        data-required={required ? "true" : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-12 w-full cursor-pointer items-center justify-between rounded-[1.35rem] border border-purple-500/25 bg-white/[0.055] px-4 py-3 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_18px_45px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-200 hover:border-purple-300/45 hover:bg-white/[0.085] focus:outline-none focus:ring-2 focus:ring-purple-500/70"
      >
        <span className={value ? "text-white" : "text-slate-400"}>{label}</span>
        <span className={`ml-3 h-2.5 w-2.5 shrink-0 border-b-2 border-r-2 border-purple-100/85 transition-transform ${open ? "-rotate-135" : "rotate-45"}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-[80] mt-2 max-h-72 overflow-hidden rounded-[1.45rem] border border-purple-300/25 bg-[#07050d]/95 p-2 shadow-2xl shadow-purple-950/45 backdrop-blur-2xl">
          <div role="listbox" aria-labelledby={id} className="creator-output-scroll max-h-64 overflow-y-auto pr-1">
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(id, ""); setOpen(false); }}
              className={`block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${!value ? "bg-purple-400/20 text-white" : "text-slate-300 hover:bg-white/[0.075] hover:text-white"}`}
            >
              Select an option
            </button>
            {options.map((option) => (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={value === option}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => { onChange(id, option); setOpen(false); }}
                className={`mt-1 block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${value === option ? "bg-purple-500/30 text-white" : "text-slate-100 hover:bg-white/[0.075] hover:text-white"}`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
