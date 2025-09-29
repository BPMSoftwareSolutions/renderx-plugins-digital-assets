// create-mono-journey.ts
import { createMonoGraph, saveMonoGraph } from './mono-graph-generator';

/**
 * Script to create the EventRouter mono journey configuration
 */

const EVENTROUTER_SCENES = [
  'event-router-scene-1-depot.json',
  'event-router-scene-2-manifest.json', 
  'event-router-scene-3-subscribers.json',
  'event-router-scene-4-conductor.json',
  'event-router-scene-5-rules.json',
  'event-router-scene-6-school.json'
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
