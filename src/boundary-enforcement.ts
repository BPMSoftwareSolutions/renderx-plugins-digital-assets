// boundary-enforcement.ts
import type { Scene, Node, BoundaryPolicy, Port, Connector } from './scene';

export type Rect = { x: number; y: number; w: number; h: number };
export type Pt = { x: number; y: number };

export type Diagnostic = {
  code: "OUT_OF_BOUNDS" | "NEG_SIZE" | "PORT_OUTSIDE" | "CONNECTOR_LEAK";
  nodeId: string;
  boundaryId: string;
  severity: "error" | "warning";
  message: string;
  actual?: any;
  suggestedFix?: any;
};

export type EnforcementResult = {
  scene: Scene;
  diagnostics: Diagnostic[];
  summary: { errors: number; warnings: number };
};

// Default boundary policy
export const DEFAULT_BOUNDARY_POLICY: BoundaryPolicy = {
  mode: "strict",
  overflow: "clip",
  snap: { grid: 2, origin: "local" },
  tolerance: 1
};

// Utility functions for rectangle operations
export function rectOfBoundary(b: Node & { kind: "boundary" }): Rect {
  return { x: b.at.x, y: b.at.y, w: b.size.width, h: b.size.height };
}

export function snap(v: number, grid = 1): number {
  return Math.round(v / grid) * grid;
}

export function clampTo(container: Rect, child: Rect): Rect {
  const x = Math.max(container.x, Math.min(child.x, container.x + container.w - child.w));
  const y = Math.max(container.y, Math.min(child.y, container.y + container.h - child.h));
  return { x, y, w: child.w, h: child.h };
}

export function contains(container: Rect, child: Rect, tolerance = 0): boolean {
  return child.x >= container.x - tolerance &&
         child.y >= container.y - tolerance &&
         child.x + child.w <= container.x + container.w + tolerance &&
         child.y + child.h <= container.y + container.h + tolerance;
}

export function getNodeRect(node: Node, parentAbs: Pt): Rect {
  const nx = parentAbs.x + (node.at ? node.at.x : 0);
  const ny = parentAbs.y + (node.at ? node.at.y : 0);
  
  // Infer width/height based on node type
  let w = 0, h = 0;
  if ('size' in node && node.size) {
    w = node.size.width || 0;
    h = node.size.height || 0;
  } else if (node.kind === 'text') {
    // Fallback dimensions for text nodes
    w = (node.text?.length || 0) * 8; // rough estimate
    h = 16;
  }
  
  return { x: nx, y: ny, w, h };
}

export function applyBoundaryPolicy(
  rect: Rect, 
  boundary: Node & { kind: "boundary" }, 
  policy: BoundaryPolicy,
  diagnostics: Diagnostic[],
  nodeId: string
): Rect {
  const boundaryRect = rectOfBoundary(boundary);
  const tolerance = policy.tolerance ?? 0;
  const isInside = contains(boundaryRect, rect, tolerance);
  
  if (!isInside) {
    diagnostics.push({
      code: "OUT_OF_BOUNDS",
      nodeId,
      boundaryId: boundary.id,
      severity: policy.mode === "strict" ? "error" : "warning",
      message: `Node '${nodeId}' escapes boundary '${boundary.id}'.`,
      actual: { rect, boundary: boundaryRect },
      suggestedFix: { at: { x: Math.max(boundaryRect.x, Math.min(rect.x, boundaryRect.x + boundaryRect.w - rect.w)), y: Math.max(boundaryRect.y, Math.min(rect.y, boundaryRect.y + boundaryRect.h - rect.h)) } }
    });
    
    if (policy.mode === "strict") {
      if (policy.overflow === "clip" || policy.overflow === "resize") {
        const clamped = clampTo(boundaryRect, rect);
        if (policy.overflow === "resize") {
          const newW = Math.min(rect.w, boundaryRect.x + boundaryRect.w - clamped.x);
          const newH = Math.min(rect.h, boundaryRect.y + boundaryRect.h - clamped.y);
          return { ...clamped, w: newW, h: newH };
        } else {
          return clamped;
        }
      }
      // For "error" mode, don't alter position but rely on clipPath + diagnostics
    }
  }
  
  return rect;
}

