// mono-graph-generator.ts
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Scene } from './scene';
import type { MonoGraph, MonoScene, SceneLayout, BusState, AnimationTimeline } from './mono-graph-types';
import { renderScene } from './render-svg';

/**
 * Mono Graph Generator
 * 
 * Creates unified mono graphs that combine multiple scenes with seamless bus travel
 * and coordinated animations across all scenes.
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');

/**
 * Load an individual scene configuration
 */
function loadScene(filename: string): Scene {
  const filePath = join(SAMPLES_DIR, filename);
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Scene;
}

/**
 * Get scene content - handles both rawSvg and nodes structures
 */
function getSceneContent(scene: Scene): string {
  // If scene has rawSvg in defs, use that
  if (scene.defs?.rawSvg && scene.defs.rawSvg.length > 0) {
    return scene.defs.rawSvg.join('\n            ');
  }

  // If scene has nodes structure, render it to SVG
  if (scene.nodes && scene.nodes.length > 0) {
    try {
      // Use the renderScene function to convert nodes to SVG
      const fullSceneSvg = renderScene(scene);

      // Extract just the content between the <svg> tags, excluding the outer SVG wrapper
      const svgMatch = fullSceneSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
      if (svgMatch && svgMatch[1]) {
        // Remove the defs, background rect, and other wrapper elements
        let content = svgMatch[1];

        // Remove defs section
        content = content.replace(/<defs>[\s\S]*?<\/defs>/g, '');

        // Remove background rect
        content = content.replace(/<rect[^>]*width="100%"[^>]*\/?>/, '');

        // Remove style section
        content = content.replace(/<style>[\s\S]*?<\/style>/g, '');

        // Clean up extra whitespace
        content = content.trim();

        return content;
      }
    } catch (error) {
      console.warn(`Warning: Could not render scene ${scene.id} from nodes:`, error);
    }
  }

  // Fallback: return empty content
  return '';
}

/**
 * Calculate scene positions based on layout configuration
 */
function calculateScenePositions(sceneCount: number, layout: SceneLayout, canvas: { width: number; height: number }): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];

  // Common scene dimensions
  const sceneWidth = 800;
  const sceneHeight = 400;

  switch (layout.type) {
    case 'linear':
      const isHorizontal = layout.direction === 'horizontal';
      const spacing = layout.spacing || 50;
      
      for (let i = 0; i < sceneCount; i++) {
        if (isHorizontal) {
          positions.push({
            x: i * (sceneWidth + spacing) + spacing,
            y: (canvas.height - sceneHeight) / 2
          });
        } else {
          positions.push({
            x: (canvas.width - sceneWidth) / 2,
            y: i * (sceneHeight + spacing) + spacing
          });
        }
      }
      break;
      
    case 'grid':
      const cols = layout.cols || 2;
      const rows = layout.rows || Math.ceil(sceneCount / cols);
      const gridSpacing = layout.spacing || 50;
      const headerHeight = 100; // Space for title like combined storybook

      for (let i = 0; i < sceneCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = gridSpacing + (col * (sceneWidth + gridSpacing));
        const y = headerHeight + gridSpacing + (row * (sceneHeight + gridSpacing));

        positions.push({ x, y });
      }
      break;
      
    case 'custom':
      return layout.positions || [];
      
    default:
      // Default to horizontal linear
      return calculateScenePositions(sceneCount, { type: 'linear', direction: 'horizontal' }, canvas);
  }
  
  return positions;
}

/**
 * Generate bus travel path between scenes
 */
function generateBusPath(fromPos: { x: number; y: number }, toPos: { x: number; y: number }, sceneSize: { width: number; height: number }): string {
  // Calculate entry and exit points for seamless travel
  const fromExit = {
    x: fromPos.x + sceneSize.width,
    y: fromPos.y + sceneSize.height / 2
  };
  
  const toEntry = {
    x: toPos.x,
    y: toPos.y + sceneSize.height / 2
  };
  
  // Create smooth curved path between scenes
  const midX = (fromExit.x + toEntry.x) / 2;
  const midY = (fromExit.y + toEntry.y) / 2;
  
  return `M ${fromExit.x},${fromExit.y} Q ${midX},${midY} ${toEntry.x},${toEntry.y}`;
}

/**
 * Create animation timeline for seamless bus travel
 */
