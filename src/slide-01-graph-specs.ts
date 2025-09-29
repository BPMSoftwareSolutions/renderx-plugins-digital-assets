// slide-01-graph-specs.ts - Graph specifications based on slide 1 element descriptions
import type { Graph } from "./graph";

// Plugin Package Internal Structure Graph
export function createPluginPackageGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 150, 
      spacingY: 80 
    },
    nodes: [
      { id: "package-box", label: "Package Box", w: 120, h: 50 },
      { id: "shadow", label: "Shadow", w: 100, h: 40 },
      { id: "label", label: "Package Label", w: 130, h: 45 },
      { id: "glyphs", label: "Capability Glyphs", w: 140, h: 45 },
      { id: "npm-badge", label: "NPM Badge", w: 110, h: 45 }
    ],
    edges: [
      { from: "package-box", to: "shadow", label: "grounds" },
      { from: "package-box", to: "label", label: "wraps" },
      { from: "package-box", to: "glyphs", label: "hints at" },
      { from: "package-box", to: "npm-badge", label: "sealed by" }
    ]
  };
}

// Plugin Manifest Internal Structure Graph
export function createPluginManifestGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 160, 
      spacingY: 90 
    },
    nodes: [
      { id: "document-card", label: "Document Card", w: 130, h: 50 },
      { id: "json-braces", label: "JSON Braces", w: 120, h: 45 },
      { id: "key-value-rows", label: "Key-Value Rows", w: 140, h: 45 },
      { id: "generated-stamp", label: "Generated Stamp", w: 140, h: 45 },
      { id: "tabs", label: "Navigation Tabs", w: 130, h: 45 }
    ],
    edges: [
      { from: "document-card", to: "json-braces", label: "frames" },
      { from: "json-braces", to: "key-value-rows", label: "contains" },
      { from: "document-card", to: "generated-stamp", label: "stamped with" },
      { from: "document-card", to: "tabs", label: "navigated by" }
    ]
  };
}

// Handlers Export Internal Structure Graph
export function createHandlersExportGraph(): Graph {
  return {
    meta: { 
      layout: "radial", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true 
    },
    nodes: [
      { id: "connectors", label: "Elegant Connectors", w: 140, h: 50 },
      { id: "ports", label: "Matching Ports", w: 130, h: 50 },
      { id: "gradient", label: "Violet Gradient", w: 120, h: 45 },
      { id: "circuit-traces", label: "Circuit Traces", w: 130, h: 45 }
    ],
    edges: [
      { from: "connectors", to: "ports", label: "click into" },
      { from: "connectors", to: "gradient", label: "energized by" },
      { from: "connectors", to: "circuit-traces", label: "extend via" },
      { from: "gradient", to: "circuit-traces", label: "powers" }
    ]
  };
}

// Build & Publish Process Graph
export function createBuildPublishGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 140, 
      spacingY: 70 
    },
    nodes: [
      { id: "conveyor", label: "Compact Conveyor", w: 140, h: 50 },
      { id: "staging-pad", label: "Staging Pad", w: 120, h: 50 },
      { id: "version-tags", label: "Version Tags", w: 120, h: 45 },
      { id: "uplink-arrow", label: "Uplink Arrow", w: 120, h: 45 }
    ],
    edges: [
      { from: "conveyor", to: "staging-pad", label: "feeds to" },
      { from: "staging-pad", to: "version-tags", label: "applies" },
      { from: "staging-pad", to: "uplink-arrow", label: "publishes via" }
    ]
  };
}

// Host SDK Internal Structure Graph
export function createHostSDKGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "dark", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 150, 
      spacingY: 80 
    },
    nodes: [
      { id: "console", label: "Low-Profile Console", w: 150, h: 50 },
      { id: "rails", label: "Slender Rails", w: 120, h: 45 },
      { id: "ports", label: "Labeled Ports", w: 120, h: 45 },
      { id: "modules", label: "System Modules", w: 130, h: 50 }
    ],
    edges: [
      { from: "console", to: "rails", label: "provides" },
      { from: "console", to: "ports", label: "exposes" },
      { from: "rails", to: "modules", label: "guides" },
      { from: "ports", to: "modules", label: "connects" }
    ]
  };
}

// Overall Slide 1 Architecture Graph
export function createSlide01ArchitectureGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 200, 
      spacingY: 120 
    },
    nodes: [
      { id: "plugin-package", label: "Plugin Package", w: 140, h: 60 },
      { id: "plugin-manifest", label: "Plugin Manifest", w: 140, h: 60 },
      { id: "handlers-export", label: "Handlers Export", w: 140, h: 60 },
      { id: "build-publish", label: "Build & Publish", w: 140, h: 60 },
      { id: "host-sdk", label: "Host SDK (Context)", w: 150, h: 60 }
    ],
    edges: [
      { from: "plugin-package", to: "plugin-manifest", label: "defines" },
      { from: "plugin-manifest", to: "handlers-export", label: "exposes" },
      { from: "plugin-package", to: "build-publish", label: "processed by" },
      { from: "handlers-export", to: "host-sdk", label: "integrates with" },
      { from: "plugin-manifest", to: "host-sdk", label: "discovered by" }
    ]
  };
}

// Plugin Development Workflow Graph
export function createPluginWorkflowGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 180, 
      spacingY: 100 
    },
    nodes: [
      { id: "scaffold", label: "Scaffold Plugin", w: 130, h: 50 },
      { id: "define-manifest", label: "Define Manifest", w: 130, h: 50 },
      { id: "implement-handlers", label: "Implement Handlers", w: 150, h: 50 },
      { id: "build-package", label: "Build Package", w: 130, h: 50 },
      { id: "publish-npm", label: "Publish to NPM", w: 130, h: 50 },
      { id: "host-discovery", label: "Host Discovery", w: 130, h: 50 }
    ],
    edges: [
      { from: "scaffold", to: "define-manifest", label: "creates" },
      { from: "define-manifest", to: "implement-handlers", label: "guides" },
      { from: "implement-handlers", to: "build-package", label: "compiled into" },
      { from: "build-package", to: "publish-npm", label: "released as" },
      { from: "publish-npm", to: "host-discovery", label: "available for" },
      { from: "define-manifest", to: "host-discovery", label: "enables", dashed: true }
    ]
  };
}

// Plugin Capabilities Graph (based on glyphs description)
export function createPluginCapabilitiesGraph(): Graph {
  return {
    meta: { 
      layout: "radial", 
      theme: "light", 
      arrowHeads: false, 
      rounded: true 
    },
    nodes: [
      { id: "plugin-core", label: "Plugin Core", w: 100, h: 50 },
      { id: "plugin-icon", label: "Plugin Icon", w: 90, h: 40 },
      { id: "handler-icon", label: "Handler Icon", w: 90, h: 40 },
      { id: "event-icon", label: "Event Icon", w: 90, h: 40 },
      { id: "boundary-icon", label: "Boundary Icon", w: 100, h: 40 },
      { id: "security-icon", label: "Security Icon", w: 100, h: 40 },
      { id: "version-icon", label: "Version Icon", w: 90, h: 40 }
    ],
    edges: [
      { from: "plugin-core", to: "plugin-icon", label: "identifies" },
      { from: "plugin-core", to: "handler-icon", label: "exposes" },
      { from: "plugin-core", to: "event-icon", label: "emits" },
      { from: "plugin-core", to: "boundary-icon", label: "bounded by" },
      { from: "plugin-core", to: "security-icon", label: "secured by" },
      { from: "plugin-core", to: "version-icon", label: "versioned by" }
    ]
  };
}
