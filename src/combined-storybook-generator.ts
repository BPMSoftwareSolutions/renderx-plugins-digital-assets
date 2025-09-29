import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { renderScene } from './render-svg';
import type { Scene } from './scene';
import type {
  CombinedStorybookConfig,
  EnhancedSceneInfo,
  CombinedStorybookTimeline
} from './combined-storybook-types';
import {
  createAnimationTimeline,
  generateBusAnimationValues,
  generateSceneTransitionCSS
} from './animation-coordinator';

/**
 * Enhanced Combined Storybook Generator with Scene-by-Scene Animation Triggers
 *
 * Creates a combined storybook SVG with coordinated animations where:
 * - Bus leaving scene N triggers bus entering scene N+1
 * - Scenes are highlighted/dimmed based on bus presence
 * - Smooth transitions between scene boundaries
 * - Configurable timing and duration settings
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');

// Legacy interface for backward compatibility
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

/**
 * Create default combined storybook configuration
 */
function createDefaultConfig(): CombinedStorybookConfig {
  const sceneWidth = 800;
  const sceneHeight = 400;
  const padding = 50;
  const headerHeight = 100;
  const cols = 2;
  const rows = 3;

  const totalWidth = (cols * sceneWidth) + ((cols + 1) * padding);
  const totalHeight = headerHeight + (rows * sceneHeight) + ((rows + 1) * padding);

  return {
    id: 'enhanced-combined-storybook',
    title: 'EventRouter Journey: Enhanced Combined Storybook',
    canvas: {
      width: totalWidth,
      height: totalHeight
    },
    layout: {
      cols,
      rows,
      sceneWidth,
      sceneHeight,
      padding,
      headerHeight
    },
    timing: {
      totalDuration: 60, // 60 seconds total journey
      sceneDuration: 8,  // 8 seconds per scene
      transitionDuration: 2, // 2 seconds transition between scenes
      loop: true,
      autoPlay: true
    },
    scenes: [], // Will be populated
    bus: {
      sprite: '', // No unified sprite needed - using graph content
      size: { width: 60, height: 30 },
      speed: 100,
      enabled: false // Individual scene buses from graphs provide coordination
    },
    controls: {
      showProgress: true,
      allowPlayPause: true,
      allowSceneNavigation: true,
      showSceneHighlighting: true
    }
  };
}



/**
 * Apply bus animation coordination to create illusion of single bus traveling between scenes
 */
function applyBusCoordination(svgContent: string, sceneNumber: number): string {
  // Calculate cumulative delays and durations for each scene
  const sceneTimings = [
    { delay: 0, duration: 8, exitTime: 6 },    // Scene 1: starts immediately, exits at 6s
    { delay: 6, duration: 12, exitTime: 16 },  // Scene 2: starts at 6s, exits at 16s
    { delay: 16, duration: 15, exitTime: 28 }, // Scene 3: starts at 16s, exits at 28s
    { delay: 28, duration: 18, exitTime: 42 }, // Scene 4: starts at 28s, exits at 42s
    { delay: 42, duration: 16, exitTime: 56 }, // Scene 5: starts at 42s, exits at 56s
    { delay: 56, duration: 12, exitTime: 68 }  // Scene 6: starts at 56s, exits at 68s
  ];

  const timing = sceneTimings[sceneNumber - 1];
  if (!timing) return svgContent;

  // Add visibility control and animation coordination
  let modifiedContent = svgContent;

  // 1. Add visibility control to the school bus group
  const busGroupRegex = /(<g id="school-bus"[^>]*>)/;
  modifiedContent = modifiedContent.replace(busGroupRegex, (match, busGroup) => {
    if (sceneNumber === 1) {
      // Scene 1: visible initially, hide when Scene 2 starts
      const totalDuration = 100; // Use a long duration to cover the entire animation
      const hideTime = 6 / totalDuration; // Hide at 6s

      return `${busGroup}
<!-- Bus visibility: Scene 1 visible initially, hide at 6s -->
<animate attributeName="opacity"
         values="1;1;0"
         keyTimes="0;${hideTime};1"
         dur="${totalDuration}s"
         begin="0s"
         fill="freeze"/>`;
    } else {
      // Other scenes: hidden initially, show when scene starts, hide when next scene starts
      const nextSceneStart = sceneTimings[sceneNumber] ? sceneTimings[sceneNumber].delay : timing.exitTime;
      const totalDuration = 100; // Use a long duration to cover the entire animation

      // Calculate keyframe percentages for precise timing
      const showTime = timing.delay / totalDuration;
      const hideTime = nextSceneStart / totalDuration;

      return `${busGroup}
<!-- Bus visibility: Scene ${sceneNumber} hidden initially, show at ${timing.delay}s, hide at ${nextSceneStart}s -->
<animate attributeName="opacity"
         values="0;0;1;1;0"
         keyTimes="0;${showTime};${showTime + 0.01};${hideTime};1"
         dur="${totalDuration}s"
         begin="0s"
         fill="freeze"/>`;
    }
  });

  // 2. Modify the bus animateTransform to include begin delay and proper closing
  const busAnimationRegex = /(<animateTransform[^>]*attributeName="transform"[^>]*type="translate"[^>]*)(dur="[^"]*"[^>]*)(repeatCount="[^"]*"[^>]*\/>)/g;

  modifiedContent = modifiedContent.replace(busAnimationRegex, (match, prefix, durPart, suffix) => {
    // Add begin attribute to delay the animation and make it run once with proper self-closing tag
    return `${prefix}begin="${timing.delay}s" ${durPart}repeatCount="1"/>`;
  });

  // 3. Bus visibility is now controlled by opacity animations in step 1

  return modifiedContent;
}