function createAnimationTimeline(scenes: MonoScene[], totalDuration: number): AnimationTimeline {
  const timeline: AnimationTimeline = {
    keyframes: [],
    busKeyframes: []
  };
  
  const sceneTime = totalDuration / scenes.length;
  
  scenes.forEach((scene, index) => {
    const startTime = index * sceneTime;
    const endTime = (index + 1) * sceneTime;
    
    // Scene activation keyframes
    timeline.keyframes.push({
      time: startTime,
      sceneId: scene.id,
      action: 'enter'
    });
    
    if (index < scenes.length - 1) {
      timeline.keyframes.push({
        time: endTime,
        sceneId: scene.id,
        action: 'exit'
      });
    }
    
    // Bus travel keyframes
    timeline.busKeyframes.push({
      time: startTime + sceneTime * 0.1, // Bus arrives 10% into scene
      position: scene.busTravel.entryPoint,
      sceneId: scene.id,
      action: 'arrive'
    });
    
    timeline.busKeyframes.push({
      time: endTime - sceneTime * 0.1, // Bus departs 10% before scene ends
      position: scene.busTravel.exitPoint,
      sceneId: scene.id,
      action: 'depart'
    });
  });
  
  return timeline;
}

/**
 * Convert individual scenes to mono scenes with positioning and timing
 */
function convertToMonoScenes(sceneFiles: string[], layout: SceneLayout, canvas: { width: number; height: number }): MonoScene[] {
  const scenes = sceneFiles.map(loadScene);
  const positions = calculateScenePositions(scenes.length, layout, canvas);
  
  return scenes.map((scene, index) => {
    const position = positions[index];
    const sceneWidth = 800;
    const sceneHeight = 400;
    
    return {
      ...scene,
      position,
      busTravel: {
        entryPoint: { x: position.x, y: position.y + sceneHeight / 2 },
        exitPoint: { x: position.x + sceneWidth, y: position.y + sceneHeight / 2 },
        duration: 3, // 3 seconds per scene
        path: undefined // Will be calculated during connection generation
      },
      timing: {
        sceneStart: index * 4, // 4 seconds per scene total
        sceneDuration: 4,
        busArrival: index * 4 + 0.5,
        busDeparture: index * 4 + 3.5
      }
    } as MonoScene;
  });
}

/**
 * Generate connections between scenes
 */
function generateConnections(scenes: MonoScene[]): Array<{ id: string; fromScene: string; toScene: string; path: string; duration: number }> {
  const connections = [];
  
  for (let i = 0; i < scenes.length - 1; i++) {
    const fromScene = scenes[i];
    const toScene = scenes[i + 1];
    
    const path = generateBusPath(
      fromScene.position,
      toScene.position,
      { width: 800, height: 400 }
    );
    
    connections.push({
      id: `connection-${i + 1}-to-${i + 2}`,
      fromScene: fromScene.id,
      toScene: toScene.id,
      path,
      duration: 1 // 1 second transition between scenes
    });
  }
  
  return connections;
}

/**
 * Create a mono graph from individual scene files
 */
export function createMonoGraph(
  sceneFiles: string[],
  options: {
    id: string;
    title: string;
    layout?: SceneLayout;
    canvas?: { width: number; height: number };
    totalDuration?: number;
    loop?: boolean;
    unifiedBus?: boolean;
  }
): MonoGraph {
  const canvas = options.canvas || { width: 2400, height: 1200 };
  const layout = options.layout || { type: 'linear', direction: 'horizontal', spacing: 100 };
  const totalDuration = options.totalDuration || 24; // 4 seconds per scene * 6 scenes
  
  const monoScenes = convertToMonoScenes(sceneFiles, layout, canvas);
  const connections = generateConnections(monoScenes);
  const timeline = createAnimationTimeline(monoScenes, totalDuration);
  
  return {
    id: options.id,
    title: options.title,
    canvas,
    bg: '#87CEEB', // Sky blue background
    scenes: monoScenes,
    bus: {
      id: 'unified-school-bus',
      sprite: '', // Will be populated with bus SVG
      totalJourneyDuration: totalDuration,
      speed: 100, // pixels per second
      size: { width: 120, height: 40 },
      enabled: options.unifiedBus !== false // Default to true unless explicitly disabled
    },
    connections,
    timeline: {
      totalDuration,
      loop: options.loop || true,
      autoPlay: true
    }
  };
}

/**
 * Create unified bus sprite with seamless travel animation
 */
