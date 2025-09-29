// render-svg.ts
import type { Scene, Node, Connector, Port, Flow } from "./scene";
import { enforceBoundaries, type EnforcementResult } from "./boundary-enforcement";
import { collectContainmentRequirements, renderContainmentDefs, applyContainmentAttributes, needsContainment } from "./visual-containment";

export function renderScene(scene: Scene): string {
  // PASS 1: Validate and correct positions with boundary enforcement
  const enforcementResult = enforceBoundaries(scene);
  const correctedScene = enforcementResult.scene;

  // Collect containment requirements for clipPaths and masks
  const containmentContext = collectContainmentRequirements(correctedScene);

  // Build defs with original content plus containment definitions
  const defs = [
    ...(correctedScene.defs?.gradients ?? []),
    ...(correctedScene.defs?.filters ?? []),
    ...(correctedScene.defs?.symbols ?? []).map(s => `<symbol id="${esc(s.id)}">${s.svg}</symbol>`),
    renderContainmentDefs(containmentContext)
  ].join("");

  // PASS 2: Paint with containment
  // depth sort using corrected positions
  const allNodes = flattenWithContainment(correctedScene.nodes).sort((a,b) => (a.z ?? 0) - (b.z ?? 0));

  // Handle raw-svg nodes with USE_DEFS_RAWSVG
  let rawSvgContent = "";
  const filteredNodes = allNodes.filter(n => {
    if (n.kind === "raw-svg" && n.rawSvg === "USE_DEFS_RAWSVG") {
      // Inject rawSvg from defs directly into the main SVG content
      if (correctedScene.defs?.rawSvg) {
        rawSvgContent += correctedScene.defs.rawSvg.join('\n') + '\n';
      }
      return false; // Don't render this node normally
    }
    return true;
  });

  const nodeSvg = filteredNodes.map(n => emitNodeWithContainment(n)).join("");
  const connectors = (correctedScene.connectors ?? []).map(c => emitConnector(c, allNodes, correctedScene.ports ?? [])).join("");
  const flows = (correctedScene.flows ?? []).map(f => emitFlow(f, correctedScene.connectors ?? [], allNodes, correctedScene.ports ?? [])).join("");

  // Add CSS for animations and contextual boundaries
  const css = `
    <style>
      .active-glow rect { filter: url(#glow); stroke: #8b5cf6; }
      .connector { stroke-linecap: round; stroke-linejoin: round; }
      .boundary-title { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-weight: 600; }
      .flow-token { animation-fill-mode: forwards; }
      .boundary-contained { overflow: hidden; }
    </style>
  `;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${correctedScene.canvas.width}" height="${correctedScene.canvas.height}" viewBox="0 0 ${correctedScene.canvas.width} ${correctedScene.canvas.height}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(correctedScene.id)}">
  <defs>${defs}</defs>
  ${css}
  ${correctedScene.bg ? `<rect x="0" y="0" width="100%" height="100%" fill="${correctedScene.bg}"/>` : ""}
  ${rawSvgContent}
  ${connectors}
  ${nodeSvg}
  ${flows}
