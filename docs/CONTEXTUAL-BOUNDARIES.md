# Contextual Boundaries Feature

The **Contextual Boundaries** feature introduces a powerful "Context-Lanes" pattern for creating structured, predictable diagrams with clear visual boundaries, precise port-based connections, and animated flows.

## Core Concepts

### 1. Boundaries (Lanes)
Boundaries are semantic containers that group related nodes and enforce visual structure:

```typescript
type Boundary = {
  kind: "boundary";
  id: string;
  title?: string;
  at: { x: number; y: number };
  size: { width: number; height: number };
  style?: { 
    fill?: string; 
    stroke?: string; 
    strokeWidth?: number; 
    labelColor?: string 
  };
  grid?: { 
    cols: number; 
    rowH: number; 
    gutter: number; 
    padding: number 
  };
  z?: number;
  children?: Node[];
};
```

### 2. Ports
Ports define precise connection points on nodes:

```typescript
type Port = {
  id: string;
  nodeId: string;
  side: "left"|"right"|"top"|"bottom";
  offset: number; // px from top/left along that side
};
```

### 3. Enhanced Connectors
Connectors can now use ports for precise connections:

```typescript
type Connector = {
  id?: string;
  from: NodeId | { port: string };
  to: NodeId | { port: string };
  route?: "straight"|"orthogonal"|"curve";
  // ... other properties
};
```

### 4. Flows
Flows enable animation along connector paths:

```typescript
type Flow = {
  id: string;
  path: string; // connector sequence: "c1>c2>c3"
  token?: {
    size?: number;
    color?: string;
    trail?: { length?: number; opacity?: number };
  };
  speed?: number; // px/s
  loop?: boolean;
  activate?: {
    boundaryIds?: string[];
    className?: string;
  };
};
```

## Features

### ✅ Visual Structure
- **Boundary Rendering**: Rounded rectangles with titles and shadows
- **Grid Snapping**: Child nodes automatically snap to boundary grids
- **Consistent Styling**: Unified visual language across diagrams

### ✅ Precise Connections
- **Port-Based Routing**: Connections attach to specific points on nodes
- **Manhattan Routing**: Clean orthogonal paths between boundaries
- **Multiple Route Types**: Straight, orthogonal, and curved connections

### ✅ Animation System
- **Flow Tokens**: Animated circles that travel along connector paths
- **Path Concatenation**: Flows can traverse multiple connectors
- **Boundary Activation**: Highlight boundaries as tokens pass through

### ✅ Developer Experience
- **Type Safety**: Full TypeScript support with proper type definitions
- **Backward Compatibility**: Existing scenes continue to work unchanged
- **Comprehensive Testing**: Full test coverage for all features

## Usage Examples

### Basic Boundary Scene

```json
{
  "id": "basic-lanes",
  "canvas": { "width": 800, "height": 400 },
  "nodes": [
    {
      "kind": "boundary",
      "id": "lane1",
      "title": "Input Layer",
      "at": { "x": 50, "y": 50 },
      "size": { "width": 300, "height": 200 },
      "style": { 
        "fill": "#141a24", 
        "stroke": "#253146", 
        "labelColor": "#e6edf3" 
      },
      "grid": { "cols": 2, "rowH": 80, "gutter": 10, "padding": 20 },
      "children": [
        {
          "kind": "shape",
          "id": "input-node",
          "shape": "roundedRect",
          "at": { "x": 20, "y": 20 },
          "size": { "width": 120, "height": 60 },
          "style": { "fill": "#1f2430", "stroke": "#384559" }
        }
      ]
    }
  ]
}
```

### Port-Based Connections

```json
{
  "ports": [
    { "id": "input-out", "nodeId": "input-node", "side": "right", "offset": 30 },
    { "id": "output-in", "nodeId": "output-node", "side": "left", "offset": 30 }
  ],
  "connectors": [
    {
      "id": "data-flow",
      "from": { "port": "input-out" },
      "to": { "port": "output-in" },
      "route": "orthogonal",
      "style": { "stroke": "#8b5cf6", "strokeWidth": 2 }
    }
  ]
}
```

### Animated Flows

```json
{
  "flows": [
    {
      "id": "processing-flow",
      "path": "data-flow",
      "token": { 
        "size": 4, 
        "color": "#d6bcfa" 
      },
      "speed": 160,
      "loop": true,
      "activate": { 
        "boundaryIds": ["lane1", "lane2"], 
        "className": "active-glow" 
      }
    }
  ]
}
```

## Implementation Details

### Grid Snapping Algorithm
Child nodes within boundaries are automatically snapped to grid positions:

```typescript
const snappedX = grid.padding + col * (colWidth + grid.gutter);
const snappedY = grid.padding + row * grid.rowH;
```

### Port Position Calculation
Port coordinates are calculated based on node position and port configuration:

```typescript
switch (port.side) {
  case "right": return { x: nodeX + nodeWidth, y: nodeY + port.offset };
  case "left": return { x: nodeX, y: nodeY + port.offset };
  // ... other sides
}
```

### Manhattan Routing
Orthogonal connections use midpoint routing for clean paths:

```typescript
const midX = (startX + endX) / 2;
const path = `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
```

## Testing

Run the contextual boundaries tests:

```bash
npm test -- tests/contextual-boundaries.test.js
```

Generate a demo SVG:

```bash
npm run build
node dist/contextual-boundaries-demo.js
```

## Benefits

1. **Enforced Structure**: Boundaries ensure consistent visual organization
2. **Predictable Layout**: Grid snapping creates uniform spacing
3. **Clean Connections**: Port-based routing eliminates messy line crossings
4. **Rich Animation**: Flows bring diagrams to life with meaningful motion
5. **Scalable Design**: Pattern works for simple and complex diagrams alike

This feature transforms the graph-to-SVG system from a basic node-edge renderer into a sophisticated diagramming platform capable of creating professional, animated visualizations.