function createUnifiedBusSprite(monoGraph: MonoGraph): string {
  // Extract bus SVG from the first scene that has detailed bus animation
  const scene1 = monoGraph.scenes[0];
  const busRawSvg = scene1.defs?.rawSvg?.find(svg => svg.includes('school-bus'));

  if (!busRawSvg) {
    // Fallback bus sprite
    return `
      <g id="unified-school-bus">
        <rect x="0" y="0" width="120" height="40" rx="4" ry="4" fill="#FFD700" stroke="#E6C200" stroke-width="2"/>
        <rect x="115" y="3" width="12" height="34" rx="6" ry="6" fill="#FFD700" stroke="#E6C200" stroke-width="2"/>
        <text x="60" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#000">SCHOOL BUS</text>
        <circle cx="25" cy="42" r="8" fill="#333" stroke="#222" stroke-width="2"/>
        <circle cx="95" cy="42" r="8" fill="#333" stroke="#222" stroke-width="2"/>
      </g>
    `;
  }

  // Create seamless travel animation path
  const totalWidth = monoGraph.canvas.width;
  const sceneWidth = 800;
  const sceneSpacing = 100;
  const busY = 300; // Middle of scene height

  let animationPath = '';
  let currentX = 100; // Start position

  // Generate path through all scenes
  for (let i = 0; i < monoGraph.scenes.length; i++) {
    const sceneStartX = i * (sceneWidth + sceneSpacing) + 100;
    const sceneEndX = sceneStartX + sceneWidth;

    if (i === 0) {
      animationPath += `${currentX},${busY}; `;
    }

    // Travel through scene
    animationPath += `${sceneEndX},${busY}; `;

    // Travel to next scene (if not last)
    if (i < monoGraph.scenes.length - 1) {
      const nextSceneStartX = (i + 1) * (sceneWidth + sceneSpacing) + 100;
      animationPath += `${nextSceneStartX},${busY}; `;
    }
  }

  // Remove trailing semicolon and space
  animationPath = animationPath.slice(0, -2);

  return `
    <g id="unified-school-bus" transform="translate(${currentX}, ${busY})">
      <animateTransform
        attributeName="transform"
        type="translate"
        values="${animationPath}"
        dur="${monoGraph.timeline.totalDuration}s"
        repeatCount="${monoGraph.timeline.loop ? 'indefinite' : '1'}"
      />

      <!-- Bus body -->
      <rect x="0" y="0" width="120" height="40" rx="4" ry="4" fill="#FFD700" stroke="#E6C200" stroke-width="2"/>

      <!-- Bus front -->
      <rect x="115" y="3" width="12" height="34" rx="6" ry="6" fill="#FFD700" stroke="#E6C200" stroke-width="2"/>

      <!-- Bus roof -->
      <rect x="-2" y="-3" width="124" height="6" rx="3" ry="3" fill="#FFA500"/>

      <!-- School Bus text -->
      <text x="60" y="28" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="bold" fill="#000">SCHOOL BUS</text>

      <!-- Orange stripe -->
      <rect x="0" y="20" width="120" height="4" fill="#FFA500"/>

      <!-- Front headlight (glowing) -->
      <circle cx="123" cy="12" r="3" fill="#FFFF00">
        <animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite"/>
      </circle>

      <!-- Wheels with spinning animation -->
      <g id="front-wheel">
        <circle cx="25" cy="42" r="8" fill="#333" stroke="#222" stroke-width="2"/>
        <circle cx="25" cy="42" r="4" fill="#666"/>
        <g transform-origin="25 42">
          <line x1="25" y1="36" x2="25" y2="48" stroke="#AAA" stroke-width="1"/>
          <line x1="19" y1="42" x2="31" y2="42" stroke="#AAA" stroke-width="1"/>
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" repeatCount="indefinite"/>
        </g>
      </g>

      <g id="rear-wheel">
        <circle cx="95" cy="42" r="8" fill="#333" stroke="#222" stroke-width="2"/>
        <circle cx="95" cy="42" r="4" fill="#666"/>
        <g transform-origin="95 42">
          <line x1="95" y1="36" x2="95" y2="48" stroke="#AAA" stroke-width="1"/>
          <line x1="89" y1="42" x2="101" y2="42" stroke="#AAA" stroke-width="1"/>
          <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" repeatCount="indefinite"/>
        </g>
      </g>
    </g>
  `;
}

/**
 * Render a mono graph to SVG
 */
