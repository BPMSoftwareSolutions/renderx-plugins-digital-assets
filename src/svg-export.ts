// svg-export.ts
import type { Graph } from "./graph";
import { layoutGraph } from "./layout";

export function graphToSVG(g: Graph): string {
  const { margin = 24, theme = "light", rounded = true, arrowHeads = true } = g.meta ?? {};
  const { nodes } = layoutGraph(g);

  const byId = new Map(nodes.map(n => [n.id, n]));
  const edgePaths = g.edges.map((e) => {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b) return null;
    // Simple straight line center->center; easy to swap for orthogonal routing later
    const x1 = a.x + (a.w! / 2), y1 = a.y + (a.h! / 2);
    const x2 = b.x + (b.w! / 2), y2 = b.y + (b.h! / 2);
    const id = e.id ?? `${e.from}→${e.to}`;
    const dash = e.dashed ? ` stroke-dasharray="6 6"` : ``;
    const marker = arrowHeads ? ` marker-end="url(#arrow)"` : ``;
    const label = e.label ? `<text class="edge-label"><tspan>${escapeXml(e.label)}</tspan></text>` : ``;

    return `
      <g class="edge" data-id="${id}">
        <path d="M ${x1} ${y1} L ${x2} ${y2}" class="edge-line"${dash}${marker}/>
        ${label}
      </g>`;
  }).filter(Boolean).join("");

  const nodeRects = nodes.map(n => {
    const rx = rounded ? 8 : 0;
    const x = n.x, y = n.y, w = n.w!, h = n.h!;
    const label = n.label ?? n.id;
    return `
      <g class="node" data-id="${n.id}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}" class="node-rect"/>
        <text x="${x + w/2}" y="${y + h/2}" dominant-baseline="middle" text-anchor="middle" class="node-label">
          <tspan>${escapeXml(label)}</tspan>
        </text>
      </g>`;
  }).join("");

  // Compute canvas size
  const maxX = Math.max(...nodes.map(n => n.x + (n.w ?? 0))) + margin;
  const maxY = Math.max(...nodes.map(n => n.y + (n.h ?? 0))) + margin;
  const minX = Math.min(...nodes.map(n => n.x)) - margin;
  const minY = Math.min(...nodes.map(n => n.y)) - margin;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const palette = theme === "dark"
    ? { bg:"#0f1116", node:"#1f2430", stroke:"#8aa1b1", text:"#e6edf3", edge:"#9db7c7" }
    : { bg:"#ffffff", node:"#f7f8fa", stroke:"#334155", text:"#0f172a", edge:"#64748b" };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Graph">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="${palette.edge}"/>
    </marker>
    <style>
      .bg { fill: ${palette.bg}; }
      .node-rect { fill: ${palette.node}; stroke: ${palette.stroke}; stroke-width: 1; }
      .node-label { font: 12px/1.3 ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; fill: ${palette.text}; }
      .edge-line { fill: none; stroke: ${palette.edge}; stroke-width: 1.5; }
      .edge-label { font: 11px/1 ui-sans-serif, system-ui; fill: ${palette.edge}; }
    </style>
  </defs>
  <rect class="bg" x="${minX}" y="${minY}" width="${width}" height="${height}"/>
  <g class="edges">${edgePaths}</g>
  <g class="nodes">${nodeRects}</g>
</svg>`;
}

function escapeXml(s: string) {
  return s.replace(/[<>&'"]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[c]!));
}
