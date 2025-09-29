// render-svg.ts
import type { Scene, Node, Connector } from "./scene";

export function renderScene(scene: Scene): string {
  const defs = [
    ...(scene.defs?.gradients ?? []),
    ...(scene.defs?.filters ?? []),
    ...(scene.defs?.symbols ?? []).map(s => `<symbol id="${esc(s.id)}">${s.svg}</symbol>`)
  ].join("");

  // depth sort
  const allNodes = flatten(scene.nodes).sort((a,b) => (a.z ?? 0) - (b.z ?? 0));
  const nodeSvg = allNodes.map(n => emitNode(n)).join("");
  const connectors = (scene.connectors ?? []).map(c => emitConnector(c, allNodes)).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${scene.canvas.width}" height="${scene.canvas.height}" viewBox="0 0 ${scene.canvas.width} ${scene.canvas.height}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(scene.id)}">
  <defs>${defs}</defs>
  ${scene.bg ? `<rect x="0" y="0" width="100%" height="100%" fill="${scene.bg}"/>` : ""}
  ${connectors}
  ${nodeSvg}
</svg>`;
}

function flatten(nodes: Node[], parentAt = {x:0,y:0}): (Node & { _abs: {x:number;y:number} })[] {
  const out: any[] = [];
  for (const n of nodes) {
    const at = "at" in n && n.at ? { x: parentAt.x + n.at.x, y: parentAt.y + n.at.y } : parentAt;
    const nn: any = { ...n, _abs: at };
    out.push(nn);
    if (n.kind === "group" && n.children?.length) out.push(...flatten(n.children, at));
  }
  return out;
}

function emitNode(n: any): string {
  const t = transformAttr(n);
  const style = styleAttr(n.style);
  if (n.kind === "group") {
    // group wrapper for filter/class usage
    return `<g id="${esc(n.id)}"${t}${style}></g>`;
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
  return "";
}

function emitConnector(c: Connector, nodes: any[]): string {
  const A = nodes.find(n => n.id === c.from);
  const B = nodes.find(n => n.id === c.to);
  if (!A || !B) return "";
  const a = centerOf(A), b = centerOf(B);

  let d = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  if (c.route === "orthogonal") {
    d = `M ${a.x} ${a.y} L ${a.x} ${b.y} L ${b.x} ${b.y}`;
  } else if (c.route === "curve") {
    const mx = (a.x + b.x)/2;
    d = `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
  }
  const dash = c.dashed ? ` stroke-dasharray="6 6"` : "";
  const marker = (c.markerEnd === "arrow") ? ` marker-end="url(#arrowHead)"` : "";
  const style = styleAttr(c.style);

  return `<g class="connector">
    <defs>
      <marker id="arrowHead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0 L10 5 L0 10Z" fill="${c.style?.stroke ?? "#94a3b8"}"/>
      </marker>
    </defs>
    <path d="${d}" fill="none"${style}${dash}${marker}/>
    ${c.label ? `<text x="${(a.x+b.x)/2}" y="${(a.y+b.y)/2 - 6}" font-size="11" fill="#94a3b8" text-anchor="middle">${esc(c.label)}</text>` : ""}
  </g>`;
}

function centerOf(n: any){ const w=n.size?.width ?? 0, h=n.size?.height ?? 0; return { x: n._abs.x + w/2, y: n._abs.y + h/2 }; }
const esc = (s: string) => s.replace(/[&<>"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]!));
function styleAttr(s?: any){ if(!s) return ""; const kv = Object.entries(s).map(([k,v]) => `${camelToKebab(k)}:${v}`).join(";"); return kv ? ` style="${kv}"`:""; }
function transformAttr(n:any){ const t=n.transform, a=n._abs; const tx=(t?.translate?.x ?? 0)+a.x, ty=(t?.translate?.y ?? 0)+a.y; const sc=t?.scale ? (typeof t.scale==="number"?{x:t.scale,y:t.scale}:t.scale) : {x:1,y:1}; const rot=t?.rotate ?? 0; const parts=[`translate(${tx} ${ty})`, (sc.x!==1||sc.y!==1)?`scale(${sc.x} ${sc.y})`:"", rot?`rotate(${rot})`:""].filter(Boolean).join(" "); return parts?` transform="${parts}"`:""; }
function camelToKebab(s:string){return s.replace(/[A-Z]/g,m=>"-"+m.toLowerCase());}
