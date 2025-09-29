// visual-containment.ts
import type { Node, BoundaryPolicy } from './scene';
import type { Rect } from './boundary-enforcement';
import { rectOfBoundary, DEFAULT_BOUNDARY_POLICY } from './boundary-enforcement';

export type ClipPathConfig = {
  id: string;
  rect: Rect;
  borderRadius?: number;
  type: "clip" | "mask";
};

export type ContainmentContext = {
  clipPaths: ClipPathConfig[];
  masks: ClipPathConfig[];
};

// Generate clipPath definition for a boundary
export function generateClipPath(boundary: Node & { kind: "boundary" }, borderRadius = 8): ClipPathConfig {
  const rect = rectOfBoundary(boundary);
  const policy = boundary.policy || DEFAULT_BOUNDARY_POLICY;
  
  return {
    id: `clip-${boundary.id}`,
    rect,
    borderRadius,
    type: policy.overflow === "mask" ? "mask" : "clip"
  };
}

// Generate SVG clipPath element
export function renderClipPath(config: ClipPathConfig): string {
  const { id, rect, borderRadius = 0 } = config;
  
  if (config.type === "mask") {
    return `<mask id="${id}">
      <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" 
            rx="${borderRadius}" ry="${borderRadius}" fill="white"/>
    </mask>`;
  } else {
    return `<clipPath id="${id}">
      <rect x="${rect.x}" y="${rect.y}" width="${rect.w}" height="${rect.h}" 
            rx="${borderRadius}" ry="${borderRadius}"/>
    </clipPath>`;
  }
}

// Generate corridor clipPath for inter-boundary connections
export function generateCorridorClipPath(
  boundaryA: Node & { kind: "boundary" }, 
  boundaryB: Node & { kind: "boundary" },
  corridorWidth = 20
): ClipPathConfig {
  const rectA = rectOfBoundary(boundaryA);
  const rectB = rectOfBoundary(boundaryB);
  
  // Create a corridor rectangle between the two boundaries
  const minX = Math.min(rectA.x + rectA.w, rectB.x);
  const maxX = Math.max(rectA.x, rectB.x + rectB.w);
  const minY = Math.min(rectA.y, rectB.y);
  const maxY = Math.max(rectA.y + rectA.h, rectB.y + rectB.h);
  
  const corridorRect: Rect = {
    x: minX,
    y: minY - corridorWidth / 2,
    w: maxX - minX,
    h: maxY - minY + corridorWidth
  };
  
  return {
    id: `corridor-${boundaryA.id}-${boundaryB.id}`,
    rect: corridorRect,
    type: "clip"
  };
}

// Generate composite clipPath that combines multiple boundaries and corridors
export function generateCompositeClipPath(
  id: string,
  boundaries: (Node & { kind: "boundary" })[],
  corridors: ClipPathConfig[] = []
): ClipPathConfig {
  // For now, create a union of all boundary rectangles
  // In a more advanced implementation, this would use SVG path unions
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  boundaries.forEach(boundary => {
    const rect = rectOfBoundary(boundary);
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  });
  
  corridors.forEach(corridor => {
    const rect = corridor.rect;
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.w);
    maxY = Math.max(maxY, rect.y + rect.h);
  });
  
  return {
    id,
    rect: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
    type: "clip"
  };
}

// Advanced composite clipPath using SVG path operations (for complex shapes)
export function renderAdvancedCompositeClipPath(
  id: string,
  boundaries: (Node & { kind: "boundary" })[],
  corridors: ClipPathConfig[] = [],
  borderRadius = 8
): string {
  let pathData = "";
  
  // Add boundary rectangles to path
  boundaries.forEach(boundary => {
    const rect = rectOfBoundary(boundary);
    pathData += `M ${rect.x + borderRadius} ${rect.y} `;
    pathData += `L ${rect.x + rect.w - borderRadius} ${rect.y} `;
    pathData += `Q ${rect.x + rect.w} ${rect.y} ${rect.x + rect.w} ${rect.y + borderRadius} `;
    pathData += `L ${rect.x + rect.w} ${rect.y + rect.h - borderRadius} `;
    pathData += `Q ${rect.x + rect.w} ${rect.y + rect.h} ${rect.x + rect.w - borderRadius} ${rect.y + rect.h} `;
    pathData += `L ${rect.x + borderRadius} ${rect.y + rect.h} `;
    pathData += `Q ${rect.x} ${rect.y + rect.h} ${rect.x} ${rect.y + rect.h - borderRadius} `;
    pathData += `L ${rect.x} ${rect.y + borderRadius} `;
    pathData += `Q ${rect.x} ${rect.y} ${rect.x + borderRadius} ${rect.y} Z `;
  });
  
  // Add corridor rectangles to path
  corridors.forEach(corridor => {
    const rect = corridor.rect;
    pathData += `M ${rect.x} ${rect.y} `;
    pathData += `L ${rect.x + rect.w} ${rect.y} `;
    pathData += `L ${rect.x + rect.w} ${rect.y + rect.h} `;
    pathData += `L ${rect.x} ${rect.y + rect.h} Z `;
  });
  
  return `<clipPath id="${id}">
    <path d="${pathData}" fill-rule="evenodd"/>
  </clipPath>`;
}

// Collect all containment requirements from a scene
export function collectContainmentRequirements(scene: any): ContainmentContext {
  const clipPaths: ClipPathConfig[] = [];
  const masks: ClipPathConfig[] = [];
  
  function processNode(node: Node): void {
    if (node.kind === "boundary") {
      const boundary = node as Node & { kind: "boundary" };
      const clipConfig = generateClipPath(boundary);
      
      if (clipConfig.type === "mask") {
        masks.push(clipConfig);
      } else {
        clipPaths.push(clipConfig);
      }
    }
    
    if ('children' in node && node.children) {
      (node.children as Node[]).forEach(processNode);
    }
  }
  
  scene.nodes.forEach(processNode);
  
  return { clipPaths, masks };
}

// Generate all containment definitions for SVG defs section
export function renderContainmentDefs(context: ContainmentContext): string {
  const clipPathDefs = context.clipPaths.map(renderClipPath).join('\n');
  const maskDefs = context.masks.map(renderClipPath).join('\n');
  
  return clipPathDefs + '\n' + maskDefs;
}

// Apply containment attributes to a boundary group
export function applyContainmentAttributes(boundary: Node & { kind: "boundary" }): string {
  const policy = boundary.policy || DEFAULT_BOUNDARY_POLICY;
  const clipId = `clip-${boundary.id}`;
  
  if (policy.overflow === "mask") {
    return `mask="url(#${clipId})"`;
  } else if (policy.overflow === "clip" || policy.overflow === "resize") {
    return `clip-path="url(#${clipId})"`;
  }
  
  return "";
}

// Helper to determine if a node needs containment
export function needsContainment(node: Node): boolean {
  if (node.kind !== "boundary") return false;
  
  const boundary = node as Node & { kind: "boundary" };
  const policy = boundary.policy || DEFAULT_BOUNDARY_POLICY;
  
  return policy.mode === "strict" && 
         (policy.overflow === "clip" || policy.overflow === "mask" || policy.overflow === "resize");
}
