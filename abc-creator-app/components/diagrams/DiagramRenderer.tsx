"use client";

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
type Point = Node & { x: number; y: number };

const font = "Inter, Arial, Helvetica, sans-serif";

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
  return raw.map((edge) => {
    if (Array.isArray(edge)) return { from: text(edge[0], ""), to: text(edge[1], ""), label: edge[2] ? String(edge[2]) : undefined };
    return { from: text(edge.from || edge.source, ""), to: text(edge.to || edge.target, ""), label: edge.label };
  }).filter((edge) => edge.from && edge.to);
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

function wrap(label: string, max = 18) {
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
  return lines.slice(0, 4);
}

function layout(nodes: Node[], edges: Edge[], radial: boolean) {
  const width = 860;
  const height = radial ? 440 : Math.max(360, Math.ceil(nodes.length / 4) * 130 + 160);
  const points = new Map<string, Point>();

  if (radial) {
    const [first, ...rest] = nodes;
    points.set(first.id, { ...first, x: width / 2, y: height / 2 });
    rest.forEach((node, index) => {
      const angle = (Math.PI * 2 * index) / Math.max(rest.length, 1) - Math.PI / 2;
      points.set(node.id, { ...node, x: width / 2 + Math.cos(angle) * 320, y: height / 2 + Math.sin(angle) * 155 });
    });
    return { width, height, points };
  }

  const level = new Map(nodes.map((node, index) => [node.id, node.level ?? index]));
  edges.forEach((edge) => {
    const from = level.get(edge.from) || 0;
    level.set(edge.to, Math.max(level.get(edge.to) || 0, from + 1));
  });
  const levels = Array.from(new Set(Array.from(level.values()))).sort((a, b) => a - b);
  levels.forEach((item, levelIndex) => {
    const group = nodes.filter((node) => level.get(node.id) === item);
    const x = 90 + levelIndex * ((width - 180) / Math.max(levels.length - 1, 1));
    group.forEach((node, index) => {
      points.set(node.id, { ...node, x, y: 90 + index * ((height - 180) / Math.max(group.length - 1, 1)) });
    });
  });
  return { width, height, points };
}

function Box({ point, main = false }: { point: Point; main?: boolean }) {
  const lines = wrap(point.label);
  return (
    <g>
      <rect x={point.x - 70} y={point.y - 32} width="140" height="64" rx="14" fill={main ? "#F5F3FF" : "#FFFFFF"} stroke={main ? "#6D28D9" : "#A78BFA"} strokeWidth="1.4" />
      <text x={point.x} y={point.y - (lines.length - 1) * 6} textAnchor="middle" fill="#111827" fontFamily={font} fontSize="11" fontWeight="650">
        {lines.map((line, index) => <tspan key={`${point.id}-${index}`} x={point.x} dy={index ? 13 : 0}>{line}</tspan>)}
      </text>
    </g>
  );
}

function Graph({ spec, radial = false }: { spec: DiagramSpec; radial?: boolean }) {
  const nodes = getNodes(spec);
  const edges = getEdges(spec);
  const { width, height, points } = layout(nodes, edges, radial);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: "block", background: "#ffffff" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="22" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
      {edges.map((edge, index) => {
        const from = points.get(edge.from);
        const to = points.get(edge.to);
        if (!from || !to) return null;
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return (
          <g key={`${edge.from}-${edge.to}-${index}`}>
            <path d={`M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`} fill="none" stroke="#6D28D9" strokeOpacity="0.7" strokeWidth="1.8" />
            <circle cx={to.x} cy={to.y} r="3.2" fill="#6D28D9" />
            {edge.label ? <text x={midX} y={midY - 7} textAnchor="middle" fill="#4B5563" fontFamily={font} fontSize="10" fontWeight="600">{edge.label}</text> : null}
          </g>
        );
      })}
      {Array.from(points.values()).map((point, index) => <Box key={point.id} point={point} main={radial && index === 0} />)}
    </svg>
  );
}

