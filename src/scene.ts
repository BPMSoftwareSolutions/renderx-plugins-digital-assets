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

export type Port = {
  id: string;
  nodeId: string;                // host node (or boundary) ID
  side: "left"|"right"|"top"|"bottom";
  offset: number;                // px from top/left along that side
};

export type Connector = {
  id?: string;
  from: NodeId | { port: string };
  to: NodeId | { port: string };
  route?: "straight"|"orthogonal"|"curve";
  markerEnd?: "arrow"|"none";
  dashed?: boolean;
  label?: string;
  style?: Style;
  // Optional ports/anchors to attach to sides on each node (legacy support)
  fromAnchor?: Anchor; toAnchor?: Anchor;
};

export type BoundaryPolicy = {
  mode: "strict" | "loose";          // strict = clamp/clip + errors; loose = warn only
  overflow: "clip" | "mask" | "resize" | "error";
  snap?: { grid: number; origin?: "local" | "parent"; }; // e.g., 4px grid snap
  tolerance?: number;                 // px before a drift is flagged (e.g., 2)
};

export type Flow = {
  id: string;
  path: string;                  // the connector.id sequence: "c1>c2>c3"
  token?: {                      // how the "energy" looks
    size?: number;               // circle radius
    color?: string;
    trail?: { length?: number; opacity?: number };
  };
  speed?: number;                // px/s along path length
  loop?: boolean;
  activate?: {                   // boundary/node highlight while token is inside
    boundaryIds?: string[];
    className?: string;          // CSS class applied during pass-through
  };
};

export type Node =
  | { kind: "group"; id: NodeId; z?: number; at?: Vec2; size?: Size; style?: Style; transform?: Transform; children?: Node[] }
  | { kind: "boundary"; id: NodeId; z?: number; at: Vec2; size: Size; title?: string; style?: Style & { labelColor?: string }; grid?: { cols: number; rowH: number; gutter: number; padding: number }; policy?: BoundaryPolicy; transform?: Transform; children?: Node[] }
  | { kind: "sprite"; id: NodeId; z?: number; at: Vec2; size?: Size; anchor?: Anchor; sprite: SpriteRef; style?: Style; transform?: Transform }
  | { kind: "shape";  id: NodeId; z?: number; at: Vec2; size: Size; shape: "rect"|"roundedRect"|"circle"|"path"; d?: string; style?: Style; transform?: Transform }
  | { kind: "text";   id: NodeId; z?: number; at: Vec2; text: string; anchor?: Anchor; style?: Style; transform?: Transform }
  | { kind: "raw-svg"; id: NodeId; z?: number; at: Vec2; size: Size; rawSvg: string; style?: Style; transform?: Transform };

/**
 * Scene timing configuration for coordinated animations
 */
export interface SceneTimingConfig {
  startTime: number;        // When scene becomes active (seconds)
  duration: number;         // How long scene stays active (seconds)
  busEnterTime: number;     // When bus enters this scene (seconds)
  busExitTime: number;      // When bus exits this scene (seconds)
  transitionDuration: number; // Overlap with next scene (seconds)
}

/**
 * Enhanced scene interface with optional timing configuration
 */
export type Scene = {
  id: string;
  canvas: Size;
  bg?: string;
  defs?: { symbols?: Array<{ id: string; svg: string }>; filters?: string[]; gradients?: string[]; rawSvg?: string[] };
  nodes: Node[];
  ports?: Port[];
  connectors?: Connector[];
  flows?: Flow[];
  timing?: SceneTimingConfig; // Optional timing configuration for coordinated animations
};
