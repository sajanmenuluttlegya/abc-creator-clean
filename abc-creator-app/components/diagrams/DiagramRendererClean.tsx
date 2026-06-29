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
  data?: { nodes?: Array<string | NodeSpec>; edges?: Array<[string, string, string?] | EdgeSpec>; flows?: Array<[string, string, number?] | FlowSpec>; entities?: EntitySpec[] };
};

type Node = { id: string; label: string; level?: number; value?: number };
type Edge = { from: string; to: string; label?: string };
type Mode = "screen" | "export";

type PlacedNode = Node & { x: number; y: number; color: string };

type TextAnchor = "start" | "middle" | "end";

const font = "Inter, Arial, Helvetica, sans-serif";
const colors = ["#0ea5e9", "#8b5cf6", "#10b981", "#ec4899", "#f59e0b", "#3b82f6", "#ef4444", "#14b8a6"];

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
  "--abc-diagram-card": "rgba(248,250,252,.95)",
  "--abc-diagram-soft-fill": "rgba(99,102,241,.10)",
} as CSSProperties;

function kind(value?: string) {
  const type = (value || "graph").toLowerCase().replace(/[_\s]+/g, "-");
  if (type.includes("sankey")) return "sankey";
  if (type.includes("erd") || type.includes("entity-relationship")) return "erd";
  if (type.includes("radar") || type.includes("spider") || type.includes("polygon")) return "radar";
  if (type.includes("flow")) return "workflow";
  if (type === "dag" || type.includes("acyclic") || type.includes("lineage") || type.includes("dependency") || type.includes("pipeline")) return "workflow";
  if (type.includes("taxonomy") || type.includes("hierarchy") || type.includes("tree") || type.includes("knowledge") || type.includes("node-link") || type.includes("mind") || type.includes("concept") || type.includes("ontology") || type.includes("graph")) return "network";
  return "chart";
}

function clean(value: unknown, fallback = "") {
  const result = String(value || "").trim();
  return result || fallback;
}