function Sankey({ spec }: { spec: DiagramSpec }) {
  const flows = (spec.flows || spec.data?.flows || []).map((flow) => Array.isArray(flow) ? { from: text(flow[0], ""), to: text(flow[1], ""), value: Number(flow[2] || 1) } : { from: text(flow.from, ""), to: text(flow.to, ""), value: Number(flow.value || 1), label: flow.label }).filter((flow) => flow.from && flow.to);
  const data = flows.length ? flows : getEdges(spec).map((edge) => ({ from: edge.from, to: edge.to, value: 1, label: edge.label }));
  const left = Array.from(new Set(data.map((flow) => flow.from)));
  const right = Array.from(new Set(data.map((flow) => flow.to)));
  const width = 860;
  const height = Math.max(360, Math.max(left.length, right.length) * 88 + 120);
  const total = data.reduce((sum, flow) => sum + Math.max(flow.value || 1, 1), 0) || 1;
  const leftY = (index: number) => 80 + index * ((height - 160) / Math.max(left.length - 1, 1));
  const rightY = (index: number) => 80 + index * ((height - 160) / Math.max(right.length - 1, 1));
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: "block", background: "#ffffff" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="22" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
      {data.map((flow, index) => {
        const y1 = leftY(left.indexOf(flow.from));
        const y2 = rightY(right.indexOf(flow.to));
        const strokeWidth = 5 + Math.min(26, ((flow.value || 1) / total) * 90);
        return <path key={`${flow.from}-${flow.to}-${index}`} d={`M 170 ${y1} C 330 ${y1}, 530 ${y2}, 690 ${y2}`} fill="none" stroke="#7C3AED" strokeOpacity="0.32" strokeWidth={strokeWidth} strokeLinecap="round" />;
      })}
      {left.map((label, index) => <Box key={label} point={{ id: label, label, x: 100, y: leftY(index) }} />)}
      {right.map((label, index) => <Box key={label} point={{ id: label, label, x: 760, y: rightY(index) }} />)}
    </svg>
  );
}

function Erd({ spec }: { spec: DiagramSpec }) {
  const entities = spec.entities || spec.data?.entities || [];
  if (!entities.length) return <Graph spec={spec} />;
  const width = 860;
  const height = Math.max(360, Math.ceil(entities.length / 3) * 170 + 70);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="auto" style={{ display: "block", background: "#ffffff" }}>
      <rect x="1" y="1" width={width - 2} height={height - 2} rx="22" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1.2" />
      {entities.map((entity, index) => {
        const x = 54 + (index % 3) * 270;
        const y = 46 + Math.floor(index / 3) * 170;
        const name = entity.name || entity.label || entity.id || `Entity ${index + 1}`;
        return (
          <g key={`${name}-${index}`}>
            <rect x={x} y={y} width="220" height="126" rx="14" fill="#FFFFFF" stroke="#A78BFA" strokeWidth="1.3" />
            <rect x={x} y={y} width="220" height="38" rx="14" fill="#F5F3FF" stroke="#7C3AED" strokeWidth="1.3" />
            <text x={x + 14} y={y + 24} fill="#111827" fontFamily={font} fontSize="12" fontWeight="700">{name}</text>
            {(entity.fields || []).slice(0, 4).map((field, fieldIndex) => <text key={`${name}-${field}`} x={x + 14} y={y + 62 + fieldIndex * 18} fill="#4B5563" fontFamily={font} fontSize="10.5">{field}</text>)}
          </g>
        );
      })}
    </svg>
  );
}

export function DiagramRenderer({ spec }: { spec: DiagramSpec }) {
  const type = typeOfDiagram(spec.type);
  const radial = ["knowledge-graph", "node-link-diagram", "graph-visualization", "mind-map", "concept-map", "ontology"].includes(type);
  return (
    <div data-abc-diagram="true" style={{ margin: "28px 0", overflowX: "auto", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 18, padding: 16 }}>
      <div style={{ minWidth: 720, background: "#ffffff" }}>
        {type === "sankey" ? <Sankey spec={spec} /> : type === "erd" ? <Erd spec={spec} /> : <Graph spec={spec} radial={radial} />}
      </div>
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