export function validatePort(
  port: Port, 
  hostRect: Rect, 
  boundary: Node & { kind: "boundary" }, 
  diagnostics: Diagnostic[]
): void {
  const { side, offset } = port;
  const policy = boundary.policy || DEFAULT_BOUNDARY_POLICY;
  const tolerance = policy.tolerance ?? 0;
  
  const portPos: Pt = {
    x: side === "left" ? hostRect.x :
       side === "right" ? hostRect.x + hostRect.w : 
       hostRect.x + offset,
    y: side === "top" ? hostRect.y :
       side === "bottom" ? hostRect.y + hostRect.h : 
       hostRect.y + offset
  };
  
  const boundaryRect = rectOfBoundary(boundary);
  const inside = portPos.x >= boundaryRect.x - tolerance && 
                 portPos.x <= boundaryRect.x + boundaryRect.w + tolerance &&
                 portPos.y >= boundaryRect.y - tolerance && 
                 portPos.y <= boundaryRect.y + boundaryRect.h + tolerance;
  
  if (!inside) {
    diagnostics.push({
      code: "PORT_OUTSIDE",
      nodeId: port.nodeId,
      boundaryId: boundary.id,
      severity: "error",
      message: `Port '${port.id}' is not on/inside its boundary '${boundary.id}'.`,
      actual: { portPos, hostRect, boundaryRect }
    });
  }
}

// Helper to find boundary containing a node
export function findContainingBoundary(nodeId: string, scene: Scene): Node & { kind: "boundary" } | null {
  function searchInNode(node: Node): Node & { kind: "boundary" } | null {
    if (node.kind === "boundary" && node.children) {
      for (const child of node.children) {
        if (child.id === nodeId) {
          return node as Node & { kind: "boundary" };
        }
        const found = searchInNode(child);
        if (found) return found;
      }
    } else if ('children' in node && node.children) {
      for (const child of node.children) {
        const found = searchInNode(child);
        if (found) return found;
      }
    }
    return null;
  }

  for (const node of scene.nodes) {
    const found = searchInNode(node);
    if (found) return found;
  }
  return null;
}

// Main enforcement function - implements two-pass validation and correction
export function enforceBoundaries(scene: Scene): EnforcementResult {
  const diagnostics: Diagnostic[] = [];

  // Pass 1: Validate and correct positions
  function walkAndEnforce(node: Node, parentAbs: Pt, parentBoundary?: Node & { kind: "boundary" }): void {
    // Get node's rectangle
    let rect = getNodeRect(node, parentAbs);

    // Apply snapping if within a boundary with snap policy
    if (parentBoundary?.policy?.snap) {
      const grid = parentBoundary.policy.snap.grid;
      if (grid > 1) {
        rect.x = snap(rect.x, grid);
        rect.y = snap(rect.y, grid);
      }
    }

    // Apply boundary enforcement if applicable
    if (parentBoundary) {
      const policy = parentBoundary.policy || DEFAULT_BOUNDARY_POLICY;
      rect = applyBoundaryPolicy(rect, parentBoundary, policy, diagnostics, node.id);
    }

    // Store corrected absolute rectangle on node for paint pass
    (node as any)._absRect = rect;

    // Recurse into children
    if (node.kind === "boundary") {
      const boundary = node as Node & { kind: "boundary" };
      const boundaryRect = rectOfBoundary(boundary);
      if (boundary.children) {
        boundary.children.forEach(child =>
          walkAndEnforce(child, { x: boundaryRect.x, y: boundaryRect.y }, boundary)
        );
      }
    } else if ('children' in node && node.children) {
      (node.children as Node[]).forEach(child =>
        walkAndEnforce(child, { x: rect.x, y: rect.y }, parentBoundary)
      );
    }
  }

  // Start enforcement from root nodes
  scene.nodes.forEach(node => walkAndEnforce(node, { x: 0, y: 0 }));

  // Validate ports
  if (scene.ports) {
    scene.ports.forEach(port => {
      const boundary = findContainingBoundary(port.nodeId, scene);
      if (boundary) {
        // Find the host node's rectangle
        const hostNode = findNodeById(port.nodeId, scene);
        if (hostNode && (hostNode as any)._absRect) {
          validatePort(port, (hostNode as any)._absRect, boundary, diagnostics);
        }
      }
    });
  }

  // Calculate summary
  const errors = diagnostics.filter(d => d.severity === "error").length;
  const warnings = diagnostics.filter(d => d.severity === "warning").length;

  return {
    scene,
    diagnostics,
    summary: { errors, warnings }
  };
}

// Helper to find node by ID
function findNodeById(nodeId: string, scene: Scene): Node | null {
  function searchInNode(node: Node): Node | null {
    if (node.id === nodeId) return node;
    if ('children' in node && node.children) {
      for (const child of node.children) {
        const found = searchInNode(child);
        if (found) return found;
      }
    }
    return null;
  }

  for (const node of scene.nodes) {
    const found = searchInNode(node);
    if (found) return found;
  }
  return null;
}
