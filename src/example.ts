// example.ts
import type { Graph } from "./graph";
import { graphToSVG } from "./svg-export";

const g: Graph = {
  meta: { layout: "layered", theme: "light", arrowHeads: true, rounded: true, spacingX: 200, spacingY: 120 },
  nodes: [
    { id: "A", label: "Ingress" },
    { id: "B", label: "Auth" },
    { id: "C", label: "API" },
    { id: "D", label: "DB" },
    { id: "E", label: "Cache" },
  ],
  edges: [
    { from: "A", to: "B" },
    { from: "B", to: "C", label: "JWT" },
    { from: "C", to: "D" },
    { from: "C", to: "E", dashed: true, label: "fallback" },
  ],
};

const svg = graphToSVG(g);
// Write to file, inject into DOM, or feed to your RenderX canvas.
console.log(svg);
