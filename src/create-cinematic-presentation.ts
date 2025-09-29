// create-cinematic-presentation.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { createCinematicPresentation, saveCinematicPresentation } from './cinematic-renderer';
import type { MonoGraph } from './mono-graph-types';

/**
 * Script to create the EventRouter cinematic presentation
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');

function main() {
  console.log('🎬 Creating EventRouter Cinematic Presentation...\n');
  
  try {
    // Load the mono graph configuration
    const configPath = join(SAMPLES_DIR, 'event-router-mono-journey.json');
    const configContent = readFileSync(configPath, 'utf-8');
    const monoGraph: MonoGraph = JSON.parse(configContent);
    
    console.log(`📊 Loaded Mono Graph:`);
    console.log(`   - ID: ${monoGraph.id}`);
    console.log(`   - Scenes: ${monoGraph.scenes.length}`);
    console.log(`   - Canvas: ${monoGraph.canvas.width}x${monoGraph.canvas.height}\n`);
    
    // Create cinematic presentation
    console.log('🎭 Creating cinematic presentation...');
    const cinematicPresentation = createCinematicPresentation(monoGraph);
    
    console.log(`📽️ Cinematic Presentation Created:`);
    console.log(`   - ID: ${cinematicPresentation.id}`);
    console.log(`   - Title: ${cinematicPresentation.title}`);
    console.log(`   - Scenes: ${cinematicPresentation.scenes.length}`);
    console.log(`   - Viewport: ${cinematicPresentation.canvas.width}x${cinematicPresentation.canvas.height}`);
    console.log(`   - Auto Play: ${cinematicPresentation.controls.autoPlay}`);
    console.log(`   - Loop: ${cinematicPresentation.controls.loop}`);
    console.log(`   - Manual Navigation: ${cinematicPresentation.controls.allowManualNavigation}\n`);
    
    // Save cinematic presentation
    console.log('💾 Saving cinematic presentation...');
    saveCinematicPresentation(cinematicPresentation, 'event-router-cinematic-presentation.html');
    
    console.log('✅ Cinematic presentation created successfully!');
    console.log(`   - File: ${join(SAMPLES_DIR, 'event-router-cinematic-presentation.html')}`);
    
    console.log('\n🎬 Cinematic Features:');
    console.log('   ✓ Full-screen scene presentation');
    console.log('   ✓ Smooth scene transitions (fade & slide)');
    console.log('   ✓ Interactive controls (play/pause, navigation)');
    console.log('   ✓ Progress indicator');
    console.log('   ✓ Keyboard shortcuts (space, arrows, r)');
    console.log('   ✓ Auto-play with loop option');
    
    console.log('\n🎯 Usage Instructions:');
    console.log('   1. Open event-router-cinematic-presentation.html in a browser');
    console.log('   2. Use controls or keyboard shortcuts:');
    console.log('      - Space: Play/Pause');
    console.log('      - Left/Right arrows: Navigate scenes');
    console.log('      - R: Restart presentation');
    console.log('   3. Enjoy the cinematic EventRouter journey!');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Test the cinematic presentation in different browsers');
    console.log('   2. Validate scene transitions and timing');
    console.log('   3. Check interactive controls functionality');
    console.log('   4. Consider additional transition effects');
    
  } catch (error) {
    console.error('❌ Error creating cinematic presentation:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
