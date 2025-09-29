import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { renderScene } from './render-svg';
import type { Scene } from './scene';

/**
 * Canvas Scene Demo
 * 
 * Tests the new raw-svg node type with USE_DEFS_RAWSVG functionality
 * to render scenes that match the original canvas file content.
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');

function loadSceneConfig(filename: string): Scene {
  const filePath = join(SAMPLES_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Scene;
}

function saveSceneOutput(filename: string, svgContent: string): void {
  const filePath = join(SAMPLES_DIR, filename);
  writeFileSync(filePath, svgContent, 'utf-8');
  console.log(`✅ Saved: ${filename}`);
}

async function main(): Promise<void> {
  console.log('🎨 Canvas Scene Demo');
  console.log('Testing raw-svg node type with canvas-extracted content...\n');
  
  try {
    // Test Scene 1: Depot
    console.log('📄 Processing Scene 1: Bus Leaving Depot');
    const scene1 = loadSceneConfig('event-router-scene-1-depot.json');
    const svg1 = renderScene(scene1);
    saveSceneOutput('canvas-scene-1-depot.svg', svg1);
    
    console.log(`   ✅ Scene 1 rendered successfully`);
    console.log(`   📊 Canvas: ${scene1.canvas.width}x${scene1.canvas.height}`);
    console.log(`   🎯 Nodes: ${scene1.nodes.length}`);
    console.log(`   📝 Raw SVG lines: ${scene1.defs?.rawSvg?.length || 0}\n`);
    
    console.log('🎊 Canvas Scene Demo Complete!');
    console.log('\nThe scene has been rendered using the graph-to-SVG system');
    console.log('with the actual animated content from the original canvas file.');
    console.log('\nThis demonstrates that the SVG content is now generated from');
    console.log('graph configurations (single source of truth) rather than');
    console.log('extracted directly from the canvas file.');
    
  } catch (error) {
    console.error('❌ Error during canvas scene demo:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main().catch(console.error);
}

export { main as runCanvasSceneDemo };