/**
 * Convert legacy SceneInfo to EnhancedSceneInfo with positioning and bus travel
 */
function enhanceSceneInfo(scenes: SceneInfo[], config: CombinedStorybookConfig): EnhancedSceneInfo[] {
  return scenes.map((scene, index) => {
    const col = index % config.layout.cols;
    const row = Math.floor(index / config.layout.cols);
    const x = config.layout.padding + (col * (config.layout.sceneWidth + config.layout.padding));
    const y = config.layout.headerHeight + config.layout.padding + (row * (config.layout.sceneHeight + config.layout.padding));

    return {
      ...scene,
      timing: {
        startTime: 0, // Will be calculated by animation coordinator
        duration: config.timing.sceneDuration,
        busEnterTime: 0, // Will be calculated
        busExitTime: 0, // Will be calculated
        transitionDuration: config.timing.transitionDuration
      },
      position: { x, y },
      busTravel: {
        entryPoint: { x: 20, y: config.layout.sceneHeight / 2 }, // Bus enters from left edge of scene
        exitPoint: { x: config.layout.sceneWidth - 80, y: config.layout.sceneHeight / 2 } // Bus exits from right edge of scene
      }
    };
  });
}

/**
 * Enhanced combined storybook creation with animation coordination
 */
function createEnhancedCombinedStorybook(scenes: SceneInfo[]): void {
  console.log('📚 Creating Enhanced Combined Storybook with Scene-by-Scene Animation Triggers...\n');

  // Create configuration
  const config = createDefaultConfig();
  config.scenes = enhanceSceneInfo(scenes, config);

  console.log(`📐 Enhanced canvas: ${config.canvas.width}x${config.canvas.height} (${config.layout.cols}x${config.layout.rows} grid)`);
  console.log(`⏱️  Total duration: ${config.timing.totalDuration}s with ${config.timing.transitionDuration}s transitions`);

  // Create animation timeline and update config with calculated timing
  const timeline = createAnimationTimeline(config);

  // Update config scenes with calculated timing from the timeline
  config.scenes = config.scenes.map((scene, index) => {
    const sceneCount = config.scenes.length;
    const sceneDuration = (config.timing.totalDuration - (config.timing.transitionDuration * (sceneCount - 1))) / sceneCount;
    const startTime = index * (sceneDuration + config.timing.transitionDuration);

    return {
      ...scene,
      timing: {
        startTime,
        duration: sceneDuration,
        busEnterTime: startTime + 0.5,
        busExitTime: startTime + sceneDuration - 0.5,
        transitionDuration: config.timing.transitionDuration
      }
    };
  });

  // Generate SVG content
  const combinedSvg = generateEnhancedSVG(config, timeline);

  // Save enhanced combined storybook
  const enhancedFilename = 'enhanced-combined-storybook.svg';
  saveFile(enhancedFilename, combinedSvg);

  console.log(`✅ Enhanced combined storybook saved as ${enhancedFilename}`);
  console.log(`🎬 Animation features: Scene coordination, Bus travel, Visual transitions`);
}

/**
 * Generate the complete enhanced SVG with coordinated animations
 */
