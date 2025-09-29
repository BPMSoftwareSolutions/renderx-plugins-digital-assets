// graph.ts
export type NodeId = string;

export interface Node {
  id: NodeId;
  label?: string;
  w?: number;  // default 120
  h?: number;  // default 48
  data?: Record<string, unknown>;
}

export interface Edge {
  id?: string;
  from: NodeId;
  to: NodeId;
  label?: string;
  dashed?: boolean;
}

export interface Graph {
  nodes: Node[];
  edges: Edge[];
  meta?: {
    layout?: "grid" | "radial" | "layered";
    spacingX?: number;
    spacingY?: number;
    margin?: number;
    theme?: "light" | "dark";
    rounded?: boolean;
    arrowHeads?: boolean;
  };
}
