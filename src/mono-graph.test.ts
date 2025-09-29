// mono-graph.test.ts
import { describe, it, expect, beforeAll } from '@jest/globals';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createMonoGraph, renderMonoGraph, saveMonoGraph } from './mono-graph-generator';
import type { MonoGraph } from './mono-graph-types';

/**
 * Comprehensive tests for the mono graph system
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');
const EVENTROUTER_SCENES = [
  'event-router-scene-1-depot.json',
  'event-router-scene-2-manifest.json', 
  'event-router-scene-3-subscribers.json',
  'event-router-scene-4-conductor.json',
  'event-router-scene-5-rules.json',
  'event-router-scene-6-school.json'
];

describe('Mono Graph System', () => {
  let monoGraph: MonoGraph;
  let generatedSvg: string;

  beforeAll(() => {
    // Create test mono graph
    monoGraph = createMonoGraph(EVENTROUTER_SCENES, {
      id: 'test-mono-journey',
      title: 'Test EventRouter Journey',
      layout: {
        type: 'linear',
        direction: 'horizontal',
        spacing: 100
      },
      canvas: {
        width: 5400,
        height: 600
      },
      totalDuration: 30,
      loop: true
    });

    // Generate SVG for testing
    generatedSvg = renderMonoGraph(monoGraph);
  });

  describe('Mono Graph Creation', () => {
    it('should create a valid mono graph structure', () => {
      expect(monoGraph).toBeDefined();
      expect(monoGraph.id).toBe('test-mono-journey');
      expect(monoGraph.title).toBe('Test EventRouter Journey');
      expect(monoGraph.scenes).toHaveLength(6);
      expect(monoGraph.connections).toHaveLength(5);
    });

    it('should have correct canvas dimensions', () => {
      expect(monoGraph.canvas.width).toBe(5400);
      expect(monoGraph.canvas.height).toBe(600);
    });

    it('should have proper timeline configuration', () => {
      expect(monoGraph.timeline.totalDuration).toBe(30);
      expect(monoGraph.timeline.loop).toBe(true);
      expect(monoGraph.timeline.autoPlay).toBe(true);
    });

    it('should have unified bus configuration', () => {
      expect(monoGraph.bus).toBeDefined();
      expect(monoGraph.bus.id).toBe('unified-school-bus');
      expect(monoGraph.bus.totalJourneyDuration).toBe(30);
      expect(monoGraph.bus.size.width).toBe(120);
      expect(monoGraph.bus.size.height).toBe(40);
    });
  });

  describe('Scene Positioning and Layout', () => {
    it('should position scenes correctly for linear horizontal layout', () => {
      const expectedPositions = [
        { x: 100, y: 100 },
        { x: 1000, y: 100 },
        { x: 1900, y: 100 },
        { x: 2800, y: 100 },
        { x: 3700, y: 100 },
        { x: 4600, y: 100 }
      ];

      monoGraph.scenes.forEach((scene, index) => {
        expect(scene.position.x).toBe(expectedPositions[index].x);
        expect(scene.position.y).toBe(expectedPositions[index].y);
      });
    });

    it('should have proper bus travel configuration for each scene', () => {
      monoGraph.scenes.forEach((scene, index) => {
        expect(scene.busTravel).toBeDefined();
        expect(scene.busTravel.entryPoint).toBeDefined();
        expect(scene.busTravel.exitPoint).toBeDefined();
        expect(scene.busTravel.duration).toBe(3);
        
        // Entry point should be at left edge of scene
        expect(scene.busTravel.entryPoint.x).toBe(scene.position.x);
        expect(scene.busTravel.entryPoint.y).toBe(scene.position.y + 200); // Middle of 400px height
        
        // Exit point should be at right edge of scene
        expect(scene.busTravel.exitPoint.x).toBe(scene.position.x + 800);
        expect(scene.busTravel.exitPoint.y).toBe(scene.position.y + 200);
      });
    });

    it('should have proper timing configuration for each scene', () => {
      monoGraph.scenes.forEach((scene, index) => {
        expect(scene.timing).toBeDefined();
        expect(scene.timing.sceneStart).toBe(index * 4);
        expect(scene.timing.sceneDuration).toBe(4);
        expect(scene.timing.busArrival).toBe(index * 4 + 0.5);
        expect(scene.timing.busDeparture).toBe(index * 4 + 3.5);
      });
    });
  });

  describe('Scene Connections', () => {
    it('should create connections between adjacent scenes', () => {
      expect(monoGraph.connections).toHaveLength(5); // 6 scenes = 5 connections
      
      monoGraph.connections.forEach((connection, index) => {
        expect(connection.id).toBe(`connection-${index + 1}-to-${index + 2}`);
        expect(connection.fromScene).toBe(monoGraph.scenes[index].id);
        expect(connection.toScene).toBe(monoGraph.scenes[index + 1].id);
        expect(connection.duration).toBe(1);
        expect(connection.path).toMatch(/^M \d+,\d+ Q \d+,\d+ \d+,\d+$/); // SVG path format
      });
    });

    it('should have valid SVG path format for connections', () => {
      monoGraph.connections.forEach(connection => {
        // Should be a quadratic Bezier curve (M x,y Q x,y x,y)
        expect(connection.path).toMatch(/^M \d+,\d+ Q \d+,\d+ \d+,\d+$/);
      });
    });
  });

  describe('SVG Generation', () => {
    it('should generate valid SVG markup', () => {
      expect(generatedSvg).toBeDefined();
      expect(generatedSvg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(generatedSvg).toContain('<svg');
      expect(generatedSvg).toContain('</svg>');
      expect(generatedSvg).toContain('width="5400"');
      expect(generatedSvg).toContain('height="600"');
    });

    it('should include unified bus with seamless travel animation', () => {
      expect(generatedSvg).toContain('id="unified-school-bus"');
      expect(generatedSvg).toContain('animateTransform');
      expect(generatedSvg).toContain('type="translate"');
      expect(generatedSvg).toContain('dur="30s"');
      expect(generatedSvg).toContain('repeatCount="indefinite"');
    });

    it('should include all scene boundaries', () => {
      for (let i = 1; i <= 6; i++) {
        expect(generatedSvg).toContain(`id="scene-${i}-boundary"`);
      }
    });

    it('should include connection paths between scenes', () => {
      expect(generatedSvg).toContain('stroke="#FFD700"'); // Connection path color
      expect(generatedSvg).toContain('stroke-dasharray="10,5"'); // Dashed lines
    });

    it('should include progress indicator', () => {
      expect(generatedSvg).toContain('id="progress-indicator"');
      expect(generatedSvg).toContain('Journey Progress');
    });

    it('should include title and subtitle', () => {
      expect(generatedSvg).toContain('Test EventRouter Journey');
      expect(generatedSvg).toContain('Seamless Bus Journey Through All EventRouter Scenes');
    });
  });

  describe('Bus Animation Continuity', () => {
    it('should have continuous animation path through all scenes', () => {
      const animationMatch = generatedSvg.match(/values="([^"]+)"/);
      expect(animationMatch).toBeTruthy();
      
      if (animationMatch) {
        const animationPath = animationMatch[1];
        const coordinates = animationPath.split(';').map(coord => coord.trim());
        
        // Should have coordinates for each scene transition
        expect(coordinates.length).toBeGreaterThanOrEqual(6);
        
        // Each coordinate should be in format "x,y"
        coordinates.forEach(coord => {
          if (coord) {
            expect(coord).toMatch(/^\d+,\d+$/);
          }
        });
      }
    });

    it('should have spinning wheel animations', () => {
      expect(generatedSvg).toContain('id="front-wheel"');
      expect(generatedSvg).toContain('id="rear-wheel"');
      expect(generatedSvg).toContain('type="rotate"');
      expect(generatedSvg).toContain('values="0;360"');
    });

    it('should have headlight glow animation', () => {
      expect(generatedSvg).toContain('animate attributeName="opacity"');
      expect(generatedSvg).toContain('values="0.8;1;0.8"');
    });
  });

  describe('Scene Content Preservation', () => {
    it('should preserve all scene definitions', () => {
      // Check that filters from all scenes are included
      expect(generatedSvg).toContain('id="sceneShadow"');
      expect(generatedSvg).toContain('id="busGlow"');
      expect(generatedSvg).toContain('id="trafficLightGlow"');
      expect(generatedSvg).toContain('id="subscriberGlow"');
      expect(generatedSvg).toContain('id="conductorGlow"');
      expect(generatedSvg).toContain('id="signGlow"');
      expect(generatedSvg).toContain('id="schoolGlow"');
    });

    it('should preserve all gradients from scenes', () => {
      expect(generatedSvg).toContain('id="roadGradient"');
      expect(generatedSvg).toContain('id="busGradient"');
      expect(generatedSvg).toContain('id="manifestGradient"');
      expect(generatedSvg).toContain('id="liveSubscriberGradient"');
      expect(generatedSvg).toContain('id="conductorGradient"');
      expect(generatedSvg).toContain('id="schoolGradient"');
    });
  });

  describe('File Operations', () => {
    it('should save mono graph configuration to file', () => {
      const testFilename = 'test-mono-graph.json';
      saveMonoGraph(monoGraph, testFilename);
      
      const filePath = join(SAMPLES_DIR, testFilename);
      expect(existsSync(filePath)).toBe(true);
      
      const savedContent = readFileSync(filePath, 'utf-8');
      const savedGraph = JSON.parse(savedContent);
      
      expect(savedGraph.id).toBe(monoGraph.id);
      expect(savedGraph.scenes).toHaveLength(6);
      expect(savedGraph.connections).toHaveLength(5);
    });
  });
});

describe('Integration Tests', () => {
  it('should load and render the actual EventRouter mono journey', () => {
    const configPath = join(SAMPLES_DIR, 'event-router-mono-journey.json');
    
    if (existsSync(configPath)) {
      const configContent = readFileSync(configPath, 'utf-8');
      const actualMonoGraph: MonoGraph = JSON.parse(configContent);
      
      expect(actualMonoGraph.id).toBe('event-router-mono-journey');
      expect(actualMonoGraph.scenes).toHaveLength(6);
      
      const actualSvg = renderMonoGraph(actualMonoGraph);
      expect(actualSvg).toContain('unified-school-bus');
      expect(actualSvg).toContain('EventRouter Journey');
    }
  });

  it('should generate valid SVG file that exists', () => {
    const svgPath = join(SAMPLES_DIR, 'event-router-mono-journey.svg');
    expect(existsSync(svgPath)).toBe(true);
    
    const svgContent = readFileSync(svgPath, 'utf-8');
    expect(svgContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svgContent).toContain('unified-school-bus');
  });
});
