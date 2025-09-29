# Slide 1: Plugin Scaffolding & Manifest - Graph Specifications

This directory contains graph representations of the elements and relationships described in **slide-01-manifest** from the plugin integration slides. Each graph visualizes the internal structure, dependencies, and workflows based on the detailed element descriptions.

## Source Data

Generated from: `assets/plugin-architecture/plugin-integration-slides.json`  
Slide: **Phase 1: Plugin Scaffolding & Manifest**

## Graph Specifications

### 1. Plugin Package Structure
**File**: `plugin-package-structure.json/svg`  
**Layout**: Layered | **Theme**: Light | **Nodes**: 5 | **Edges**: 4

Visualizes the internal structure of the plugin package showing how the package box serves as the foundation, with shadow grounding it, label wrapping it, glyphs hinting at capabilities, and the npm badge sealing it for release-readiness.

### 2. Plugin Manifest Structure  
**File**: `plugin-manifest-structure.json/svg`  
**Layout**: Layered | **Theme**: Light | **Nodes**: 5 | **Edges**: 4

Shows the internal structure of the plugin manifest with the document card as foundation, JSON braces framing the content, key-value rows containing the data, generated stamp indicating canonical source, and navigation tabs providing section access.

### 3. Handlers Export Structure
**File**: `handlers-export-structure.json/svg`  
**Layout**: Radial | **Theme**: Light | **Nodes**: 4 | **Edges**: 4

Represents the elegant connectors emerging from the plugin core, clicking into matching ports, energized by violet gradients, and extending via circuit traces for extensibility.

### 4. Build & Publish Process
**File**: `build-publish-process.json/svg`  
**Layout**: Layered | **Theme**: Light | **Nodes**: 4 | **Edges**: 3

Illustrates the build and publish workflow from compact conveyor feeding modules to staging pad where version tags are applied, culminating in publication via uplink arrow.

### 5. Host SDK Structure
**File**: `host-sdk-structure.json/svg`  
**Layout**: Layered | **Theme**: Dark | **Nodes**: 4 | **Edges**: 4

Depicts the low-profile console providing rails and exposing ports, with system modules (Conductor, EventRouter) sliding into place on the infrastructure.

### 6. Slide 01 Architecture
**File**: `slide-01-architecture.json/svg`  
**Layout**: Layered | **Theme**: Light | **Nodes**: 5 | **Edges**: 5

High-level architecture showing relationships between the main slide elements: plugin package defines manifest, manifest exposes handlers, package is processed by build-publish, handlers integrate with host SDK, and manifest enables host discovery.

### 7. Plugin Workflow
**File**: `plugin-workflow.json/svg`  
**Layout**: Layered | **Theme**: Light | **Nodes**: 6 | **Edges**: 6

Complete plugin development workflow from scaffolding through manifest definition, handler implementation, package building, npm publication, to host discovery.

### 8. Plugin Capabilities
**File**: `plugin-capabilities.json/svg`  
**Layout**: Radial | **Theme**: Light | **Nodes**: 7 | **Edges**: 6

Radial representation of plugin capabilities based on the glyph descriptions: plugin core surrounded by icons for identification, handlers, events, boundaries, security, and versioning.

## Usage Examples

### View a Graph
```bash
# Convert JSON to SVG
npm run graph-to-svg samples/slide-01/plugin-package-structure.json

# View in browser
open samples/slide-01/plugin-package-structure.svg
```

### Programmatic Access
```typescript
import * as fs from 'fs';
import type { Graph } from '../../src/graph';

// Load a graph specification
const graph: Graph = JSON.parse(
  fs.readFileSync('samples/slide-01/plugin-package-structure.json', 'utf-8')
);

// Generate SVG
import { graphToSVG } from '../../src/svg-export';
const svg = graphToSVG(graph);
```

### Regenerate All Graphs
```bash
npm run generate-slide-01
```

## Graph Relationships

The graphs represent different levels of abstraction:

- **Internal Structure Graphs** (1-5): Show sub-element relationships within each main element
- **Architecture Graph** (6): Shows relationships between main elements  
- **Workflow Graph** (7): Shows temporal/process relationships
- **Capabilities Graph** (8): Shows conceptual relationships around plugin capabilities

## Design Principles

Each graph follows the design principles from the original element descriptions:

- **Clean Geometry**: Crisp, isometric representations
- **Purposeful Connections**: Edges represent meaningful relationships
- **Visual Hierarchy**: Layout emphasizes primary flows and dependencies
- **Semantic Labels**: Edge labels describe the nature of relationships
- **Appropriate Themes**: Light theme for most, dark theme for host SDK infrastructure

## Integration with Existing Assets

These graph specifications complement the existing SVG assets by:

- Providing structural understanding of element relationships
- Enabling programmatic generation of architectural diagrams  
- Supporting documentation and communication of design intent
- Facilitating analysis of dependencies and workflows

The graphs serve as both documentation and as input for generating new visualizations of the plugin architecture.
