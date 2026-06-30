"use client";

import type { CSSProperties } from "react";

type NodeSpec = { id?: string; label?: string; level?: number; value?: number; score?: number; weight?: number };
type EdgeSpec = { from?: string; to?: string; source?: string; target?: string; label?: string };
type FlowSpec = { from?: string; to?: string; value?: number; label?: string };
type EntitySpec = { id?: string; name?: string; label?: string; fields?: string[] };

export type DiagramSpec = {
  type?: string;
  title?: string;
  caption?: string;
  metric?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  ringLabels?: string[];
  nodes?: Array<string | NodeSpec>;
  edges?: Array<[string, string, string?] | EdgeSpec>;
  flows?: Array<[string, string, number?] | FlowSpec>;
  entities?: EntitySpec[];
  data?: {
    nodes?: Array<string | NodeSpec>;
    edges?: Array<[string, string, string?] | EdgeSpec>;
    flows?: Array<[string, string, number?] | FlowSpec>;
    entities?: EntitySpec[];
  };
};

type Mode = "screen" | "export";
type Node = { id: string; label: string; value?: number };

const font = "Inter, Arial, Helvetica, sans-serif";
const colors = ["#0ea5e9", "#8b5cf6", "#10b981", "#ec4899", "#f59e0b", "#3b82f6", "#ef4444"];

const screenTheme = {
  "--abc-diagram-bg": "#04040a",
  "--abc-diagram-grid": "rgba(148,163,184,.14)",
  "--abc-diagram-text": "#f8fafc",
  "--abc-diagram-muted": "#cbd5e1",
  "--abc-diagram-border": "rgba(168,85,247,.36)",
  "--abc-diagram-card": "rgba(255,255,255,.045)",
  "--abc-diagram-soft-fill": "rgba(99,102,241,.16)",
} as CSSProperties;

const exportTheme = {
  "--abc-diagram-bg": "#fff",
  "--abc-diagram-grid": "rgba(100,116,139,.18)",
  "--abc-diagram-text": "#0f172a",
  "--abc-diagram-muted": "#475569",
  "--abc-diagram-border": "rgba(99,102,241,.24)",
  "--abc-diagram-card": "#ffffff",
  "--abc-diagram-soft-fill": "rgba(99,102,241,.10)",
} as CSSProperties;

function clean(value: unknown, fallback = "") {
  const result = String(value || "").trim();
  return result || fallback;
}

function short(value: string, max: number) {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;
}

