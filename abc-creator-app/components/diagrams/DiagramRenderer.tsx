"use client";

import type { CSSProperties } from "react";

type NodeSpec = { id?: string; label?: string; level?: number };
type EdgeSpec = { from?: string; to?: string; source?: string; target?: string; label?: string };
type FlowSpec = { from?: string; to?: string; value?: number; label?: string };
type EntitySpec = { id?: string; name?: string; label?: string; fields?: string[] };

export type DiagramSpec = {
  type?: string;
  title?: string;
  caption?: string;
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

type Node = { id: string; label: string; level?: number };
type Edge = { from: string; to: string; label?: string };
type ChartPoint = Node & { x: number; y: number; color: string; value: number };

const font = "Inter, Arial, Helvetica, sans-serif";

const colors = [
  "#22d3ee",
  "#a78bfa",
  "#34d399",
  "#f472b6",
  "#fbbf24",
  "#60a5fa",
  "#fb7185",
  "#4ade80",
];

const diagramThemeStyle = {
  "--abc-diagram-bg": "#04040a",
  "--abc-diagram-panel": "rgba(15, 23, 42, 0.76)",
  "--abc-diagram-grid": "rgba(148, 163, 184, 0.12)",
  "--abc-diagram-text": "#f8fafc",
  "--abc-diagram-muted": "#cbd5e1",
  "--abc-diagram-border": "rgba(168, 85, 247, 0.36)",
} as CSSProperties;

function typeOfDiagram(value?: string) {
  const type = (value || "graph").toLowerCase().replace(/[_\s]+/g, "-");
  if (type.includes("sankey")) return "sankey";
  if (type.includes("erd") || type.includes("entity-relationship")) return "erd";
  if (type.includes("mind")) return "mind-map";
  if (type.includes("concept")) return "concept-map";
  if (type.includes("knowledge")) return "knowledge-graph";
  if (type.includes("ontology")) return "ontology";
  if (type.includes("taxonomy")) return "taxonomy";
  if (type.includes("hierarchy")) return "hierarchy-chart";
  if (type.includes("tree")) return "tree-diagram";
  if (type.includes("flow")) return "flowchart";
  if (type.includes("dependency")) return "dependency-graph";
  if (type === "dag" || type.includes("acyclic")) return "dag";
  if (type.includes("data-lineage")) return "data-lineage";
  if (type.includes("lineage")) return "lineage-graph";
  if (type.includes("node-link")) return "node-link-diagram";
  return type;
}

function text(value: unknown, fallback: string) {
  const result = String(value || "").trim();
  return result || fallback;
}

function getEdges(spec: DiagramSpec): Edge[] {
  const raw = spec.edges || spec.data?.edges || [];
  return raw
    .map((edge) => {
      if (Array.isArray(edge)) {
        return {
          from: text(edge[0], ""),
          to: text(edge[1], ""),
          label: edge[2] ? String(edge[2]) : undefined,
        };
      }

      return {
        from: text(edge.from || edge.source, ""),
        to: text(edge.to || edge.target, ""),
        label: edge.label,
      };
    })
    .filter((edge) => edge.from && edge.to);
}

function getNodes(spec: DiagramSpec): Node[] {
  const raw = spec.nodes || spec.data?.nodes || [];
  const nodes = raw.map((node, index) => {
    if (typeof node === "string") return { id: text(node, `n${index}`), label: node };
    const id = text(node.id || node.label, `n${index}`);
    return { id, label: text(node.label || node.id, id), level: node.level };
  });

  getEdges(spec).forEach((edge) => {
    if (!nodes.some((node) => node.id === edge.from)) nodes.push({ id: edge.from, label: edge.from });
    if (!nodes.some((node) => node.id === edge.to)) nodes.push({ id: edge.to, label: edge.to });
  });

  return nodes.length ? nodes : [{ id: "core", label: spec.title || "Core concept" }];
}

function wrap(label: string, max = 16) {
  const lines: string[] = [];
  let current = "";

  label.split(/\s+/).forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > max && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 3);
}

function chartPoints(nodes: Node[]): ChartPoint[] {
  const width = 860;
  const usable = width - 150;
  const visible = nodes.slice(0, 10);
  const count = Math.max(visible.length - 1, 1);

  return visible.map((node, index) => {
    const wave = Math.sin(index * 1.25) * 34;
    const value = 42 + ((index * 23 + node.label.length * 7) % 44);
    return {
      ...node,
      x: 75 + (index * usable) / count,
      y: 235 - value - wave,
      color: colors[index % colors.length],
      value,
    };
  });
}

