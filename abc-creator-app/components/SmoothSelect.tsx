"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type SmoothSelectProps = {
  id: string;
  value: string;
  options?: string[];
  required?: boolean;
  onChange: (id: string, value: string) => void;
};

type FloatingRect = {
  left: number;
  top: number;
  width: number;
  maxHeight: number;
};

export function SmoothSelect({ id, value, options = [], required, onChange }: SmoothSelectProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [floatingRect, setFloatingRect] = useState<FloatingRect | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const label = value || "Select an option";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom - 12;
      const spaceAbove = rect.top - 12;
      const maxHeight = Math.max(180, Math.min(320, Math.max(spaceBelow, spaceAbove)));
      const shouldOpenAbove = spaceBelow < 220 && spaceAbove > spaceBelow;
      setFloatingRect({
        left: rect.left,
        top: shouldOpenAbove ? Math.max(12, rect.top - maxHeight - 10) : rect.bottom + 10,
        width: rect.width,
        maxHeight,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      const root = rootRef.current;
      const menu = document.getElementById(`${id}-smooth-select-menu`);
      if (target && (root?.contains(target) || menu?.contains(target))) return;
      setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [id, open]);

  const menu = open && mounted && floatingRect ? createPortal(
    <div
      id={`${id}-smooth-select-menu`}
      className="fixed z-[2147483647] rounded-[1.45rem] border border-purple-300/25 bg-[#07050d]/98 p-2 shadow-[0_28px_90px_rgba(88,28,135,0.55)] backdrop-blur-2xl"
      style={{ left: floatingRect.left, top: floatingRect.top, width: floatingRect.width }}
    >
      <div role="listbox" aria-labelledby={id} className="creator-output-scroll overflow-y-auto pr-1" style={{ maxHeight: floatingRect.maxHeight - 20 }}>
        <button
          type="button"
          role="option"
          aria-selected={!value}
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
            onClick={() => { onChange(id, option); setOpen(false); }}
            className={`mt-1 block w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${value === option ? "bg-purple-500/30 text-white" : "text-slate-100 hover:bg-white/[0.075] hover:text-white"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
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
      {menu}
    </div>
  );
}
