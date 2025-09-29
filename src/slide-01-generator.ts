#!/usr/bin/env node
// slide-01-generator.ts - Generate graph specs for slide 1 elements
import { graphToSVG } from "./svg-export";
import {
  createPluginPackageGraph,
  createPluginManifestGraph,
  createHandlersExportGraph,
  createBuildPublishGraph,
  createHostSDKGraph,
  createSlide01ArchitectureGraph,
  createPluginWorkflowGraph,
  createPluginCapabilitiesGraph
} from "./slide-01-graph-specs";
import * as fs from "fs";
import * as path from "path";

function generateSlide01Graphs() {
  const outputDir = path.join(process.cwd(), "samples", "slide-01");
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const graphs = [
    { 
      name: "plugin-package-structure", 
      graph: createPluginPackageGraph(),
      description: "Internal structure of the plugin package showing relationships between box, shadow, label, glyphs, and npm badge"
    },
    { 
      name: "plugin-manifest-structure", 
      graph: createPluginManifestGraph(),
      description: "Internal structure of the plugin manifest showing document card, JSON braces, key-value rows, stamp, and tabs"
    },
    { 
      name: "handlers-export-structure", 
      graph: createHandlersExportGraph(),
      description: "Internal structure of handlers export showing connectors, ports, gradient, and circuit traces"
    },
    { 
      name: "build-publish-process", 
      graph: createBuildPublishGraph(),
      description: "Build and publish process flow from conveyor to staging to publication"
    },
    { 
      name: "host-sdk-structure", 
      graph: createHostSDKGraph(),
      description: "Host SDK internal structure showing console, rails, ports, and modules"
    },
    { 
      name: "slide-01-architecture", 
      graph: createSlide01ArchitectureGraph(),
      description: "Overall architecture of slide 1 showing relationships between main elements"
    },
    { 
      name: "plugin-workflow", 
      graph: createPluginWorkflowGraph(),
      description: "Plugin development workflow from scaffolding to host discovery"
    },
    { 
      name: "plugin-capabilities", 
      graph: createPluginCapabilitiesGraph(),
      description: "Plugin capabilities represented by the glyphs (icons, handlers, events, boundaries, security, versioning)"
    }
  ];

  console.log(`🎨 Generating ${graphs.length} graph specifications for Slide 1...\n`);

  graphs.forEach(({ name, graph, description }) => {
    const svg = graphToSVG(graph);
    const jsonPath = path.join(outputDir, `${name}.json`);
    const svgPath = path.join(outputDir, `${name}.svg`);
    
    // Add description to the graph metadata
    const graphWithDescription = {
      ...graph,
      description,
      source: "slide-01-manifest elements from plugin-integration-slides.json"
    };
    
    fs.writeFileSync(jsonPath, JSON.stringify(graphWithDescription, null, 2));
    fs.writeFileSync(svgPath, svg);
    
    console.log(`✅ ${name}`);
    console.log(`   📊 ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    console.log(`   🎨 Layout: ${graph.meta?.layout || 'grid'}, Theme: ${graph.meta?.theme || 'light'}`);
    console.log(`   📝 ${description}`);
    console.log(`   📁 ${jsonPath}`);
    console.log(`   🖼️  ${svgPath}\n`);
  });

  // Create an index file with all graphs
  const indexData = {
    title: "Slide 1: Plugin Scaffolding & Manifest - Graph Specifications",
    description: "Graph representations of the elements and relationships described in slide-01-manifest",
    source: "assets/plugin-architecture/plugin-integration-slides.json",
    generated: new Date().toISOString(),
    graphs: graphs.map(({ name, description, graph }) => ({
      name,
      description,
      file: `${name}.json`,
      svg: `${name}.svg`,
      nodes: graph.nodes.length,
      edges: graph.edges.length,
      layout: graph.meta?.layout || 'grid',
      theme: graph.meta?.theme || 'light'
    }))
  };

  const indexPath = path.join(outputDir, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  
  console.log(`📋 Created index: ${indexPath}`);
  console.log(`\n🎉 Generated ${graphs.length} graph specifications based on slide 1 element descriptions!`);
  
  return graphs.length;
}

// CLI usage
if (require.main === module) {
  generateSlide01Graphs();
}
