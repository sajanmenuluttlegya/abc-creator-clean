"use client";

type DiagramNode = {
  id: string;
  label: string;
  level?: number;
};

type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
};

type DiagramFlow = {
  from: string;
  to: string;
  value?: number;
  label?: string;
};

type DiagramEntity = {
  id?: string;
  name?: string;
  label?: string;
  fields?: string[];
};

export type DiagramSpec = {
  type?: string;
  title?: string;
  caption?: string;
  nodes?: Array<string | Partial<DiagramNode>>;
  edges?: Array<[string, string, string?] | Partial<DiagramEdge> & { source?: string; target?: string }>;
  flows?: Array<Partial<DiagramFlow> | [string, string, number?]>;
  entities?: DiagramEntity[];
  data?: {
    nodes?: DiagramSpec["nodes"];
    edges?: DiagramSpec["edges"];
    flows?: DiagramSpec["flows"];
    entities?: DiagramSpec["entities"];
  };
};

type Point = DiagramNode & { x: number; y: number };

function titleCase(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalizeType(value?: string) {
  const normalized = (value || "graph").toLowerCase().replace(/[_\s]+/g, "-");
  if (normalized.includes("sankey")) return "sankey";
  if (normalized.includes("erd") || normalized.includes("entity-relationship")) return "erd";
  if (normalized.includes("mind")) return "mind-map";
  if (normalized.includes("concept")) return "concept-map";
  if (normalized.includes("knowledge")) return "knowledge-graph";
  if (normalized.includes("ontology")) return "ontology";
  if (normalized.includes("taxonomy")) return "taxonomy";
  if (normalized.includes("hierarchy")) return "hierarchy-chart";
  if (normalized.includes("tree")) return "tree-diagram";
  if (normalized.includes("flow")) return "flowchart";
  if (normalized.includes("dependency")) return "dependency-graph";
  if (normalized === "dag" || normalized.includes("acyclic")) return "dag";
  if (normalized.includes("data-lineage")) return "data-lineage";
  if (normalized.includes("lineage")) return "lineage-graph";
  if (normalized.includes("node-link")) return "node-link-diagram";
  return normalized;
}

function nodeId(value: unknown, fallback: string) {
  return String(value || fallback).trim() || fallback;
}

function normalizeNodes(spec: DiagramSpec): DiagramNode[] {
  const rawNodes = spec.nodes || spec.data?.nodes || [];
  const nodes = rawNodes.map((node, index) => {
    if (typeof node === "string") return { id: nodeId(node, `node-${index + 1}`), label: node };
    const id = nodeId(node.id || node.label, `node-${index + 1}`);
    return { id, label: String(node.label || node.id || id), level: node.level };
  });

  const edges = normalizeEdges(spec);
  edges.forEach((edge) => {
    if (!nodes.some((node) => node.id === edge.from)) nodes.push({ id: edge.from, label: edge.from });
    if (!nodes.some((node) => node.id === edge.to)) nodes.push({ id: edge.to, label: edge.to });
  });

  return nodes.length ? nodes : [{ id: "core", label: spec.title || "Core concept" }];
}

function normalizeEdges(spec: DiagramSpec): DiagramEdge[] {
  const rawEdges = spec.edges || spec.data?.edges || [];
  return rawEdges
    .map((edge) => {
      if (Array.isArray(edge)) return { from: String(edge[0] || ""), to: String(edge[1] || ""), label: edge[2] ? String(edge[2]) : undefined };
      return {
        from: String(edge.from || edge.source || ""),
        to: String(edge.to || edge.target || ""),
        label: edge.label ? String(edge.label) : undefined,
      };
    })
    .filter((edge) => edge.from && edge.to);
}

function normalizeFlows(spec: DiagramSpec): DiagramFlow[] {
  const rawFlows = spec.flows || spec.data?.flows || [];
  return rawFlows
    .map((flow) => {
      if (Array.isArray(flow)) return { from: String(flow[0] || ""), to: String(flow[1] || ""), value: Number(flow[2] || 1) };
      return {
        from: String(flow.from || ""),
        to: String(flow.to || ""),
        value: Number(flow.value || 1),
        label: flow.label ? String(flow.label) : undefined,
      };
    })
    .filter((flow) => flow.from && flow.to);
}

function wrapSvgText(text: string, maxChars = 18) {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function getLevels(nodes: DiagramNode[], edges: DiagramEdge[]) {
  const incoming = new Map(nodes.map((node) => [node.id, 0]));
  const outgoing = new Map<string, string[]>();

  edges.forEach((edge) => {
    incoming.set(edge.to, (incoming.get(edge.to) || 0) + 1);
    outgoing.set(edge.from, [...(outgoing.get(edge.from) || []), edge.to]);
  });

  const levels = new Map<string, number>();
  nodes.forEach((node) => {
    if (typeof node.level === "number") levels.set(node.id, node.level);
  });

  const queue = nodes.filter((node) => (incoming.get(node.id) || 0) === 0);
  if (!queue.length && nodes[0]) queue.push(nodes[0]);

  queue.forEach((node) => {
    if (!levels.has(node.id)) levels.set(node.id, 0);
  });

  for (let index = 0; index < queue.length; index += 1) {
    const node = queue[index];
    const currentLevel = levels.get(node.id) || 0;
    (outgoing.get(node.id) || []).forEach((nextId) => {
      const nextLevel = Math.max(levels.get(nextId) || 0, currentLevel + 1);
      levels.set(nextId, nextLevel);
      const nextNode = nodes.find((item) => item.id === nextId);
      if (nextNode && !queue.some((item) => item.id === nextId)) queue.push(nextNode);
    });
  }

  nodes.forEach((node, index) => {
    if (!levels.has(node.id)) levels.set(node.id, Math.min(index, 3));
  });

  return levels;
}

function layoutLayered(nodes: DiagramNode[], edges: DiagramEdge[]) {
  const levels = getLevels(nodes, edges);
  const grouped = new Map<number, DiagramNode[]>();
  nodes.forEach((node) => {
    const level = levels.get(node.id) || 0;
    grouped.set(level, [...(grouped.get(level) || []), node]);
  });

  const levelKeys = Array.from(grouped.keys()).sort((a, b) => a - b);
  const width = Math.max(760, levelKeys.length * 190 + 120);
  const maxRows = Math.max(...Array.from(grouped.values()).map((items) => items.length), 1);
  const height = Math.max(320, maxRows * 92 + 120);
  const points = new Map<string, Point>();

  levelKeys.forEach((level, levelIndex) => {
    const items = grouped.get(level) || [];
    const x = 82 + levelIndex * ((width - 164) / Math.max(levelKeys.length - 1, 1));
    const gap = (height - 110) / Math.max(items.length, 1);
    items.forEach((node, index) => {
      points.set(node.id, { ...node, x, y: 64 + gap * index + gap / 2 });
    });
  });

  return { points, width, height };
}

function layoutRadial(nodes: DiagramNode[]) {
  const width = 780;
  const height = 420;
  const points = new Map<string, Point>();
  const [center, ...rest] = nodes;
  points.set(center.id, { ...center, x: width / 2, y: height / 2 });

  const radiusX = 290;
  const radiusY = 145;
  rest.forEach((node, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(rest.length, 1) - Math.PI / 2;
    points.set(node.id, {
      ...node,
      x: width / 2 + Math.cos(angle) * radiusX,
      y: height / 2 + Math.sin(angle) * radiusY,
    });
  });

  return { points, width, height };
}

function DiagramNodeBox({ point, accent = false }: { point: Point; accent?: boolean }) {
  const lines = wrapSvgText(point.label, 20);

  return (
    <g>
      <rect
        x={point.x - 62}
        y={point.y - 28}
        width="124"
        height="56"
        rx="14"
        className={accent ? "fill-purple-500/25 stroke-purple-300/70" : "fill-black/80 stroke-purple-300/35"}
        strokeWidth="1.2"
      />
      <text x={point.x} y={point.y - (lines.length - 1) * 6} textAnchor="middle" className="fill-white text-[11px] font-semibold">
        {lines.map((line, index) => (
          <tspan key={line} x={point.x} dy={index === 0 ? 0 : 13}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

function GraphSvg({ spec, radial }: { spec: DiagramSpec; radial?: boolean }) {
  const nodes = normalizeNodes(spec);
  const edges = normalizeEdges(spec);
  const { points, width, height } = radial ? layoutRadial(nodes) : layoutLayered(nodes, edges);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
      <defs>
        <marker id="abc-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" className="fill-purple-300" />
        </marker>
      </defs>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="18" className="fill-white/[0.03] stroke-white/10" />
      {edges.map((edge, index) => {
        const from = points.get(edge.from);
        const to = points.get(edge.to);
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return (
          <g key={`${edge.from}-${edge.to}-${index}`}>
            <path
              d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`}
              className="fill-none stroke-purple-300/55"
              strokeWidth="1.6"
              markerEnd="url(#abc-arrow)"
            />
            {edge.label ? (
              <text x={midX} y={midY - 6} textAnchor="middle" className="fill-purple-100 text-[10px]">
                {edge.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {Array.from(points.values()).map((point, index) => (
        <DiagramNodeBox key={point.id} point={point} accent={index === 0 && radial} />
      ))}
    </svg>
  );
}

function SankeySvg({ spec }: { spec: DiagramSpec }) {
  const flows = normalizeFlows(spec);
  const fallbackEdges = normalizeEdges(spec).map((edge) => ({ from: edge.from, to: edge.to, value: 1, label: edge.label }));
  const data = flows.length ? flows : fallbackEdges;
  const left = Array.from(new Set(data.map((flow) => flow.from)));
  const right = Array.from(new Set(data.map((flow) => flow.to)));
  const width = 780;
  const height = Math.max(330, Math.max(left.length, right.length, data.length) * 70 + 80);
  const total = data.reduce((sum, flow) => sum + Math.max(Number(flow.value || 1), 1), 0) || 1;
  const leftPos = new Map(left.map((item, index) => [item, { x: 90, y: 70 + index * ((height - 140) / Math.max(left.length - 1, 1)) }]));
  const rightPos = new Map(right.map((item, index) => [item, { x: width - 90, y: 70 + index * ((height - 140) / Math.max(right.length - 1, 1)) }]));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="18" className="fill-white/[0.03] stroke-white/10" />
      {data.map((flow, index) => {
        const from = leftPos.get(flow.from);
        const to = rightPos.get(flow.to);
        if (!from || !to) return null;
        const strokeWidth = 4 + Math.min(26, (Math.max(Number(flow.value || 1), 1) / total) * 80);
        return (
          <g key={`${flow.from}-${flow.to}-${index}`}>
            <path
              d={`M ${from.x + 62} ${from.y} C ${width / 2 - 100} ${from.y}, ${width / 2 + 100} ${to.y}, ${to.x - 62} ${to.y}`}
              className="fill-none stroke-purple-300/45"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {flow.label ? (
              <text x={width / 2} y={(from.y + to.y) / 2 - 7} textAnchor="middle" className="fill-purple-100 text-[10px]">
                {flow.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {left.map((label) => {
        const point = leftPos.get(label)!;
        return <DiagramNodeBox key={label} point={{ id: label, label, x: point.x, y: point.y }} />;
      })}
      {right.map((label) => {
        const point = rightPos.get(label)!;
        return <DiagramNodeBox key={label} point={{ id: label, label, x: point.x, y: point.y }} />;
      })}
    </svg>
  );
}

function EntitySvg({ spec }: { spec: DiagramSpec }) {
  const entities = spec.entities || spec.data?.entities || [];
  if (!entities.length) return <GraphSvg spec={spec} />;

  const width = 780;
  const boxWidth = 185;
  const maxFields = Math.max(...entities.map((entity) => entity.fields?.length || 1), 1);
  const boxHeight = Math.max(94, 48 + maxFields * 18);
  const height = Math.max(320, Math.ceil(entities.length / 3) * (boxHeight + 46) + 50);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[720px]">
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="18" className="fill-white/[0.03] stroke-white/10" />
      {entities.map((entity, index) => {
        const col = index % 3;
        const row = Math.floor(index / 3);
        const x = 54 + col * 245;
        const y = 40 + row * (boxHeight + 46);
        const name = entity.name || entity.label || entity.id || `Entity ${index + 1}`;
        const fields = entity.fields || [];
        return (
          <g key={`${name}-${index}`}>
            <rect x={x} y={y} width={boxWidth} height={boxHeight} rx="14" className="fill-black/80 stroke-purple-300/45" />
            <rect x={x} y={y} width={boxWidth} height="34" rx="14" className="fill-purple-500/20 stroke-purple-300/45" />
            <text x={x + 14} y={y + 22} className="fill-white text-[12px] font-bold">
              {name}
            </text>
            {fields.slice(0, 8).map((field, fieldIndex) => (
              <text key={field} x={x + 14} y={y + 54 + fieldIndex * 18} className="fill-gray-200 text-[10px]">
                {field}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function DiagramRenderer({ spec }: { spec: DiagramSpec }) {
  const type = normalizeType(spec.type);
  const title = spec.title || titleCase(type);
  const radial = ["knowledge-graph", "node-link-diagram", "graph-visualization", "mind-map", "concept-map", "ontology"].includes(type);

  return (
    <section className="my-7 overflow-hidden rounded-3xl border border-purple-400/25 bg-gradient-to-br from-purple-500/15 via-black/60 to-blue-500/10 p-5 shadow-2xl shadow-purple-950/20">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-purple-200">Interactive visual</p>
          <h3 className="mt-1 text-lg font-bold text-white">{title}</h3>
        </div>
        <span className="w-fit rounded-full border border-purple-300/25 bg-purple-500/15 px-3 py-1 text-xs font-semibold text-purple-100">
          {titleCase(type)}
        </span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-3">
        {type === "sankey" ? <SankeySvg spec={spec} /> : type === "erd" ? <EntitySvg spec={spec} /> : <GraphSvg spec={spec} radial={radial} />}
      </div>
      {spec.caption ? <p className="mt-3 text-xs leading-5 text-gray-300">{spec.caption}</p> : null}
    </section>
  );
}

export function parseDiagramSpec(raw: string): DiagramSpec | null {
  try {
    const parsed = JSON.parse(raw.trim()) as DiagramSpec;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}
