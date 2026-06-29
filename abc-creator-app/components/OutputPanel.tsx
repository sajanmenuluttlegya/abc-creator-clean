"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import type { RecommendedNextAction } from "@/lib/tools/public-tools";
import {
  downloadOutput,
  type OutputDownloadFormat,
} from "@/lib/download/exportDocuments";
import { downloadHtmlOutput } from "@/lib/download/exportHtml";
import { DiagramRenderer, parseDiagramSpec, type DiagramSpec } from "./diagrams/DiagramRendererClean";
import {
  InlineImageBlock,
  splitOutputIntoImageSegments,
} from "./InlineImageBlocks";

type OutputPanelDownloadFormat = OutputDownloadFormat | "html";

type MarkdownDiagramSegment =
  | { type: "markdown"; content: string; id: string }
  | { type: "diagram"; id: string; spec: DiagramSpec | null };

interface OutputPanelProps {
  isLoading: boolean;
  output: string;
  recommendedNextActions?: RecommendedNextAction[];
  downloadFileBaseName?: string;
  toolSlug?: string;
  inputs?: Record<string, string>;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-5 mt-2 text-3xl font-bold text-white">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-4 mt-8 text-2xl font-bold text-white">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-3 mt-7 text-xl font-bold text-purple-100">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-sm leading-7 text-gray-200">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }) => <em className="text-purple-100">{children}</em>,
  ul: ({ children }) => (
    <ul className="mb-5 ml-5 list-disc space-y-2 text-sm leading-7 text-gray-200">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-6 ml-5 list-decimal space-y-3 text-sm leading-7 text-gray-200">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 marker:text-purple-300">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-purple-300 underline decoration-purple-400/40 underline-offset-4 hover:text-purple-200"
    >
      {children}
    </a>
  ),
};
