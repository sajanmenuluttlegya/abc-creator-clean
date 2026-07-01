"use client";

import { useState, type ReactNode } from "react";

type Props = {
  content: string;
  renderContent: (content: string) => ReactNode;
};

export function SectionTools({ content, renderContent }: Props) {
  const [message, setMessage] = useState("");
  return (
    <div className="group/section relative rounded-2xl border border-transparent p-1 transition hover:border-cyan-300/20 hover:bg-white/[0.015]">
      <div data-export-ignore="true" className="pointer-events-none absolute left-3 top-3 z-20 opacity-0 transition group-hover/section:opacity-100">
        <div className="pointer-events-auto rounded-2xl border border-white/15 bg-black/80 p-2 shadow-xl shadow-black/30 backdrop-blur-md">
          <button type="button" onClick={() => setMessage("Section tools coming soon.")} className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-400/20">Section tools</button>
        </div>
      </div>
      {message ? <div data-export-ignore="true" className="mb-3 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs text-cyan-100">{message}</div> : null}
      {renderContent(content)}
    </div>
  );
}
