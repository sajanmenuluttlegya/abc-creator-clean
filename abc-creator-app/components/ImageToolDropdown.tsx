"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

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

type MenuPosition = {
  left: number;
  top: number;
  width: number;
};

export function ImageToolDropdown({ label, value, options, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.value === value) || options[0];

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;

      const menuWidth = Math.max(220, rect.width);
      const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - menuWidth - 12));
      const top = Math.min(rect.bottom + 10, Math.max(12, window.innerHeight - 300));

      setPosition({ left, top, width: menuWidth });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const menu = open && position ? createPortal(
    <div
      ref={menuRef}
      style={{ left: position.left, top: position.top, width: position.width }}
      className="fixed z-[2147483647] max-h-72 min-w-[220px] overflow-y-auto rounded-2xl border border-purple-300/20 bg-black/[0.90] p-1.5 shadow-2xl shadow-purple-950/50 backdrop-blur-2xl"
    >
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
    </div>,
    document.body
  ) : null;

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
      {menu}
    </div>
  );
}