function generateEnhancedSVG(config: CombinedStorybookConfig, timeline: CombinedStorybookTimeline): string {
  const { canvas, layout, timing, bus } = config;

  // Start building enhanced SVG
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${config.title}">

  <defs>
    <!-- Glow filter for scene highlighting -->
    <filter id="scene-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Progress bar gradient -->
    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>

  <style>
    ${generateSceneTransitionCSS(timeline.sceneKeyframes, timing.totalDuration)}

    .progress-bar {
      fill: url(#progress-gradient);
      animation: progress-fill ${timing.totalDuration}s linear ${timing.loop ? 'infinite' : '1'};
    }

    @keyframes progress-fill {
      from { width: 0; }
      to { width: ${canvas.width - 100}px; }
    }

    .connection-path {
      stroke: #8b5cf6;
      stroke-width: 2;
      stroke-dasharray: 5,5;
      fill: none;
      opacity: 0.6;
      animation: dash-flow 2s linear infinite;
    }

    @keyframes dash-flow {
      to { stroke-dashoffset: -10; }
    }
  </style>

  <!-- Background -->
  <rect x="0" y="0" width="100%" height="100%" fill="#F8F9FA"/>

  <!-- Title -->
  <text x="${canvas.width / 2}" y="40" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1E3A56">
    ${config.title}
  </text>
  <text x="${canvas.width / 2}" y="70" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="16" fill="#3C556E">
    Enhanced with Scene-by-Scene Animation Coordination
  </text>

  <!-- Progress bar -->
  <rect x="50" y="85" width="${canvas.width - 100}" height="4" fill="#E0E0E0" rx="2"/>
  <rect x="50" y="85" width="0" height="4" class="progress-bar" rx="2"/>

`;

  // Add connection paths between scenes
  if (timeline.connectionPaths) {
    svg += '  <!-- Connection paths between scenes -->\n';
    timeline.connectionPaths.forEach(path => {
      svg += `  <path d="${path.path}" class="connection-path"/>\n`;
    });
    svg += '\n';
  }

  // Add each scene with enhanced features
  config.scenes.forEach((sceneInfo, index) => {
    const { position, timing } = sceneInfo;

    console.log(`   📍 Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title} at (${position.x}, ${position.y})`);

    // Load the scene configuration and render it
    const sceneConfig = loadSceneConfig(sceneInfo.configFile);
    const sceneSvg = renderScene(sceneConfig);

    // Extract the inner SVG content (everything between <svg> tags)
    const svgMatch = sceneSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (svgMatch) {
      let innerContent = svgMatch[1];

      // Keep original graph content intact - graph is the single source of truth

      // Apply bus animation coordination to create illusion of single bus
      innerContent = applyBusCoordination(innerContent, sceneInfo.sceneNumber);

      // Add scene as a group with enhanced features
      svg += `  <!-- Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title} -->
  <g class="scene-${sceneInfo.sceneNumber}" transform="translate(${position.x}, ${position.y})">
    <rect x="0" y="0" width="${layout.sceneWidth}" height="${layout.sceneHeight}"
          fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2" rx="8" class="scene-border"/>

    <!-- Scene timing indicator -->
    <rect x="5" y="5" width="20" height="4" fill="#E0E0E0" rx="2"/>
    <rect x="5" y="5" width="0" height="4" fill="#8b5cf6" rx="2" class="scene-progress">
      <animate attributeName="width"
               values="0;20;20;0"
               dur="${config.timing.totalDuration}s"
               begin="${timing.startTime}s"
               repeatCount="${config.timing.loop ? 'indefinite' : '1'}"/>
    </rect>

    <clipPath id="scene-${sceneInfo.sceneNumber}-clip">
      <rect x="0" y="0" width="${layout.sceneWidth}" height="${layout.sceneHeight}" rx="8"/>
    </clipPath>
    <g clip-path="url(#scene-${sceneInfo.sceneNumber}-clip)">
      <svg x="0" y="0" width="${layout.sceneWidth}" height="${layout.sceneHeight}" viewBox="0 0 800 400">
${innerContent}
      </svg>
    </g>
    <text x="${layout.sceneWidth / 2}" y="${layout.sceneHeight + 25}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#1E3A56">
      Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title}
    </text>
  </g>

`;
    }
  });

  // Add progress indicator
  svg += `  <!-- Progress Indicator -->
  <g id="progress-indicator" transform="translate(50, 50)">
    <rect x="0" y="0" width="200" height="20" fill="#E0E0E0" rx="10"/>
    <rect x="0" y="0" width="0" height="20" fill="#4CAF50" rx="10">
      <animate attributeName="width"
               values="0;200"
               dur="${timing.totalDuration}s"
               repeatCount="${timing.loop ? 'indefinite' : '1'}"/>
    </rect>
    <text x="100" y="35" text-anchor="middle" font-family="Arial" font-size="12" fill="#333">
      Journey Progress
    </text>
  </g>

`;

  // Bus coordination is applied directly to individual scene animations

  // Add controls if enabled
  if (config.controls?.allowPlayPause) {
    svg += `  <!-- Play/Pause Controls -->
  <g id="playback-controls" transform="translate(50, ${canvas.height - 50})">
    <rect x="0" y="0" width="100" height="30" fill="#8b5cf6" rx="4" opacity="0.8"/>
    <text x="50" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="12">
      Click to Play/Pause
    </text>
  </g>