function valueOf(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
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

function edgesOf(spec: DiagramSpec): Edge[] {
  return (spec.edges || spec.data?.edges || [])
    .map((edge) => Array.isArray(edge)
      ? { from: clean(edge[0]), to: clean(edge[1]), label: edge[2] }
      : { from: clean(edge.from || edge.source), to: clean(edge.to || edge.target), label: edge.label })
    .filter((edge) => edge.from && edge.to);
}

function nodesOf(spec: DiagramSpec): Node[] {
  const nodes = (spec.nodes || spec.data?.nodes || []).map((node, index) => {
    if (typeof node === "string") return { id: node || `n${index}`, label: node || `Node ${index + 1}` };
    const id = clean(node.id || node.label, `n${index}`);
    return { id, label: clean(node.label || node.id, id), level: node.level, value: valueOf(node.value ?? node.score ?? node.weight) };
  });

  edgesOf(spec).forEach((edge) => {
    if (!nodes.some((node) => node.id === edge.from)) nodes.push({ id: edge.from, label: edge.from });
    if (!nodes.some((node) => node.id === edge.to)) nodes.push({ id: edge.to, label: edge.to });
  });

  return nodes.length ? nodes : [{ id: "core", label: spec.title || "Core" }];
}

function hasNumericValues(nodes: Node[]) {
  return nodes.some((node) => typeof node.value === "number");
}

function chooseVisualFamily(spec: DiagramSpec) {
  const family = kind(spec.type);
  if (family === "sankey") return "sankey";
  if (family === "erd") return "entity-cards";
  if (family === "radar") return hasNumericValues(nodesOf(spec)) ? "radar-polygon" : "radial-network";
  if (family === "workflow") return "workflow-strip";
  if (family === "network") return "radial-network";
  return "chart";
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

function AxisLabel({ x, y, rotate, children }: { x: number; y: number; rotate?: number; children: string }) {
  return <text x={x} y={y} transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined} textAnchor="middle" fill="var(--abc-diagram-muted)" fontFamily={font} fontSize="10" fontWeight="700">{children}</text>;
}

function labelBox(x: number, y: number, label: string, color: string, width = 160) {
  return (
    <g>
      <rect x={x - width / 2} y={y - 22} width={width} height="48" rx="16" fill="var(--abc-diagram-card)" stroke={color} strokeOpacity=".32" />
      <text x={x} y={y - 4} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="10.5" fontWeight="760">
        {wrap(label, 18).map((line, index) => <tspan key={`${line}-${index}`} x={x} dy={index ? 12 : 0}>{line}</tspan>)}
      </text>
    </g>
  );
}

function Workflow({ spec }: { spec: DiagramSpec }) {
  const nodes = nodesOf(spec).slice(0, 8);
  const width = 980;
  const height = 320;
  const y = 160;
  const start = 92;
  const end = width - 92;
  const points = nodes.map((node, index) => ({ ...node, x: start + (index * (end - start)) / Math.max(nodes.length - 1, 1), color: colors[index % colors.length] }));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Workflow"} style={{ display: "block" }}>
      <defs><marker id="flowArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="rgba(99,102,241,.82)" /></marker></defs>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      <line x1={start} x2={end} y1={y} y2={y} stroke="rgba(99,102,241,.32)" strokeWidth="5" strokeLinecap="round" />
      {points.slice(0, -1).map((point, index) => <line key={point.id} x1={point.x + 25} x2={points[index + 1].x - 25} y1={y} y2={y} stroke="rgba(99,102,241,.58)" strokeWidth="3" strokeLinecap="round" markerEnd="url(#flowArrow)" />)}
      {points.map((point, index) => {
        const top = index % 2 !== 0;
        const boxY = top ? 64 : 234;
        const endY = top ? boxY + 48 : boxY - 2;
        return <g key={point.id}><line x1={point.x} x2={point.x} y1={y} y2={endY} stroke={point.color} strokeOpacity=".36" strokeWidth="6" strokeLinecap="round" /><circle cx={point.x} cy={y} r="18" fill={point.color} fillOpacity=".22" /><circle cx={point.x} cy={y} r="9" fill={point.color} />{labelBox(point.x, boxY, point.label, point.color, 134)}</g>;
      })}
    </svg>
  );
}

function radialLabelPlacement(node: PlacedNode, cx: number, cy: number): { x: number; y: number; anchor: TextAnchor; baseline: "middle" | "hanging" } {
  const dx = node.x - cx;
  const dy = node.y - cy;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const offset = 29;

  if (absX > absY * 1.15) {
    return dx >= 0
      ? { x: node.x + offset, y: node.y - 5, anchor: "start", baseline: "hanging" }
      : { x: node.x - offset, y: node.y - 5, anchor: "end", baseline: "hanging" };
  }

  return dy >= 0
    ? { x: node.x, y: node.y + 28, anchor: "middle", baseline: "hanging" }
    : { x: node.x, y: node.y - 30, anchor: "middle", baseline: "middle" };
}

