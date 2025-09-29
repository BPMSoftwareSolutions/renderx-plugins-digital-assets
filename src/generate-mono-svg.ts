// generate-mono-svg.ts
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { renderMonoGraph } from './mono-graph-generator';
import type { MonoGraph } from './mono-graph-types';

/**
 * Script to generate SVG from the EventRouter mono journey configuration
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');

function main() {
  console.log('🎨 Generating EventRouter Mono Journey SVG...\n');
  
  try {
    // Load the mono graph configuration
    const configPath = join(SAMPLES_DIR, 'event-router-mono-journey.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const monoGraph: MonoGraph = JSON.parse(configContent);
    
    console.log(`📊 Loaded Mono Graph:`);
    console.log(`   - ID: ${monoGraph.id}`);
    console.log(`   - Canvas: ${monoGraph.canvas.width}x${monoGraph.canvas.height}`);
    console.log(`   - Scenes: ${monoGraph.scenes.length}`);
    console.log(`   - Duration: ${monoGraph.timeline.totalDuration}s`);
    console.log(`   - Connections: ${monoGraph.connections.length}\n`);
    
    // Generate SVG
    console.log('🎬 Rendering mono graph to SVG...');
    const svg = renderMonoGraph(monoGraph);
    
    // Save SVG file
    const svgPath = join(SAMPLES_DIR, 'event-router-mono-journey.svg');
    writeFileSync(svgPath, svg);
    
    console.log(`✅ SVG generated successfully!`);
    console.log(`   - File: ${svgPath}`);
    console.log(`   - Size: ${Math.round(svg.length / 1024)}KB`);
    console.log(`   - Dimensions: ${monoGraph.canvas.width}x${monoGraph.canvas.height}`);
    
    console.log('\n🚌 Mono Journey Features:');
    console.log('   ✓ Seamless bus travel through all 6 scenes');
    console.log('   ✓ Unified animation timeline');
    console.log('   ✓ Scene boundaries and transitions');
    console.log('   ✓ Progress indicator');
    console.log('   ✓ Connection paths between scenes');
    
    console.log('\n🎯 Next Steps:');
    console.log('   1. Open the SVG in a browser to test animations');
    console.log('   2. Validate bus travel continuity');
    console.log('   3. Check scene content preservation');
    console.log('   4. Test in different browsers');
    
  } catch (error) {
    console.error('❌ Error generating mono journey SVG:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