</svg>`;
}

// Export enforcement result for diagnostics
export function renderSceneWithDiagnostics(scene: Scene): { svg: string; diagnostics: EnforcementResult } {
  const enforcementResult = enforceBoundaries(scene);
  const svg = renderScene(scene);
  return { svg, diagnostics: enforcementResult };
}

// New flatten function that uses corrected positions from enforcement
function flattenWithContainment(nodes: Node[], parentAt = {x:0,y:0}): (Node & { _abs: {x:number;y:number} })[] {
  const out: any[] = [];
  for (const n of nodes) {
    // Use corrected absolute rectangle if available, otherwise fall back to original logic
    const at = (n as any)._absRect ?
      { x: (n as any)._absRect.x, y: (n as any)._absRect.y } :
      ("at" in n && n.at ? { x: parentAt.x + n.at.x, y: parentAt.y + n.at.y } : parentAt);

    const nn: any = { ...n, _abs: at };
    out.push(nn);

    if ((n.kind === "group" || n.kind === "boundary") && n.children?.length) {
      // Children are processed separately in boundary enforcement, so just flatten them
      out.push(...flattenWithContainment(n.children, at));
    }
  }
  return out;
}

// Legacy flatten function for backward compatibility
function flatten(nodes: Node[], parentAt = {x:0,y:0}): (Node & { _abs: {x:number;y:number} })[] {
  const out: any[] = [];
  for (const n of nodes) {
    const at = "at" in n && n.at ? { x: parentAt.x + n.at.x, y: parentAt.y + n.at.y } : parentAt;
    const nn: any = { ...n, _abs: at };
    out.push(nn);
    if ((n.kind === "group" || n.kind === "boundary") && n.children?.length) {
      // For boundary nodes, apply grid snapping to children
      if (n.kind === "boundary" && n.grid) {
        const snappedChildren = n.children.map(child => snapToGrid(child, n.grid!));
        out.push(...flatten(snappedChildren, at));
      } else {
        out.push(...flatten(n.children, at));
      }
    }
  }
  return out;
}

function snapToGrid(child: Node, grid: { cols: number; rowH: number; gutter: number; padding: number }): Node {
  if (!("at" in child) || !child.at) return child;

  const childSize = "size" in child ? child.size : undefined;
  const colWidth = (childSize?.width ?? 120) + grid.gutter;
  const col = Math.round((child.at.x - grid.padding) / colWidth);
  const row = Math.round((child.at.y - grid.padding) / grid.rowH);

  const snappedX = grid.padding + col * colWidth;
  const snappedY = grid.padding + row * grid.rowH;

  return { ...child, at: { x: snappedX, y: snappedY } };
}

// New emit function with containment support
function emitNodeWithContainment(n: any): string {
  const t = transformAttr(n);
  const style = styleAttr(n.style);

  if (n.kind === "group") {
    // group wrapper for filter/class usage
    return `<g id="${esc(n.id)}"${t}${style}></g>`;
  }

  if (n.kind === "boundary") {
    const { width, height } = n.size;
    const titleY = n._abs.y - 8; // Title above the boundary
    const labelColor = n.style?.labelColor ?? "#e6edf3";
    const filter = n.style?.filter ? ` filter="${n.style.filter}"` : ` filter="url(#laneShadow)"`;

    // Apply containment attributes if needed
    const containmentAttrs = needsContainment(n) ? ` ${applyContainmentAttributes(n)}` : "";
    const containmentClass = needsContainment(n) ? " boundary-contained" : "";

    return `<g id="${esc(n.id)}" class="boundary${containmentClass}"${containmentAttrs}>
      <rect x="${n._abs.x}" y="${n._abs.y}" width="${width}" height="${height}" rx="8"${style}${filter}/>
      ${n.title ? `<text x="${n._abs.x + 12}" y="${titleY}" class="boundary-title" fill="${labelColor}" font-size="14">${esc(n.title)}</text>` : ""}
    </g>`;
  }

  // For non-boundary nodes, use the original logic
  return emitNode(n);
}

// Legacy emit function for backward compatibility
function emitNode(n: any): string {
  const t = transformAttr(n);
  const style = styleAttr(n.style);
  if (n.kind === "group") {
    // group wrapper for filter/class usage
    return `<g id="${esc(n.id)}"${t}${style}></g>`;
  }
  if (n.kind === "boundary") {
    const { width, height } = n.size;
    const titleY = n._abs.y - 8; // Title above the boundary
    const labelColor = n.style?.labelColor ?? "#e6edf3";
    const filter = n.style?.filter ? ` filter="${n.style.filter}"` : ` filter="url(#laneShadow)"`;

    return `<g id="${esc(n.id)}" class="boundary">
      <rect x="${n._abs.x}" y="${n._abs.y}" width="${width}" height="${height}" rx="8"${style}${filter}/>
      ${n.title ? `<text x="${n._abs.x + 12}" y="${titleY}" class="boundary-title" fill="${labelColor}" font-size="14">${esc(n.title)}</text>` : ""}
    </g>`;
  }
  if (n.kind === "sprite") {
    const w = n.size?.width ?? 0, h = n.size?.height ?? 0;
    if (n.sprite.inline) {
      // Inline SVG content
      return `<g id="${esc(n.id)}"${t}${style}>${n.sprite.inline}</g>`;
    } else if (n.sprite.symbolId) {
      return `<use id="${esc(n.id)}"${t}${style} href="#${esc(n.sprite.symbolId)}" width="${w}" height="${h}"></use>`;
    }
  }
  if (n.kind === "shape") {
    const { width, height } = n.size;
    if (n.shape === "rect" || n.shape === "roundedRect") {
      const rx = n.shape === "roundedRect" ? 8 : 0;
      return `<rect id="${esc(n.id)}" x="${n._abs.x}" y="${n._abs.y}" width="${width}" height="${height}" rx="${rx}"${style}></rect>`;
    }
    if (n.shape === "circle") {
      return `<circle id="${esc(n.id)}" cx="${n._abs.x}" cy="${n._abs.y}" r="${width/2}"${style}></circle>`;
    }
    if (n.shape === "path") {
      return `<path id="${esc(n.id)}" d="${n.d ?? ""}"${style}></path>`;
    }
  }
  if (n.kind === "text") {
    const anchor = n.anchor ?? "tl";
    const ta = (anchor === "center") ? ` text-anchor="middle" dominant-baseline="middle"` : "";
    return `<text id="${esc(n.id)}" x="${n._abs.x}" y="${n._abs.y}"${style}${ta}>${esc(n.text)}</text>`;
  }
  if (n.kind === "raw-svg") {
    // Handle raw SVG content
    let svgContent = n.rawSvg;

    // Special case: USE_DEFS_RAWSVG means use the rawSvg from scene defs
    if (svgContent === "USE_DEFS_RAWSVG") {
      // This will be handled in the main render function
      return `<!-- raw-svg placeholder for ${esc(n.id)} -->`;
    }

    return `<g id="${esc(n.id)}"${t}${style}>${svgContent}</g>`;
  }
  return "";
}

function emitConnector(c: Connector, nodes: any[], ports: Port[]): string {
  let a: {x: number, y: number}, b: {x: number, y: number};

  // Handle port-based connections
  if (typeof c.from === "object" && c.from && "port" in c.from) {
    const port = ports.find(p => p.id === (c.from as { port: string }).port);
    if (!port) return "";
    a = getPortPosition(port, nodes);
  } else {
    const A = nodes.find(n => n.id === c.from as string);
    if (!A) return "";
    a = centerOf(A);
  }

  if (typeof c.to === "object" && c.to && "port" in c.to) {
    const port = ports.find(p => p.id === (c.to as { port: string }).port);
    if (!port) return "";
    b = getPortPosition(port, nodes);
  } else {
    const B = nodes.find(n => n.id === c.to as string);
    if (!B) return "";
    b = centerOf(B);
  }

  let d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  if (c.route === "orthogonal") {
    // Manhattan routing with midpoint
    const midX = (a.x + b.x) / 2;
    d = `M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`;
  } else if (c.route === "curve") {
    const mx = (a.x + b.x)/2;
    d = `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
  }

  const dash = c.dashed ? ` stroke-dasharray="6 6"` : "";
  const marker = (c.markerEnd === "arrow") ? ` marker-end="url(#arrowHead)"` : "";
  const style = styleAttr(c.style);
  const connectorId = c.id ?? `${typeof c.from === "string" ? c.from : c.from.port}-${typeof c.to === "string" ? c.to : c.to.port}`;

  return `<g class="connector" id="${esc(connectorId)}">
    <defs>
      <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10Z" fill="${c.style?.stroke ?? "#94a3b8"}"/>
      </marker>
    </defs>
    <path d="${d}" fill="none"${style}${dash}${marker}/>
    ${c.label ? `<text x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2 - 6}" font-size="11" fill="#94a3b8" text-anchor="middle">${esc(c.label)}</text>` : ""}
  </g>`;
}

function getPortPosition(port: Port, nodes: any[]): {x: number, y: number} {
  const node = nodes.find(n => n.id === port.nodeId);
  if (!node) return {x: 0, y: 0};

  const { width = 0, height = 0 } = node.size ?? {};
  const { x, y } = node._abs;

  switch (port.side) {
    case "left":
      return { x, y: y + port.offset };
    case "right":
      return { x: x + width, y: y + port.offset };
    case "top":
      return { x: x + port.offset, y };
    case "bottom":
      return { x: x + port.offset, y: y + height };
    default:
      return { x: x + width/2, y: y + height/2 };
  }
}

function emitFlow(flow: Flow, connectors: Connector[], nodes: any[], ports: Port[]): string {
  // Parse the flow path (e.g., "c1>c2>c3")
  const connectorIds = flow.path.split('>');
  const pathSegments: string[] = [];

  for (const connectorId of connectorIds) {
    const connector = connectors.find(c => c.id === connectorId);
    if (!connector) continue;

    // Get the path for this connector
    let a: {x: number, y: number}, b: {x: number, y: number};

    if (typeof connector.from === "object" && connector.from && "port" in connector.from) {
      const port = ports.find(p => p.id === (connector.from as { port: string }).port);
      if (!port) continue;
      a = getPortPosition(port, nodes);
    } else {
      const A = nodes.find(n => n.id === connector.from as string);
      if (!A) continue;
      a = centerOf(A);
    }

    if (typeof connector.to === "object" && connector.to && "port" in connector.to) {
      const port = ports.find(p => p.id === (connector.to as { port: string }).port);
      if (!port) continue;
      b = getPortPosition(port, nodes);
    } else {
      const B = nodes.find(n => n.id === connector.to as string);
      if (!B) continue;
      b = centerOf(B);
    }

    if (connector.route === "orthogonal") {
      const midX = (a.x + b.x) / 2;
      pathSegments.push(`M ${a.x} ${a.y} L ${midX} ${a.y} L ${midX} ${b.y} L ${b.x} ${b.y}`);
    } else {
      pathSegments.push(`M ${a.x} ${a.y} L ${b.x} ${b.y}`);
    }
  }

  if (pathSegments.length === 0) return "";

  const fullPath = pathSegments.join(" ");
  const tokenSize = flow.token?.size ?? 4;
  const tokenColor = flow.token?.color ?? "#d6bcfa";
  const speed = flow.speed ?? 160;
  const loop = flow.loop ? "infinite" : "1";

  // Calculate animation duration based on path length and speed
  // This is a rough approximation - in a real implementation you'd measure the actual path
  const estimatedLength = pathSegments.length * 200; // rough estimate
  const duration = estimatedLength / speed;

  return `<g class="flow" id="${esc(flow.id)}">
    <path d="${fullPath}" fill="none" stroke="none" id="${esc(flow.id)}-path"/>
    <circle r="${tokenSize}" fill="${tokenColor}" class="flow-token">
      <animateMotion dur="${duration}s" repeatCount="${loop}" rotate="auto">
        <mpath href="#${esc(flow.id)}-path"/>
      </animateMotion>
    </circle>
  </g>`;
}

function centerOf(n: any){ const w=n.size?.width ?? 0, h=n.size?.height ?? 0; return { x: n._abs.x + w/2, y: n._abs.y + h/2 }; }
const esc = (s: string) => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]!));
function styleAttr(s?: any){ if(!s) return ""; const kv = Object.entries(s).map(([k,v]) => `${camelToKebab(k)}:${v}`).join(";"); return kv ? ` style="${kv}"`:""; }
function transformAttr(n:any){ const t=n.transform, a=n._abs; const tx=(t?.translate?.x ?? 0)+a.x, ty=(t?.translate?.y ?? 0)+a.y; const sc=t?.scale ? (typeof t.scale==="number"?{x:t.scale,y:t.scale}:t.scale) : {x:1,y:1}; const rot=t?.rotate ?? 0; const parts=[`translate(${tx} ${ty})`, (sc.x!==1||sc.y!==1)?`scale(${sc.x} ${sc.y})`:"", rot?`rotate(${rot})`:""].filter(Boolean).join(" "); return parts?` transform="${parts}"`:""; }
function camelToKebab(s:string){return s.replace(/[A-Z]/g,m=>"-"+m.toLowerCase());}