function Grid({ width, height }: { width: number; height: number }) {
  return (
    <g opacity="0.75">
      {Array.from({ length: 5 }).map((_, index) => {
        const y = 64 + index * ((height - 132) / 4);
        return <line key={`h-${index}`} x1="42" x2={width - 42} y1={y} y2={y} stroke="var(--abc-diagram-grid)" strokeWidth="1" />;
      })}
      {Array.from({ length: 7 }).map((_, index) => {
        const x = 48 + index * ((width - 96) / 6);
        return <line key={`v-${index}`} x1={x} x2={x} y1="50" y2={height - 54} stroke="var(--abc-diagram-grid)" strokeWidth="1" />;
      })}
    </g>
  );
}

function PremiumChart({ spec, radial = false }: { spec: DiagramSpec; radial?: boolean }) {
  const nodes = getNodes(spec);
  const edges = getEdges(spec);
  const points = chartPoints(nodes);
  const width = 860;
  const height = radial ? 420 : 360;
  const baseline = height - 84;
  const pointById = new Map(points.map((point) => [point.id, point]));
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${points.at(-1)?.x || 75} ${baseline} L ${points[0]?.x || 75} ${baseline} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Premium chart"} style={{ display: "block" }}>
      <defs>
        <linearGradient id="abcChartArea" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.3" />
          <stop offset="52%" stopColor="#8b5cf6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ec4899" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="abcChartStroke" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a78bfa" />
          <stop offset="100%" stopColor="#f472b6" />
        </linearGradient>
        <filter id="abcGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      <Grid width={width} height={height} />

      <path d={areaPath} fill="url(#abcChartArea)" />
      <path d={linePath} fill="none" stroke="url(#abcChartStroke)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#abcGlow)" />

      {edges.map((edge, index) => {
        const from = pointById.get(edge.from);
        const to = pointById.get(edge.to);
        if (!from || !to) return null;
        return (
          <path
            key={`${edge.from}-${edge.to}-${index}`}
            d={`M ${from.x} ${from.y} C ${(from.x + to.x) / 2} ${from.y - 36}, ${(from.x + to.x) / 2} ${to.y + 36}, ${to.x} ${to.y}`}
            fill="none"
            stroke={to.color}
            strokeOpacity="0.28"
            strokeWidth="2"
          />
        );
      })}

      {points.map((point, index) => {
        const lines = wrap(point.label, points.length > 6 ? 11 : 15);
        const labelY = index % 2 === 0 ? baseline + 28 : 38;
        return (
          <g key={point.id}>
            <line x1={point.x} x2={point.x} y1={point.y + 10} y2={baseline} stroke={point.color} strokeOpacity="0.28" strokeWidth="7" strokeLinecap="round" />
            <circle cx={point.x} cy={point.y} r="15" fill={point.color} fillOpacity="0.26" />
            <circle cx={point.x} cy={point.y} r="8" fill={point.color} filter="url(#abcGlow)" />
            <text x={point.x} y={labelY} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="11" fontWeight="750">
              {lines.map((line, lineIndex) => (
                <tspan key={`${point.id}-${lineIndex}`} x={point.x} dy={lineIndex ? 13 : 0}>{line}</tspan>
              ))}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Sankey({ spec }: { spec: DiagramSpec }) {
  const flows = (spec.flows || spec.data?.flows || [])
    .map((flow) => Array.isArray(flow)
      ? { from: text(flow[0], ""), to: text(flow[1], ""), value: Number(flow[2] || 1) }
      : { from: text(flow.from, ""), to: text(flow.to, ""), value: Number(flow.value || 1), label: flow.label })
    .filter((flow) => flow.from && flow.to);
  const data = flows.length ? flows : getEdges(spec).map((edge) => ({ from: edge.from, to: edge.to, value: 1, label: edge.label }));
  const left = Array.from(new Set(data.map((flow) => flow.from))).slice(0, 6);
  const right = Array.from(new Set(data.map((flow) => flow.to))).slice(0, 6);
  const width = 860;
  const height = Math.max(340, Math.max(left.length, right.length) * 56 + 110);
  const total = data.reduce((sum, flow) => sum + Math.max(flow.value || 1, 1), 0) || 1;
  const leftY = (index: number) => 70 + index * ((height - 140) / Math.max(left.length - 1, 1));
  const rightY = (index: number) => 70 + index * ((height - 140) / Math.max(right.length - 1, 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Sankey chart"} style={{ display: "block" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      <Grid width={width} height={height} />
      {data.slice(0, 10).map((flow, index) => {
        const y1 = leftY(Math.max(0, left.indexOf(flow.from)));
        const y2 = rightY(Math.max(0, right.indexOf(flow.to)));
        const strokeWidth = 6 + Math.min(30, ((flow.value || 1) / total) * 110);
        return <path key={`${flow.from}-${flow.to}-${index}`} d={`M 190 ${y1} C 340 ${y1}, 520 ${y2}, 670 ${y2}`} fill="none" stroke={colors[index % colors.length]} strokeOpacity="0.42" strokeWidth={strokeWidth} strokeLinecap="round" />;
      })}
      {left.map((label, index) => <Pill key={label} x={46} y={leftY(index) - 18} label={label} color={colors[index % colors.length]} />)}
      {right.map((label, index) => <Pill key={label} x={688} y={rightY(index) - 18} label={label} color={colors[(index + 3) % colors.length]} />)}
    </svg>
  );
}

function Pill({ x, y, label, color }: { x: number; y: number; label: string; color: string }) {
  const lines = wrap(label, 15);
  return (
    <g>
      <rect x={x} y={y} width="126" height="42" rx="21" fill={color} fillOpacity="0.16" stroke={color} strokeOpacity="0.72" />
      <text x={x + 63} y={y + 18 - (lines.length - 1) * 5} textAnchor="middle" fill="var(--abc-diagram-text)" fontFamily={font} fontSize="10.5" fontWeight="750">
        {lines.map((line, index) => <tspan key={`${label}-${index}`} x={x + 63} dy={index ? 11 : 0}>{line}</tspan>)}
      </text>
    </g>
  );
}

function Erd({ spec }: { spec: DiagramSpec }) {
  const entities = spec.entities || spec.data?.entities || [];
  if (!entities.length) return <PremiumChart spec={spec} />;
  const width = 860;
  const height = Math.max(340, Math.ceil(Math.min(entities.length, 6) / 3) * 150 + 80);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" role="img" aria-label={spec.title || "Entity chart"} style={{ display: "block" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="24" fill="var(--abc-diagram-bg)" stroke="var(--abc-diagram-border)" strokeWidth="1.2" />
      <Grid width={width} height={height} />
      {entities.slice(0, 6).map((entity, index) => {
        const x = 54 + (index % 3) * 270;
        const y = 50 + Math.floor(index / 3) * 150;
        const color = colors[index % colors.length];
        const name = entity.name || entity.label || entity.id || `Entity ${index + 1}`;
        return (
          <g key={`${name}-${index}`}>
            <rect x={x} y={y} width="220" height="118" rx="20" fill={color} fillOpacity="0.11" stroke={color} strokeOpacity="0.64" />
            <circle cx={x + 22} cy={y + 25} r="7" fill={color} />
            <text x={x + 40} y={y + 30} fill="var(--abc-diagram-text)" fontFamily={font} fontSize="12" fontWeight="800">{safeLabel(name, 24)}</text>
            {(entity.fields || []).slice(0, 4).map((field, fieldIndex) => (
              <text key={`${name}-${field}`} x={x + 22} y={y + 58 + fieldIndex * 16} fill="var(--abc-diagram-muted)" fontFamily={font} fontSize="10.5" fontWeight="600">
                {safeLabel(field, 30)}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function safeLabel(value: string, max: number) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

export function DiagramRenderer({ spec }: { spec: DiagramSpec }) {
  const type = typeOfDiagram(spec.type);
  const radial = ["knowledge-graph", "node-link-diagram", "graph-visualization", "mind-map", "concept-map", "ontology"].includes(type);

  return (
    <div
      data-abc-diagram="true"
      style={{
        ...diagramThemeStyle,
        margin: "28px 0",
        background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(168,85,247,0.08), rgba(236,72,153,0.06))",
        border: "1px solid var(--abc-diagram-border)",
        borderRadius: 22,
        padding: 14,
      }}
    >
      {type === "sankey" ? <Sankey spec={spec} /> : type === "erd" ? <Erd spec={spec} /> : <PremiumChart spec={spec} radial={radial} />}
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
