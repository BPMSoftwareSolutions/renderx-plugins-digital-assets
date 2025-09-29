#!/usr/bin/env node
// slide01-generator.ts - Generate slide 1 scene using advanced scene-graph system
import { renderScene } from "./render-svg";
import { slide01 } from "./slide01-data";
import * as fs from "fs";
import * as path from "path";

function generateSlide01Scene() {
  const outputDir = path.join(process.cwd(), "samples", "slide-01-scene");
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`🎨 Generating Slide 1 Scene using advanced scene-graph system...\n`);

  // Generate the main scene SVG
  const svg = renderScene(slide01);
  const svgPath = path.join(outputDir, "slide-01-manifest.svg");
  const jsonPath = path.join(outputDir, "slide-01-manifest.json");
  
  fs.writeFileSync(svgPath, svg);
  fs.writeFileSync(jsonPath, JSON.stringify(slide01, null, 2));
  
  console.log(`✅ Generated slide-01-manifest scene`);
  console.log(`   📊 ${slide01.nodes.length} top-level nodes, ${slide01.connectors?.length || 0} connectors`);
  console.log(`   🎨 Canvas: ${slide01.canvas.width}×${slide01.canvas.height}, Background: ${slide01.bg}`);
  console.log(`   🖼️  ${svgPath}`);
  console.log(`   📁 ${jsonPath}\n`);

  // Generate individual tile scenes for comparison
  const tiles = [
    { id: "plugin-package", name: "Plugin Package" },
    { id: "plugin-manifest", name: "Plugin Manifest" },
    { id: "handlers-export", name: "Handlers Export" },
    { id: "build-publish", name: "Build & Publish" },
    { id: "host-sdk", name: "Host SDK" }
  ];

  tiles.forEach(tile => {
    const tileNode = slide01.nodes.find(n => n.id === tile.id);
    if (!tileNode) return;

    // Create a scene with just this tile
    const tileScene = {
      ...slide01,
      id: `${slide01.id}-${tile.id}`,
      canvas: { width: 500, height: 200 },
      nodes: [{
        ...tileNode,
        at: { x: 40, y: 30 } // Center the tile in the smaller canvas
      }],
      connectors: [] // No connectors for individual tiles
    };

    const tileSvg = renderScene(tileScene);
    const tileSvgPath = path.join(outputDir, `${tile.id}.svg`);
    const tileJsonPath = path.join(outputDir, `${tile.id}.json`);
    
    fs.writeFileSync(tileSvgPath, tileSvg);
    fs.writeFileSync(tileJsonPath, JSON.stringify(tileScene, null, 2));
    
    console.log(`✅ Generated ${tile.name} tile`);
    console.log(`   🖼️  ${tileSvgPath}`);
    console.log(`   📁 ${tileJsonPath}`);
  });

  // Create an index file with metadata
  const indexData = {
    title: "Slide 1: Plugin Scaffolding & Manifest - Advanced Scene Graph",
    description: "Scene-graph representation with sprites, groups, z-ordering, and visual effects",
    source: "assets/plugin-architecture/plugin-integration-slides.json",
    generated: new Date().toISOString(),
    system: "Advanced Scene Graph (Issue #7)",
    features: [
      "Sprite-based composition with reusable symbols",
      "Hierarchical groups with z-ordering",
      "SVG filters and gradients for visual polish",
      "Connectors with routing (straight, orthogonal, curve)",
      "Precise positioning from slide specifications"
    ],
    scenes: [
      {
        name: "slide-01-manifest",
        description: "Complete slide 1 scene with all tiles and connectors",
        file: "slide-01-manifest.json",
        svg: "slide-01-manifest.svg",
        canvas: slide01.canvas,
        nodes: slide01.nodes.length,
        connectors: slide01.connectors?.length || 0
      },
      ...tiles.map(tile => ({
        name: tile.id,
        description: `Individual ${tile.name} tile scene`,
        file: `${tile.id}.json`,
        svg: `${tile.id}.svg`,
        canvas: { width: 500, height: 200 }
      }))
    ]
  };

  const indexPath = path.join(outputDir, "index.json");
  fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
  
  console.log(`\n📋 Created index: ${indexPath}`);
  console.log(`\n🎉 Generated advanced scene-graph representation of slide 1!`);
  console.log(`\n🔧 Features implemented:`);
  console.log(`   • Sprite-based composition with ${slide01.defs?.symbols?.length || 0} reusable symbols`);
  console.log(`   • Hierarchical groups with precise positioning`);
  console.log(`   • SVG filters (soft shadows) and gradients (violet arcs)`);
  console.log(`   • Connectors with curved and orthogonal routing`);
  console.log(`   • Dark theme background (#0f1116) matching slide aesthetic`);
  
  return tiles.length + 1; // +1 for main scene
}

// CLI usage
if (require.main === module) {
  generateSlide01Scene();
}
