// create-mono-journey.ts
import { createMonoGraph, saveMonoGraph } from './mono-graph-generator';

/**
 * Script to create the EventRouter mono journey configuration
 */

// Use the same graph scene files that generate the combined storybook
// This ensures visual consistency with graph-generated-combined-storybook.svg
const EVENTROUTER_SCENES = [
  'graph-scene-1-rx-node-73eke9.json',
  'graph-scene-2-rx-node-s1wplc.json',
  'graph-scene-3-rx-node-scene3.json',
  'graph-scene-4-rx-node-scene4.json',
  'graph-scene-5-rx-node-scene5.json',
  'graph-scene-6-rx-node-scene6.json'
];

function main() {
  console.log('🚌 Creating EventRouter Mono Journey...\n');
  
  // Create the mono graph with linear horizontal layout for seamless bus travel
  const monoGraph = createMonoGraph(EVENTROUTER_SCENES, {
    id: 'event-router-mono-journey',
    title: 'EventRouter Journey: Seamless Bus Travel Through All Scenes',
    layout: {
      type: 'linear',
      direction: 'horizontal',
      spacing: 100 // 100px between scenes for smooth transitions
    },
    canvas: {
      width: 5400, // 6 scenes * 800px + 5 gaps * 100px + margins
      height: 600   // 400px scene height + margins
    },
    totalDuration: 30, // 5 seconds per scene
    loop: true
  });
  
  console.log(`📊 Mono Graph Created:`);
  console.log(`   - ID: ${monoGraph.id}`);
  console.log(`   - Canvas: ${monoGraph.canvas.width}x${monoGraph.canvas.height}`);
  console.log(`   - Scenes: ${monoGraph.scenes.length}`);
  console.log(`   - Total Duration: ${monoGraph.timeline.totalDuration}s`);
  console.log(`   - Connections: ${monoGraph.connections.length}\n`);
  
  // Save the mono graph configuration
  saveMonoGraph(monoGraph, 'event-router-mono-journey.json');
  
  console.log('✅ Mono journey configuration saved to samples/event-router-mono-journey.json');
  console.log('\n🎬 Next steps:');
  console.log('   1. Generate SVG from mono graph');
  console.log('   2. Test seamless bus travel');
  console.log('   3. Validate scene transitions');
}

if (require.main === module) {
  main();
}
