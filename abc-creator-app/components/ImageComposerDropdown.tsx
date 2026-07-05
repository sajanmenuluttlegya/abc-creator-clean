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
};

type MenuPosition = {
  left: number;
  top: number;
  width: number;
};

export function ImageComposerDropdown({ label, value, options, onChange }: Props) {
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
      const top = Math.min(rect.bottom + 12, Math.max(12, window.innerHeight - 300));

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
    function closeOnOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, []);

  const menu = open && position ? createPortal(
    <div
      ref={menuRef}
      style={{ left: position.left, top: position.top, width: position.width }}
      className="fixed z-[2147483647] max-h-72 min-w-[220px] overflow-y-auto rounded-2xl border border-white/20 bg-black/[0.90] p-1.5 shadow-2xl shadow-purple-950/50 backdrop-blur-2xl"
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
    </div>,
    document.body
  ) : null;

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
      {menu}
    </div>
  );
}
