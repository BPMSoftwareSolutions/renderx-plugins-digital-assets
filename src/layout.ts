// layout.ts
import type { Graph, Node } from "./graph";

export type Point = { x: number; y: number };
export type PositionedNode = Node & { x: number; y: number };
export type LayoutResult = { nodes: PositionedNode[] };

const defaultW = 120;
const defaultH = 48;

export function layoutGraph(g: Graph): LayoutResult {
  const { layout = "grid", spacingX = 180, spacingY = 120 } = g.meta ?? {};

  switch (layout) {
    case "radial":  return radial(g);
    case "layered": return layered(g, spacingX, spacingY);
    default:        return grid(g, spacingX, spacingY);
  }
}

function grid(g: Graph, spacingX: number, spacingY: number): LayoutResult {
  const cols = Math.ceil(Math.sqrt(g.nodes.length || 1));
  const nodes = g.nodes.map((n, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return withPos(n, col * spacingX, row * spacingY);
  });
  return { nodes };
}

function radial(g: Graph): LayoutResult {
  const R = 220;
  const cx = R + 20, cy = R + 20;
  const N = g.nodes.length || 1;
  const nodes = g.nodes.map((n, i) => {
    const t = (2 * Math.PI * i) / N;
    return withPos(n, cx + R * Math.cos(t), cy + R * Math.sin(t));
  });
  return { nodes };
}

function layered(g: Graph, spacingX: number, spacingY: number): LayoutResult {
  // Very small DAG-ish layering: rank by distance from sources.
  const indeg = new Map<string, number>();
  g.nodes.forEach(n => indeg.set(n.id, 0));
  g.edges.forEach(e => indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1));

  const ranks = new Map<string, number>();
  const q: string[] = g.nodes.filter(n => (indeg.get(n.id) ?? 0) === 0).map(n => n.id);

  q.forEach(id => ranks.set(id, 0));
  // BFS-ish propagation of ranks
  for (let i = 0; i < q.length; i++) {
    const u = q[i];
    const r = ranks.get(u) ?? 0;
    for (const e of g.edges.filter(e => e.from === u)) {
      const nr = Math.max(r + 1, ranks.get(e.to) ?? 0);
      if (nr !== ranks.get(e.to)) {
        ranks.set(e.to, nr);
        q.push(e.to);
      }
    }
  }

  // Group by rank
  const buckets = new Map<number, string[]>();
  for (const n of g.nodes) {
    const r = ranks.get(n.id) ?? 0;
    if (!buckets.has(r)) buckets.set(r, []);
    buckets.get(r)!.push(n.id);
  }

  const nodes = g.nodes.map(n => {
    const r = ranks.get(n.id) ?? 0;
    const siblings = buckets.get(r) ?? [];
    const i = siblings.indexOf(n.id);
    const x = r * spacingX;
    const y = i * spacingY;
    return withPos(n, x, y);
  });
  return { nodes };
}

function withPos(n: Node, x: number, y: number) {
  return { ...n, w: n.w ?? defaultW, h: n.h ?? defaultH, x, y };
}
