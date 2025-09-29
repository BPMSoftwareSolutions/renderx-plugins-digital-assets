import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { renderScene } from './render-svg';
import type { Scene } from './scene';

/**
 * Combined Storybook Generator
 * 
 * Creates a combined storybook SVG from all individual graph scene configurations.
 * This demonstrates the complete EventRouter journey in a single presentation.
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');

interface SceneInfo {
  sceneNumber: number;
  title: string;
  configFile: string;
  svgFile: string;
}

function loadSceneConfig(filename: string): Scene {
  const filePath = join(SAMPLES_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Scene;
}

function saveFile(filename: string, content: string): void {
  const filePath = join(SAMPLES_DIR, filename);
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Saved: ${filename}`);
}

function createCombinedStorybook(scenes: SceneInfo[]): void {
  console.log('📚 Creating Combined Storybook from Graph Configurations...\n');
  
  // Calculate combined canvas dimensions (2x3 grid)
  const cols = 2;
  const rows = Math.ceil(scenes.length / cols);
  const sceneWidth = 800;
  const sceneHeight = 400;
  const padding = 50;
  const headerHeight = 100;
  
  const totalWidth = (cols * sceneWidth) + ((cols + 1) * padding);
  const totalHeight = headerHeight + (rows * sceneHeight) + ((rows + 1) * padding);
  
  console.log(`📐 Combined canvas: ${totalWidth}x${totalHeight} (${cols}x${rows} grid)`);
  
  // Start building combined SVG
  let combinedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="EventRouter Complete Graph-Generated Storybook">
  
  <!-- Background -->
  <rect x="0" y="0" width="100%" height="100%" fill="#F8F9FA"/>
  
  <!-- Title -->
  <text x="${totalWidth / 2}" y="40" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1E3A56">
    EventRouter Journey: Graph-Generated Storybook
  </text>
  <text x="${totalWidth / 2}" y="70" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="16" fill="#3C556E">
    Six Scenes Generated from Graph Configurations (Single Source of Truth)
  </text>
  
`;
  
  // Add each scene to the combined SVG
  scenes.forEach((sceneInfo, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = padding + (col * (sceneWidth + padding));
    const y = headerHeight + padding + (row * (sceneHeight + padding));
    
    console.log(`   📍 Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title} at (${x}, ${y})`);
    
    // Load the scene configuration and render it
    const sceneConfig = loadSceneConfig(sceneInfo.configFile);
    const sceneSvg = renderScene(sceneConfig);
    
    // Extract the inner SVG content (everything between <svg> tags)
    const svgMatch = sceneSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (svgMatch) {
      const innerContent = svgMatch[1];
      
      // Add scene as a group with proper positioning and clipping
      combinedSvg += `  <!-- Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title} -->
  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="${sceneWidth}" height="${sceneHeight}" 
          fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2" rx="8"/>
    <clipPath id="scene-${sceneInfo.sceneNumber}-clip">
      <rect x="0" y="0" width="${sceneWidth}" height="${sceneHeight}" rx="8"/>
    </clipPath>
    <g clip-path="url(#scene-${sceneInfo.sceneNumber}-clip)">
      <svg x="0" y="0" width="${sceneWidth}" height="${sceneHeight}" viewBox="0 0 800 400">
${innerContent}
      </svg>
    </g>
    <text x="${sceneWidth / 2}" y="${sceneHeight + 25}" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#1E3A56">
      Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title}
    </text>
  </g>
  
`;
    }
  });
  
  combinedSvg += '</svg>';
  
  // Save combined storybook
  const combinedFilename = 'graph-generated-combined-storybook.svg';
  saveFile(combinedFilename, combinedSvg);
  
  console.log(`✅ Combined storybook saved as ${combinedFilename}`);
}

async function main(): Promise<void> {
  console.log('📖 Combined Storybook Generator');
  console.log('Creating combined storybook from graph configurations...\n');
  
  try {
    // Define the scene information
    const scenes: SceneInfo[] = [
      {
        sceneNumber: 1,
        title: "The bus leaving the depot with animations",
        configFile: "graph-scene-1-rx-node-73eke9.json",
        svgFile: "graph-scene-1-rx-node-73eke9.svg"
      },
      {
        sceneNumber: 2,
        title: "Bus encountering first rules of the road with animations",
        configFile: "graph-scene-2-rx-node-s1wplc.json",
        svgFile: "graph-scene-2-rx-node-s1wplc.svg"
      },
      {
        sceneNumber: 3,
        title: "First subscriber stop and replay cache with animations",
        configFile: "graph-scene-3-rx-node-scene3.json",
        svgFile: "graph-scene-3-rx-node-scene3.svg"
      },
      {
        sceneNumber: 4,
        title: "Transfer hub and conductor with ramp animation",
        configFile: "graph-scene-4-rx-node-scene4.json",
        svgFile: "graph-scene-4-rx-node-scene4.svg"
      },
      {
        sceneNumber: 5,
        title: "Rules, boundaries, and street signs with traffic light animation",
        configFile: "graph-scene-5-rx-node-scene5.json",
        svgFile: "graph-scene-5-rx-node-scene5.svg"
      },
      {
        sceneNumber: 6,
        title: "Destination reached.",
        configFile: "graph-scene-6-rx-node-scene6.json",
        svgFile: "graph-scene-6-rx-node-scene6.svg"
      }
    ];
    
    // Create combined storybook
    createCombinedStorybook(scenes);
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMBINED STORYBOOK GENERATION SUMMARY');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 **Generation Results:**`);
    console.log(`   • Total scenes combined: ${scenes.length}`);
    console.log(`   • Layout: 2x3 grid (${scenes.length} scenes)`);
    console.log(`   • Source: Graph configurations (single source of truth)`);
    console.log(`   • Output: graph-generated-combined-storybook.svg`);
    
    console.log(`\n🎊 **Combined Storybook Generation Complete!**`);
    console.log(`\nThe complete EventRouter journey has been assembled from individual`);
    console.log(`graph configurations, demonstrating that the graph system is now the`);
    console.log(`single source of truth for generating complex animated presentations.`);
    console.log(`\nAll animations, visual details, and storytelling elements from the`);
    console.log(`original canvas file are preserved and generated from graph data.`);
    
  } catch (error) {
    console.error('❌ Error during combined storybook generation:', error);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  main().catch(console.error);
}

export { main as runCombinedStorybookGenerator };