function Network({ spec }: { spec: DiagramSpec }) {
  const nodes = nodesOf(spec).slice(0, 8);
  const width = 980;
  const height = 500;
  const cx = 405;
  const cy = 255;
  const rings = [68, 128, 188];
  const ringLabels = (spec.ringLabels?.length ? spec.ringLabels : ["Core", "Direct links", "Outer context"]).slice(0, 3);
  const [core, ...rest] = nodes;
  const placed: PlacedNode[] = [
    { ...(core || { id: "core", label: spec.title || "Core" }), x: cx, y: cy, color: "#8b5cf6" },
    ...rest.map((node, index) => {
      const ring = Math.min(2, Math.max(1, node.level || (index < 3 ? 1 : 2)));
      const group = rest.filter((item, itemIndex) => Math.min(2, Math.max(1, item.level || (itemIndex < 3 ? 1 : 2))) === ring);
      const position = Math.max(0, group.findIndex((item) => item.id === node.id));
      const angle = -Math.PI / 2 + (Math.PI * 2 * position) / Math.max(group.length, 1);
      return { ...node, x: cx + Math.cos(angle) * rings[ring], y: cy + Math.sin(angle) * rings[ring], color: colors[index % colors.length] };
    }),
  ];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Network"} style={{ display: "block" }}>
      <defs><marker id="ringArrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10 Z" fill="rgba(99,102,241,.82)" /></marker></defs>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      {rings.map((ring) => <circle key={ring} cx={cx} cy={cy} r={ring} fill="none" stroke="var(--abc-diagram-grid)" strokeWidth="1" />)}
      {ringLabels.map((label, index) => {
        const startX = cx + rings[index];
        const startY = cy - 8;
        const endX = width - 340;
        const endY = 76 + index * 44;
        return <g key={`${label}-${index}`}><path d={`M ${startX} ${startY} L ${endX - 34} ${startY} L ${endX} ${endY}`} fill="none" stroke="rgba(99,102,241,.42)" strokeWidth="2" markerEnd="url(#ringArrow)" /><rect x={endX + 12} y={endY - 17} width="194" height="30" rx="15" fill="var(--abc-diagram-card)" stroke="rgba(99,102,241,.30)" /><text x={endX + 109} y={endY + 3} textAnchor="middle" fill="var(--abc-diagram-muted)" fontFamily={font} fontSize="10" fontWeight="760">{short(label, 24)}</text></g>;
      })}
      {placed.map((node, index) => <g key={`node-${node.id}`}><circle cx={node.x} cy={node.y} r={index === 0 ? 25 : 15} fill={node.color} fillOpacity={index === 0 ? .92 : .78} /><circle cx={node.x} cy={node.y} r={index === 0 ? 40 : 25} fill={node.color} fillOpacity=".12" /></g>)}
      {placed[0] ? <text x={cx} y={cy + 55} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="11" fontWeight="780">{wrap(placed[0].label, 18).map((line, index) => <tspan key={`${line}-${index}`} x={cx} dy={index ? 13 : 0}>{line}</tspan>)}</text> : null}
      {placed.slice(1).map((node) => {
        const label = radialLabelPlacement(node, cx, cy);
        return <text key={`label-${node.id}`} x={label.x} y={label.y} textAnchor={label.anchor} dominantBaseline={label.baseline} fill="var(--abc-diagram-text)" fontFamily={font} fontSize="10.2" fontWeight="760">{wrap(node.label, 15, 2).map((line, index) => <tspan key={`${node.id}-${index}`} x={label.x} dy={index ? 12 : 0}>{line}</tspan>)}</text>;
      })}
    </svg>
  );
}