export function renderMonoGraph(monoGraph: MonoGraph): string {
  const { canvas, bg, scenes } = monoGraph;

  // Collect all unique defs from all scenes
  const allFilters = new Set<string>();
  const allGradients = new Set<string>();
  const allSymbols = new Set<string>();

  scenes.forEach(scene => {
    scene.defs?.filters?.forEach(filter => allFilters.add(filter));
    scene.defs?.gradients?.forEach(gradient => allGradients.add(gradient));
    scene.defs?.symbols?.forEach(symbol => allSymbols.add(`<symbol id="${symbol.id}">${symbol.svg}</symbol>`));
  });

  // Build unified defs section
  const defs = [
    ...Array.from(allFilters),
    ...Array.from(allGradients),
    ...Array.from(allSymbols)
  ].join('\n');

  // Create unified bus sprite (conditional)
  const unifiedBus = monoGraph.bus.enabled ? createUnifiedBusSprite(monoGraph) : '';

  // Create clipping path definitions for each scene
  const clippingPaths = scenes.map((scene, index) => {
    const sceneX = scene.position.x;
    const sceneY = scene.position.y;

    return `
      <clipPath id="scene-${index + 1}-clip">
        <rect x="${sceneX}" y="${sceneY}" width="800" height="400" rx="8" ry="8"/>
      </clipPath>`;
  }).join('\n');

  // Render each scene at its position with enforced boundaries
  const scenesSvg = scenes.map((scene, index) => {
    const sceneX = scene.position.x;
    const sceneY = scene.position.y;

    // Create scene with enforced boundaries
    const sceneBoundary = `
      <g id="scene-${index + 1}" class="scene-boundary" transform="translate(${sceneX}, ${sceneY})">
        <!-- Scene background -->
        <rect x="0" y="0" width="800" height="400"
              fill="${scene.bg || '#87CEEB'}"
              stroke="#1976D2"
              stroke-width="2"
              rx="8"
              ry="8"/>

        <!-- Scene title -->
        <text x="400" y="25" text-anchor="middle"
              class="scene-title"
              font-size="16"
              fill="#1976D2">
          Scene ${index + 1}: ${scene.id.replace('event-router-scene-', '').replace('-', ' ').toUpperCase()}
        </text>

        <!-- Scene content with enforced clipping -->
        <g class="scene-content" clip-path="url(#scene-${index + 1}-clip)">
          <g transform="translate(0, 40)">
            ${getSceneContent(scene)}
          </g>
        </g>
      </g>
    `;

    return sceneBoundary;
  }).join('\n');

  // Create connection paths between scenes
  const connectionPaths = monoGraph.connections.map(conn => {
    return `<path d="${conn.path}" stroke="#FFD700" stroke-width="4" fill="none" opacity="0.5" stroke-dasharray="10,5"/>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${defs}
    ${clippingPaths}
  </defs>

  <style>
    .scene-boundary {
      overflow: hidden;
    }
    .scene-content {
      clip-path: inherit;
    }
    .scene-title {
      font-family: Arial, sans-serif;
      font-weight: bold;
      text-shadow: 2px 2px 4px rgba(255,255,255,0.8);
    }
  </style>

  <!-- Background -->
  <rect width="100%" height="100%" fill="${bg || '#87CEEB'}"/>

  <!-- Title -->
  <text x="${canvas.width / 2}" y="40" text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="32"
        font-weight="bold"
        fill="#1E3A56">
    ${monoGraph.title}
  </text>

  <!-- Subtitle -->
  <text x="${canvas.width / 2}" y="70" text-anchor="middle"
        font-family="Arial, sans-serif"
        font-size="18"
        fill="#3C556E">
    Seamless Bus Journey Through All EventRouter Scenes
  </text>

  <!-- Connection paths -->
  ${connectionPaths}

  <!-- Scene boundaries and content -->
  ${scenesSvg}

  <!-- Unified traveling bus (conditional) -->
  ${unifiedBus}

  <!-- Progress indicator -->
  <g id="progress-indicator" transform="translate(50, ${canvas.height - 50})">
    <rect x="0" y="0" width="${canvas.width - 100}" height="20"
          fill="#E0E0E0"
          stroke="#999"
          stroke-width="1"
          rx="10"/>
    <rect x="0" y="0" width="0" height="20"
          fill="#4CAF50"
          rx="10">
      <animate attributeName="width"
               values="0;${canvas.width - 100}"
               dur="${monoGraph.timeline.totalDuration}s"
               repeatCount="${monoGraph.timeline.loop ? 'indefinite' : '1'}"/>
    </rect>
    <text x="${(canvas.width - 100) / 2}" y="35" text-anchor="middle"
          font-family="Arial, sans-serif"
          font-size="12"
          fill="#666">
      Journey Progress
    </text>
  </g>
</svg>`;
}

/**
 * Save mono graph configuration to file
 */
export function saveMonoGraph(monoGraph: MonoGraph, filename: string): void {
  const filePath = join(SAMPLES_DIR, filename);
  writeFileSync(filePath, JSON.stringify(monoGraph, null, 2));
}
