"use client";

import { useEffect, useRef, useState } from "react";

type PremiumSelectProps = {
  id: string;
  value: string;
  options?: string[];
  required?: boolean;
  placeholder?: string;
  onChange: (id: string, value: string) => void;
};

export function PremiumSelect({ id, value, options = [], required = false, placeholder = "Select an option", onChange }: PremiumSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedLabel = value || placeholder;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const choose = (option: string) => {
    onChange(id, option);
    setIsOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <input aria-hidden="true" tabIndex={-1} value={value} required={required} onChange={() => {}} className="pointer-events-none absolute left-3 top-3 h-px w-px opacity-0" />
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-purple-400/25 bg-white/[0.055] px-4 py-3 text-left text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(0,0,0,0.22)] backdrop-blur-xl transition-all duration-300 hover:border-purple-300/45 hover:bg-white/[0.075] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-purple-400/70"
      >
        <span className={value ? "truncate text-white" : "truncate text-gray-400"}>{selectedLabel}</span>
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.045] text-xs text-purple-100 transition duration-300 ${isOpen ? "rotate-180 border-purple-300/30 bg-purple-400/10" : "group-hover:border-purple-300/25"}`}>⌄</span>
      </button>

      <div
        className={`absolute left-0 right-0 z-50 mt-2 origin-top overflow-hidden rounded-2xl border border-white/15 bg-black/70 shadow-2xl shadow-black/45 backdrop-blur-2xl transition-all duration-200 ${isOpen ? "pointer-events-auto translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.985] opacity-0"}`}
      >
        <div role="listbox" aria-labelledby={id} className="max-h-72 overflow-y-auto p-1.5">
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => choose("")}
            className={`flex w-full rounded-xl px-3 py-2.5 text-left text-sm transition duration-150 ${!value ? "bg-purple-500/25 text-white" : "text-gray-300 hover:bg-white/[0.07] hover:text-white"}`}
          >
            {placeholder}
          </button>
          {options.map((option) => {
            const selected = option === value;
            return (
              <button
                key={option}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => choose(option)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition duration-150 ${selected ? "bg-purple-500/30 text-white shadow-inner shadow-purple-500/10" : "text-gray-200 hover:bg-white/[0.07] hover:text-white"}`}
              >
                <span className="truncate">{option}</span>
                {selected ? <span className="text-xs text-purple-100">✓</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