`;
  }

  svg += '</svg>';

  return svg;
}

async function main(): Promise<void> {
  console.log('📖 Enhanced Combined Storybook Generator');
  console.log('Creating enhanced combined storybook with scene-by-scene animation triggers...\n');

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

    // Create enhanced combined storybook with animation coordination
    createEnhancedCombinedStorybook(scenes);

    // Also create legacy version for backward compatibility
    createCombinedStorybook(scenes);

    console.log('\n' + '='.repeat(80));
    console.log('📋 ENHANCED COMBINED STORYBOOK GENERATION SUMMARY');
    console.log('='.repeat(80));

    console.log(`\n🎯 **Generation Results:**`);
    console.log(`   • Total scenes combined: ${scenes.length}`);
    console.log(`   • Layout: 2x3 grid with coordinated animations`);
    console.log(`   • Animation: Scene-by-scene bus travel triggers`);
    console.log(`   • Features: Progress indicator, scene highlighting, smooth transitions`);
    console.log(`   • Source: Graph configurations (single source of truth)`);
    console.log(`   • Output: enhanced-combined-storybook.svg`);

    console.log(`\n🎊 **Enhanced Combined Storybook Generation Complete!**`);
    console.log(`\nThe complete EventRouter journey now features coordinated animations where:`);
    console.log(`• Bus leaving Scene N triggers bus entering Scene N+1`);
    console.log(`• Scenes are highlighted when bus is present`);
    console.log(`• Smooth visual transitions between scene boundaries`);
    console.log(`• Configurable timing and duration settings`);
    console.log(`• Progress indicator shows journey completion`);
    console.log(`\nAll enhancements maintain the graph system as the single source of truth.`);

  } catch (error) {
    console.error('❌ Error during enhanced combined storybook generation:', error);
    process.exit(1);
  }
}

/**
 * Legacy function for backward compatibility
 */
function createCombinedStorybook(scenes: SceneInfo[]): void {
  console.log('📚 Creating Legacy Combined Storybook (for backward compatibility)...\n');

  // Use the enhanced version but with simpler output name
  createEnhancedCombinedStorybook(scenes);

  // Also create a simplified version without enhanced features for legacy support
  const config = createDefaultConfig();
  config.scenes = enhanceSceneInfo(scenes, config);

  // Generate simple SVG without animations for legacy compatibility
  const simpleSvg = generateLegacySVG(config);
  saveFile('graph-generated-combined-storybook.svg', simpleSvg);

  console.log(`✅ Legacy combined storybook also saved as graph-generated-combined-storybook.svg`);
}

/**
 * Generate legacy SVG without enhanced animations for backward compatibility
 */
function generateLegacySVG(config: CombinedStorybookConfig): string {
  const { canvas, layout } = config;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="EventRouter Complete Graph-Generated Storybook">

  <!-- Background -->
  <rect x="0" y="0" width="100%" height="100%" fill="#F8F9FA"/>

  <!-- Title -->
  <text x="${canvas.width / 2}" y="40" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1E3A56">
    EventRouter Journey: Graph-Generated Storybook
  </text>
  <text x="${canvas.width / 2}" y="70" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="16" fill="#3C556E">
    Six Scenes Generated from Graph Configurations (Single Source of Truth)
  </text>

`;

  // Add each scene without enhanced features
  config.scenes.forEach((sceneInfo) => {
    const { position } = sceneInfo;

    // Load the scene configuration and render it
    const sceneConfig = loadSceneConfig(sceneInfo.configFile);
    const sceneSvg = renderScene(sceneConfig);

    // Extract the inner SVG content
    const svgMatch = sceneSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (svgMatch) {
      const innerContent = svgMatch[1];

      svg += `  <!-- Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title} -->
  <g transform="translate(${position.x}, ${position.y})">
    <rect x="0" y="0" width="${layout.sceneWidth}" height="${layout.sceneHeight}"
          fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2" rx="8"/>
    <clipPath id="scene-${sceneInfo.sceneNumber}-clip">
      <rect x="0" y="0" width="${layout.sceneWidth}" height="${layout.sceneHeight}" rx="8"/>
    </clipPath>
    <g clip-path="url(#scene-${sceneInfo.sceneNumber}-clip)">
      <svg x="0" y="0" width="${layout.sceneWidth}" height="${layout.sceneHeight}" viewBox="0 0 800 400">
${innerContent}
      </svg>
    </g>
    <text x="${layout.sceneWidth / 2}" y="${layout.sceneHeight + 25}" text-anchor="middle"
          font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#1E3A56">
      Scene ${sceneInfo.sceneNumber}: ${sceneInfo.title}
    </text>
  </g>

`;
    }
  });

  svg += '</svg>';
  return svg;
}

// Run the generator
if (require.main === module) {
  main().catch(console.error);
}

export {
  main as runCombinedStorybookGenerator,
  createEnhancedCombinedStorybook,
  createCombinedStorybook
};