function Radar({ spec }: { spec: DiagramSpec }) {
  const nodes = nodesOf(spec).slice(0, 8);
  const width = 860;
  const height = 438;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const radius = 130;
  const points = nodes.map((node, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(nodes.length, 1);
    const value = typeof node.value === "number" ? Math.max(5, Math.min(100, node.value)) / 100 : .65;
    return { ...node, x: cx + Math.cos(angle) * radius * value, y: cy + Math.sin(angle) * radius * value, lx: cx + Math.cos(angle) * (radius + 58), ly: cy + Math.sin(angle) * (radius + 58), color: colors[index % colors.length] };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Radar"} style={{ display: "block" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      {[.25, .5, .75, 1].map((item) => <g key={item}><circle cx={cx} cy={cy} r={radius * item} fill="none" stroke="var(--abc-diagram-grid)" strokeWidth="1" /><text x={cx + radius * item + 5} y={cy - 3} fill="var(--abc-diagram-muted)" fontFamily={font} fontSize="9" fontWeight="650">{Math.round(item * 100)}%</text></g>)}
      <text x={cx} y="34" textAnchor="middle" fill="var(--abc-diagram-muted)" fontFamily={font} fontSize="10" fontWeight="750">{spec.metric || spec.yAxisLabel || "Relative score"}</text>
      {points.map((point) => <line key={`axis-${point.id}`} x1={cx} y1={cy} x2={point.lx} y2={point.ly} stroke="var(--abc-diagram-grid)" strokeWidth="1" />)}
      <polygon points={points.map((point) => `${point.x},${point.y}`).join(" ")} fill="var(--abc-diagram-soft-fill)" stroke="#8b5cf6" strokeWidth="3" />
      {points.map((point) => <g key={point.id}><circle cx={point.x} cy={point.y} r="13" fill={point.color} fillOpacity=".24" /><circle cx={point.x} cy={point.y} r="7" fill={point.color} /><text x={point.lx} y={point.ly} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="10.5" fontWeight="750">{short(point.label, 18)}</text></g>)}
    </svg>
  );
}

function Chart({ spec }: { spec: DiagramSpec }) {
  const nodes = nodesOf(spec).slice(0, 10);
  const width = 860;
  const height = 376;
  const baseline = height - 84;
  const points = nodes.map((node, index) => {
    const value = typeof node.value === "number" ? Math.max(5, Math.min(100, node.value)) : 42 + ((index * 19 + (node.level || 0) * 11) % 38);
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
      <AxisLabel x={width / 2} y={height - 24}>{spec.xAxisLabel || "Dimension / category"}</AxisLabel>
      <AxisLabel x={24} y={height / 2} rotate={-90}>{spec.yAxisLabel || spec.metric || "Relative value"}</AxisLabel>
      <path d={`${path} L ${lastPoint?.x || 105} ${baseline} L ${points[0]?.x || 105} ${baseline} Z`} fill="var(--abc-diagram-soft-fill)" />
      <path d={path} fill="none" stroke="url(#chartLine)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => <g key={point.id}><line x1={point.x} x2={point.x} y1={point.y + 10} y2={baseline} stroke={point.color} strokeOpacity=".28" strokeWidth="7" strokeLinecap="round" /><circle cx={point.x} cy={point.y} r="8" fill={point.color} /><text x={point.x} y={index % 2 === 0 ? baseline + 24 : 48} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="10.5" fontWeight="750">{wrap(point.label, points.length > 6 ? 11 : 15).map((line, lineIndex) => <tspan key={`${line}-${lineIndex}`} x={point.x} dy={lineIndex ? 12 : 0}>{line}</tspan>)}</text></g>)}
    </svg>
  );
}

function Sankey({ spec }: { spec: DiagramSpec }) {
  const raw = spec.flows || spec.data?.flows || [];
  const flows = (raw.length ? raw : edgesOf(spec).map((edge) => ({ from: edge.from, to: edge.to, value: 1 })))
    .map((flow) => Array.isArray(flow) ? { from: clean(flow[0]), to: clean(flow[1]), value: Number(flow[2] || 1) } : { from: clean(flow.from), to: clean(flow.to), value: Number(flow.value || 1) })
    .filter((flow) => flow.from && flow.to);
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
      {left.map((label, index) => labelBox(109, leftY(index), label, colors[index % colors.length], 126))}
      {right.map((label, index) => labelBox(751, rightY(index), label, colors[(index + 3) % colors.length], 126))}
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

export function DiagramRenderer({ spec, mode = "screen" }: { spec: DiagramSpec; mode?: Mode }) {
  const family = chooseVisualFamily(spec);
  const theme = mode === "export" ? exportTheme : screenTheme;

  return (
    <div data-abc-diagram="true" style={{ ...theme, margin: "28px 0", background: mode === "export" ? "#fff" : "linear-gradient(135deg, rgba(34,211,238,.08), rgba(168,85,247,.08), rgba(236,72,153,.06))", border: "1px solid var(--abc-diagram-border)", borderRadius: 22, padding: 18 }}>
      {family === "workflow-strip" ? <Workflow spec={spec} /> : family === "sankey" ? <Sankey spec={spec} /> : family === "entity-cards" ? <Entities spec={spec} /> : family === "radar-polygon" ? <Radar spec={spec} /> : family === "radial-network" ? <Network spec={spec} /> : <Chart spec={spec} />}
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
