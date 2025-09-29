// scene.ts
export type Px = number;
export type NodeId = string;

export type Vec2 = { x: Px; y: Px };
export type Size = { width: Px; height: Px };
export type Anchor = "center"|"tl"|"tr"|"bl"|"br"|"l"|"r"|"t"|"b";

export type Style = Partial<{
  fill: string; stroke: string; strokeWidth: number; opacity: number;
  fontFamily: string; fontSize: number; fontWeight: number;
  filter: string; className: string;
}>;

export type Transform = Partial<{
  translate: Vec2; scale: { x: number; y: number } | number; rotate: number;  // degrees
  origin: Anchor | Vec2; // rotation/scale origin
}>;

export type SpriteRef = {
  // Either inline SVG string or a symbolId you've registered in <defs>
  inline?: string;
  symbolId?: string;      // e.g., "slide-01-manifest/plugin-package"
  viewBox?: { x: number; y: number; w: number; h: number };
};

export type Connector = {
  from: NodeId; to: NodeId;
  route?: "straight"|"orthogonal"|"curve";
  markerEnd?: "arrow"|"none";
  dashed?: boolean;
  label?: string;
  style?: Style;
  // Optional ports/anchors to attach to sides on each node
  fromAnchor?: Anchor; toAnchor?: Anchor;
};

export type Node =
  | { kind: "group"; id: NodeId; z?: number; at?: Vec2; size?: Size; style?: Style; transform?: Transform; children?: Node[] }
  | { kind: "sprite"; id: NodeId; z?: number; at: Vec2; size?: Size; anchor?: Anchor; sprite: SpriteRef; style?: Style; transform?: Transform }
  | { kind: "shape";  id: NodeId; z?: number; at: Vec2; size: Size; shape: "rect"|"roundedRect"|"circle"|"path"; d?: string; style?: Style; transform?: Transform }
  | { kind: "text";   id: NodeId; z?: number; at: Vec2; text: string; anchor?: Anchor; style?: Style; transform?: Transform };

export type Scene = {
  id: string;
  canvas: Size;
  bg?: string;
  defs?: { symbols?: Array<{ id: string; svg: string }>; filters?: string[]; gradients?: string[] };
  nodes: Node[];
  connectors?: Connector[];
};