function wrap(value: string, max = 16, maxLines = 3) {
  const lines: string[] = [];
  let line = "";
  value.split(/\s+/).forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

function valueOf(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function nodesOf(spec: DiagramSpec): Node[] {
  const nodes = (spec.nodes || spec.data?.nodes || []).map((node, index) => {
    if (typeof node === "string") return { id: node || `n${index}`, label: node || `Node ${index + 1}` };
    const id = clean(node.id || node.label, `n${index}`);
    return { id, label: clean(node.label || node.id, id), value: valueOf(node.value ?? node.score ?? node.weight) };
  });

  (spec.edges || spec.data?.edges || []).forEach((edge) => {
    const from = Array.isArray(edge) ? clean(edge[0]) : clean(edge.from || edge.source);
    const to = Array.isArray(edge) ? clean(edge[1]) : clean(edge.to || edge.target);
    if (from && !nodes.some((node) => node.id === from)) nodes.push({ id: from, label: from });
    if (to && !nodes.some((node) => node.id === to)) nodes.push({ id: to, label: to });
  });

  return nodes.length ? nodes : [{ id: "core", label: spec.title || "Core" }];
}

function LabelBox({ x, y, label, color, width = 150 }: { x: number; y: number; label: string; color: string; width?: number }) {
  return (
    <g>
      <rect x={x - width / 2} y={y - 22} width={width} height="50" rx="16" fill="var(--abc-diagram-card)" stroke={color} strokeOpacity=".34" />
      <text x={x} y={y - 4} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="10.5" fontWeight="760">
        {wrap(label, 18).map((line, index) => <tspan key={`${line}-${index}`} x={x} dy={index ? 12 : 0}>{line}</tspan>)}
      </text>
    </g>
  );
}

function Grid({ width, height }: { width: number; height: number }) {
  return (
    <g opacity="0.75">
      {Array.from({ length: 5 }).map((_, index) => {
        const y = 70 + index * ((height - 156) / 4);
        return <line key={`h-${index}`} x1="72" x2={width - 42} y1={y} y2={y} stroke="var(--abc-diagram-grid)" strokeWidth="1" />;
      })}
      {Array.from({ length: 7 }).map((_, index) => {
        const x = 92 + index * ((width - 134) / 6);
        return <line key={`v-${index}`} x1={x} x2={x} y1="56" y2={height - 72} stroke="var(--abc-diagram-grid)" strokeWidth="1" />;
      })}
    </g>
  );
}

function Chart({ spec }: { spec: DiagramSpec }) {
  const nodes = nodesOf(spec).slice(0, 10);
  const width = 860;
  const height = 376;
  const baseline = height - 84;
  const points = nodes.map((node, index) => {
    const value = typeof node.value === "number" ? Math.max(5, Math.min(100, node.value)) : 42 + ((index * 19) % 38);
    const x = 105 + (index * (width - 190)) / Math.max(nodes.length - 1, 1);
    return { ...node, x, y: 258 - value * 1.45, color: colors[index % colors.length] };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const lastPoint = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Chart"} style={{ display: "block" }}>
      <defs><linearGradient id="chartLine" x1="0" x2="1"><stop offset="0%" stopColor="#0ea5e9" /><stop offset="50%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#ec4899" /></linearGradient></defs>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      <Grid width={width} height={height} />
      <line x1="72" x2={width - 42} y1={baseline} y2={baseline} stroke="var(--abc-diagram-muted)" strokeOpacity=".42" />
      <line x1="72" x2="72" y1="56" y2={baseline} stroke="var(--abc-diagram-muted)" strokeOpacity=".42" />
      <path d={`${path} L ${lastPoint?.x || 105} ${baseline} L ${points[0]?.x || 105} ${baseline} Z`} fill="var(--abc-diagram-soft-fill)" />
      <path d={path} fill="none" stroke="url(#chartLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => <g key={point.id}><line x1={point.x} x2={point.x} y1={point.y + 10} y2={baseline} stroke={point.color} strokeOpacity=".28" strokeWidth="7" strokeLinecap="round" /><circle cx={point.x} cy={point.y} r="8" fill={point.color} /><text x={point.x} y={index % 2 === 0 ? baseline + 24 : 48} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="10.5" fontWeight="750">{wrap(point.label, points.length > 6 ? 11 : 15).map((line, lineIndex) => <tspan key={`${line}-${lineIndex}`} x={point.x} dy={lineIndex ? 12 : 0}>{line}</tspan>)}</text></g>)}
    </svg>
  );
}

function Network({ spec }: { spec: DiagramSpec }) {
  const nodes = nodesOf(spec).slice(0, 8);
  const width = 980;
  const height = 500;
  const cx = 405;
  const cy = 255;
  const radius = 170;
  const placed = nodes.map((node, index) => {
    if (index === 0) return { ...node, x: cx, y: cy, color: colors[1] };
    const angle = -Math.PI / 2 + (Math.PI * 2 * (index - 1)) / Math.max(nodes.length - 1, 1);
    return { ...node, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius, color: colors[index % colors.length] };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Network"} style={{ display: "block" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      {[70, 125, 180].map((ring) => <circle key={ring} cx={cx} cy={cy} r={ring} fill="none" stroke="var(--abc-diagram-grid)" strokeWidth="1" />)}
      {placed.slice(1).map((node) => <line key={`edge-${node.id}`} x1={cx} y1={cy} x2={node.x} y2={node.y} stroke="rgba(99,102,241,.34)" strokeWidth="2" />)}
      {placed.map((node, index) => <g key={node.id}><circle cx={node.x} cy={node.y} r={index === 0 ? 23 : 14} fill={node.color} /><LabelBox x={node.x} y={node.y + (index === 0 ? 54 : 36)} label={node.label} color={node.color} width={index === 0 ? 170 : 136} /></g>)}
    </svg>
  );
}

function Sankey({ spec }: { spec: DiagramSpec }) {
  const raw = spec.flows || spec.data?.flows || [];
  const flows = raw.map((flow) => Array.isArray(flow) ? { from: clean(flow[0]), to: clean(flow[1]), value: Number(flow[2] || 1) } : { from: clean(flow.from), to: clean(flow.to), value: Number(flow.value || 1) }).filter((flow) => flow.from && flow.to);
  if (!flows.length) return <Chart spec={spec} />;
  const left = Array.from(new Set(flows.map((flow) => flow.from))).slice(0, 6);
  const right = Array.from(new Set(flows.map((flow) => flow.to))).slice(0, 6);
  const width = 860;
  const height = Math.max(340, Math.max(left.length, right.length) * 56 + 110);
  const total = flows.reduce((sum, flow) => sum + Math.max(flow.value, 1), 0) || 1;
  const leftY = (i: number) => 78 + i * ((height - 160) / Math.max(left.length - 1, 1));
  const rightY = (i: number) => 78 + i * ((height - 160) / Math.max(right.length - 1, 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Sankey"} style={{ display: "block" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      <Grid width={width} height={height} />
      {flows.slice(0, 10).map((flow, index) => {
        const y1 = leftY(Math.max(0, left.indexOf(flow.from)));
        const y2 = rightY(Math.max(0, right.indexOf(flow.to)));
        return <path key={`${flow.from}-${flow.to}-${index}`} d={`M 190 ${y1} C 340 ${y1}, 520 ${y2}, 670 ${y2}`} fill="none" stroke={colors[index % colors.length]} strokeOpacity=".42" strokeWidth={6 + Math.min(30, (Math.max(flow.value, 1) / total) * 110)} strokeLinecap="round" />;
      })}
      {left.map((label, index) => <LabelBox key={label} x={109} y={leftY(index)} label={label} color={colors[index % colors.length]} width={126} />)}
      {right.map((label, index) => <LabelBox key={label} x={751} y={rightY(index)} label={label} color={colors[(index + 3) % colors.length]} width={126} />)}
    </svg>
  );
}

function Entities({ spec }: { spec: DiagramSpec }) {
  const entities = spec.entities || spec.data?.entities || [];
  if (!entities.length) return <Network spec={spec} />;
  const width = 860;
  const height = Math.max(340, Math.ceil(Math.min(entities.length, 6) / 3) * 150 + 80);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Entities"} style={{ display: "block" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      <Grid width={width} height={height} />
      {entities.slice(0, 6).map((entity, index) => {
        const x = 54 + (index % 3) * 270;
        const y = 50 + Math.floor(index / 3) * 150;
        const color = colors[index % colors.length];
        const name = entity.name || entity.label || entity.id || `Entity ${index + 1}`;
        return <g key={`${name}-${index}`}><rect x={x} y={y} width="220" height="118" rx="20" fill={color} fillOpacity=".11" stroke={color} strokeOpacity=".64" /><circle cx={x + 22} cy={y + 25} r="7" fill={color} /><text x={x + 40} y={y + 30} fill="var(--abc-diagram-text)" fontFamily={font} fontSize="12" fontWeight="800">{short(name, 24)}</text>{(entity.fields || []).slice(0, 4).map((field, fieldIndex) => <text key={`${name}-${field}`} x={x + 22} y={y + 58 + fieldIndex * 16} fill="var(--abc-diagram-muted)" fontFamily={font} fontSize="10.5" fontWeight="600">{short(field, 30)}</text>)}</g>;
      })}
    </svg>
  );
}

function visualFamily(spec: DiagramSpec): "sankey" | "entities" | "network" | "chart" {
  const type = (spec.type || "").toLowerCase();
  if (type.includes("sankey")) return "sankey";
  if (type.includes("erd") || spec.entities?.length || spec.data?.entities?.length) return "entities";
  if (type.includes("graph") || type.includes("tree") || type.includes("hierarchy") || type.includes("taxonomy") || type.includes("ontology") || type.includes("mind") || type.includes("concept") || type.includes("node-link")) return "network";
  return "chart";
}

export function DiagramRenderer({ spec, mode = "screen" }: { spec: DiagramSpec; mode?: Mode }) {
  const family = visualFamily(spec);
  const theme = mode === "export" ? exportTheme : screenTheme;

  return (
    <div data-abc-diagram="true" style={{ ...theme, margin: "28px 0", background: mode === "export" ? "#fff" : "linear-gradient(135deg, rgba(34,211,238,.08), rgba(168,85,247,.08), rgba(236,72,153,.06))", border: "1px solid var(--abc-diagram-border)", borderRadius: 22, padding: 18 }}>
      {family === "sankey" ? <Sankey spec={spec} /> : family === "entities" ? <Entities spec={spec} /> : family === "network" ? <Network spec={spec} /> : <Chart spec={spec} />}
    </div>
  );
}

export function parseDiagramSpec(raw: string): DiagramSpec | null {
  try {
    const parsed = JSON.parse(raw.trim()) as DiagramSpec;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}
