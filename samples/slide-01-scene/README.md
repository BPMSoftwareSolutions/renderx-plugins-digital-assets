# Advanced Scene Graph System - Slide 1

This directory contains the implementation of the **Advanced Scene Graph System** as specified in [GitHub Issue #7](https://github.com/BPMSoftwareSolutions/renderx-plugins-digital-assets/issues/7). This system provides a sophisticated approach to creating complex, layered SVG compositions with sprites, groups, z-ordering, and visual effects.

## System Overview

The Advanced Scene Graph System moves beyond simple graph-to-SVG conversion to provide:

- **Sprite-based Composition**: Reusable SVG symbols for complex visual elements
- **Hierarchical Groups**: Nested composition with precise positioning and transforms
- **Z-ordering**: Depth sorting for proper layering of visual elements
- **Visual Effects**: SVG filters (shadows, glows) and gradients for polish
- **Smart Connectors**: Curved, orthogonal, and straight routing with markers
- **Precise Positioning**: Pixel-perfect placement based on design specifications

## Architecture

### Core Types (`src/scene.ts`)

```typescript
export type Scene = {
  id: string;
  canvas: Size;
  bg?: string;
  defs?: { symbols?: Array<{ id: string; svg: string }>; filters?: string[]; gradients?: string[] };
  nodes: Node[];
  connectors?: Connector[];
};

export type Node =
  | { kind: "group"; id: NodeId; z?: number; at?: Vec2; size?: Size; style?: Style; transform?: Transform; children?: Node[] }
  | { kind: "sprite"; id: NodeId; z?: number; at: Vec2; size?: Size; anchor?: Anchor; sprite: SpriteRef; style?: Style; transform?: Transform }
  | { kind: "shape";  id: NodeId; z?: number; at: Vec2; size: Size; shape: "rect"|"roundedRect"|"circle"|"path"; d?: string; style?: Style; transform?: Transform }
  | { kind: "text";   id: NodeId; z?: number; at: Vec2; text: string; anchor?: Anchor; style?: Style; transform?: Transform };
```

### SVG Renderer (`src/render-svg.ts`)

The renderer handles:
- **Symbol Registration**: Converts sprite definitions to SVG `<symbol>` elements
- **Hierarchical Flattening**: Resolves nested groups to absolute positions
- **Z-order Sorting**: Ensures proper rendering order
- **Transform Application**: Handles translation, scaling, and rotation
- **Connector Routing**: Generates paths between nodes with various routing algorithms

## Slide 1 Implementation

### Canvas & Theme
- **Dimensions**: 1200×720 (matching slide specifications)
- **Background**: `#0f1116` (dark theme matching plugin architecture aesthetic)
- **Layout**: Precise positioning based on `plugin-integration-slides.json`

### Tile Structure
Each of the 5 main elements is implemented as a hierarchical group:

1. **Plugin Package** (23, 155) - Package box with shadow, label, glyphs, and npm badge
2. **Plugin Manifest** (390, 155) - Document card with JSON braces, rows, stamp, and tabs
3. **Handlers Export** (757, 155) - Dark card with neon arc, animated connectors, and directional ports
4. **Build & Publish** (23, 505) - Conveyor system with staging, tags, and uplink
5. **Host SDK** (390, 505) - Console with rails, ports, and system modules

### Sprite Library
22 reusable sprites organized by category:
- `pkg/*` - Plugin package components
- `manifest/*` - Manifest document elements
- `handlers/*` - Handler connection visuals
- `build/*` - Build process components
- `host/*` - Host SDK infrastructure

### Visual Effects
- **Soft Shadow Filter**: `url(#softShadow)` with enhanced blur for depth and card backgrounds
- **Glow Effect Filter**: `url(#glow)` for neon elements like the violet arc
- **Violet Gradient**: `url(#violetArc)` for energy connectors with animated dash pattern
- **Opacity Layers**: Subtle transparency for secondary elements and background connectors

### Connectors
- **Package → Build**: Curved orange connector showing build flow
- **Manifest → Handlers**: Dashed purple connector showing handler discovery

## Handlers Export Improvements

The "Handlers Export" tile has been enhanced with professional layering and visual effects:

### Layering Structure (bottom to top)
1. **Dark Card Background** (`#151922`) with soft shadow for depth
2. **Title Text** positioned at the top for clear identification
3. **Background Connectors** (subtle, low opacity) showing input stubs
4. **Main Neon Arc** with violet gradient and glow effect
5. **Tracer Lines** with directional arrows showing data flow
6. **Port Pills** (onDragStart, publishCreateRequested) on the top layer

### Visual Enhancements
- **Enhanced Filters**: Soft shadow with 8px blur and glow effect for neon elements
- **Animated Arc**: Dashed overlay with CSS animation (6s infinite loop)
- **Directional Arrows**: Small triangular indicators on tracer lines
- **Improved Contrast**: Heavier strokes (4px main arc, 1.5px traces) for better visibility
- **Professional Styling**: Rounded port pills with proper stroke and fill colors

### Technical Implementation
- **Shared Gradients**: `violetArc` gradient defined in scene-level `defs` for reusability
- **Self-contained Symbols**: Each sprite handles its own internal styling
- **Proper Z-ordering**: Elements layered from background to foreground for visual hierarchy
- **Filter Scope**: Filters applied at the appropriate level (card shadow, arc glow)

## Generated Assets

### Main Scene
- `slide-01-manifest.svg` - Complete scene with all tiles and connectors
- `slide-01-manifest.json` - Scene data structure

### Individual Tiles
- `plugin-package.svg/json` - Isolated plugin package tile
- `plugin-manifest.svg/json` - Isolated manifest tile
- `handlers-export.svg/json` - Isolated handlers tile
- `build-publish.svg/json` - Isolated build process tile
- `host-sdk.svg/json` - Isolated host SDK tile

### Metadata
- `index.json` - Complete catalog with metadata and feature descriptions

## Usage Examples

### Programmatic Scene Creation
```typescript
import { renderScene } from '../src/render-svg';
import { slide01 } from '../src/slide01-data';

const svg = renderScene(slide01);
// Generates complete SVG with all sprites, effects, and connectors
```

### Custom Scene Composition
```typescript
import type { Scene } from '../src/scene';

const customScene: Scene = {
  id: "my-scene",
  canvas: { width: 800, height: 600 },
  bg: "#1a1a1a",
  defs: {
    symbols: [
      { id: "my-sprite", svg: "<rect width='100' height='50' fill='blue'/>" }
    ]
  },
  nodes: [
    {
      kind: "group",
      id: "my-group",
      at: { x: 100, y: 100 },
      children: [
        {
          kind: "sprite",
          id: "sprite-1",
          at: { x: 0, y: 0 },
          size: { width: 100, height: 50 },
          sprite: { symbolId: "my-sprite" }
        }
      ]
    }
  ]
};
```

### CLI Generation
```bash
# Generate all slide 1 scene assets
npm run generate-slide-01-scene

# Generate individual components
npm run build && node dist/slide01-generator.js
```

## Key Advantages

### Over Simple Graph Systems
- **Visual Fidelity**: Sprites capture design intent, not just connectivity
- **Composition**: Hierarchical groups enable complex, layered designs
- **Reusability**: Symbol library promotes consistency and efficiency
- **Polish**: Built-in support for shadows, gradients, and visual effects

### Over Manual SVG Creation
- **Data-Driven**: Scenes defined as structured data, not markup
- **Programmatic**: Easy to generate variations and animations
- **Maintainable**: Changes to sprites propagate automatically
- **Testable**: Comprehensive test coverage ensures reliability

## Testing

The system includes 18 comprehensive tests covering:
- Schema validation and structure
- SVG rendering accuracy
- File generation and integrity
- Positioning precision
- Visual effect application

```bash
npm test -- tests/scene-graph.test.js
```

## Future Extensions

The scene graph system is designed for extensibility:
- **Animation**: Add keyframe support for sprite transforms
- **Interaction**: Event handlers for clickable elements
- **Themes**: Multiple color schemes and visual styles
- **Export Formats**: PNG, PDF, or other output formats
- **Real-time Editing**: Live preview and manipulation tools

This implementation demonstrates how complex visual designs can be represented as structured data while maintaining the flexibility and power of programmatic generation.
