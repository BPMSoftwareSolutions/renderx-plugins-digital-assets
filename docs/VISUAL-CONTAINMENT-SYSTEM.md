# Visual Containment System

## Overview

The Visual Containment System implements **visual containment at render time** and **contract enforcement** to enable automatic corrections for boundary violations. This system ensures that elements never visually escape their designated boundaries while providing machine-readable diagnostics for automated fixes.

## Key Features

### 🛡️ **Boundary Policy System**
- **Strict Mode**: Enforces hard boundaries with automatic correction
- **Loose Mode**: Provides warnings without position correction
- **Configurable Overflow**: `clip`, `mask`, `resize`, or `error` handling
- **Grid Snapping**: Automatic alignment to pixel grids
- **Tolerance Settings**: Configurable drift detection thresholds

### 🔧 **Two-Pass Renderer Architecture**
1. **Validation Pass**: Computes positions, applies corrections, collects diagnostics
2. **Paint Pass**: Renders with visual containment using clipPath/mask

### 📊 **Diagnostic System**
- **Machine-readable reports** with error codes and severity levels
- **Auto-fix suggestions** with confidence ratings
- **Performance metrics** and processing summaries
- **JSON export** for agent consumption

### 🎨 **Visual Containment**
- **ClipPath support** for hard visual boundaries
- **Mask support** for soft edges and fade effects
- **Corridor handling** for inter-boundary connections
- **Composite clipping** for complex multi-boundary scenarios

## Configuration

### Boundary Policy Configuration

```json
{
  "kind": "boundary",
  "id": "my-boundary",
  "policy": {
    "mode": "strict",           // "strict" | "loose"
    "overflow": "clip",         // "clip" | "mask" | "resize" | "error"
    "tolerance": 1,             // pixels before flagging drift
    "snap": {
      "grid": 2,               // snap to 2px grid
      "origin": "local"        // "local" | "parent"
    }
  }
}
```

### Default Policy
```typescript
const DEFAULT_POLICY = {
  mode: "strict",
  overflow: "clip",
  snap: { grid: 2, origin: "local" },
  tolerance: 1
};
```

## Usage Examples

### Basic Boundary with Containment

```json
{
  "kind": "boundary",
  "id": "plugin-context",
  "at": { "x": 50, "y": 50 },
  "size": { "width": 400, "height": 300 },
  "policy": { "mode": "strict", "overflow": "clip" },
  "children": [
    {
      "kind": "shape",
      "id": "contained-element",
      "at": { "x": 350, "y": 250 },  // This would overflow
      "size": { "width": 100, "height": 80 },
      "shape": "rect"
    }
  ]
}
```

### Diagnostic Report Generation

```typescript
import { generateDiagnosticReport } from './diagnostics';

const report = generateDiagnosticReport(scene);
console.log(`Found ${report.summary.errors} errors, ${report.summary.warnings} warnings`);

// Apply auto-fixes
if (report.suggestions.length > 0) {
  const fixedScene = applyAutoFixes(scene, report.suggestions);
}
```

### Rendering with Containment

```typescript
import { renderSceneWithDiagnostics } from './render-svg';

const { svg, diagnostics } = renderSceneWithDiagnostics(scene);
// SVG includes clipPath definitions and containment attributes
// diagnostics contains enforcement results
```

## Diagnostic Codes

| Code | Description | Severity | Auto-Fix Available |
|------|-------------|----------|-------------------|
| `OUT_OF_BOUNDS` | Element escapes boundary | Error/Warning | ✅ Move Node |
| `PORT_OUTSIDE` | Port not within boundary | Error | ✅ Adjust Position |
| `NEG_SIZE` | Negative dimensions | Error | ✅ Resize Node |
| `CONNECTOR_LEAK` | Connector crosses boundaries | Warning | ✅ Add Policy |

## Auto-Fix Suggestions

The system generates automatic fix suggestions with confidence ratings:

```json
{
  "type": "MOVE_NODE",
  "nodeId": "overflow-element",
  "description": "Move node to stay within boundary",
  "changes": { "at": { "x": 300, "y": 220 } },
  "confidence": "high"
}
```

### Confidence Levels
- **High**: Safe automatic application
- **Medium**: Review recommended
- **Low**: Manual intervention suggested

## Visual Containment Features

### ClipPath Generation
```typescript
// Automatic clipPath generation for boundaries
<clipPath id="clip-boundary-id">
  <rect x="50" y="50" width="400" height="300" rx="8"/>
</clipPath>

// Applied to boundary group
<g clip-path="url(#clip-boundary-id)">
  <!-- Boundary contents -->
</g>
```

### Mask Support
For soft boundaries with fade effects:
```json
{
  "policy": { "mode": "strict", "overflow": "mask" }
}
```

Generates:
```xml
<mask id="clip-boundary-id">
  <rect x="50" y="50" width="400" height="300" rx="8" fill="white"/>
</mask>
```

## Performance Characteristics

- **Processing Time**: ~100ms for complex scenes (30+ nodes)
- **Memory Usage**: Minimal overhead with position caching
- **Scalability**: Linear with node count
- **Compatibility**: Works with existing scenes (backward compatible)

## Integration with Existing Systems

### Contextual Boundaries
The containment system integrates seamlessly with the existing contextual boundaries:

```json
{
  "kind": "boundary",
  "id": "lane.plugin",
  "title": "Plugin Context",
  "grid": { "cols": 2, "rowH": 200, "gutter": 20, "padding": 24 },
  "policy": { "mode": "strict", "overflow": "clip", "tolerance": 1 }
}
```

### Animation Support
- **Token Motion**: Respects boundary clipping during animation
- **Boundary Highlighting**: Activates during flow traversal
- **Corridor Handling**: Clean transitions between boundaries

## Testing

Comprehensive test suite covers:
- ✅ Utility functions (snap, clamp, contains)
- ✅ Boundary policy enforcement
- ✅ Visual containment generation
- ✅ Diagnostic system
- ✅ Auto-fix suggestions
- ✅ Integration workflows

Run tests:
```bash
npm test -- boundary-containment.test.js
```

## Files Structure

```
src/
├── boundary-enforcement.ts    # Core enforcement logic
├── visual-containment.ts      # ClipPath and mask generation
├── diagnostics.ts            # Diagnostic reporting system
├── render-svg.ts             # Updated two-pass renderer
└── containment-demo.ts       # Demo and testing script

tests/
└── boundary-containment.test.js  # Comprehensive test suite

samples/
├── slide-01-with-containment.svg     # Enhanced slide
├── boundary-violation-test.svg       # Violation demo
├── slide-01-diagnostics.json         # Clean scene report
└── boundary-violation-diagnostics.json  # Violation report
```

## Next Steps

The containment system provides a solid foundation for:
1. **Agent-driven corrections** using diagnostic reports
2. **Advanced animation containment** with corridor support
3. **Complex multi-boundary scenarios** with composite clipping
4. **Performance optimization** with spatial indexing
5. **Extended policy options** for specialized use cases

This implementation fully addresses GitHub issue #14 requirements for visual containment and contract enforcement.
