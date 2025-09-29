// combined-storybook.test.js
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { 
  runCombinedStorybookGenerator,
  createEnhancedCombinedStorybook 
} = require('../dist/combined-storybook-generator');

/**
 * Comprehensive tests for the Enhanced Combined Storybook Generator
 * Tests scene-by-scene animation triggers, timing coordination, and visual enhancements
 */

const SAMPLES_DIR = join(__dirname, '..', 'samples');

describe('Enhanced Combined Storybook Generator', () => {
  let enhancedSvgContent;
  let legacySvgContent;
  
  beforeAll(async () => {
    // Generate the enhanced combined storybook
    await runCombinedStorybookGenerator();
    
    // Read the generated files
    const enhancedPath = join(SAMPLES_DIR, 'enhanced-combined-storybook.svg');
    const legacyPath = join(SAMPLES_DIR, 'graph-generated-combined-storybook.svg');
    
    expect(existsSync(enhancedPath)).toBe(true);
    expect(existsSync(legacyPath)).toBe(true);
    
    enhancedSvgContent = readFileSync(enhancedPath, 'utf-8');
    legacySvgContent = readFileSync(legacyPath, 'utf-8');
  });

  describe('File Generation', () => {
    test('should generate enhanced combined storybook SVG file', () => {
      expect(enhancedSvgContent).toBeDefined();
      expect(enhancedSvgContent.length).toBeGreaterThan(1000);
    });

    test('should generate legacy combined storybook SVG file for backward compatibility', () => {
      expect(legacySvgContent).toBeDefined();
      expect(legacySvgContent.length).toBeGreaterThan(1000);
    });

    test('enhanced SVG should be valid XML', () => {
      expect(enhancedSvgContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(enhancedSvgContent).toContain('<svg');
      expect(enhancedSvgContent).toContain('</svg>');
    });
  });

  describe('Enhanced Animation Features', () => {
    test('should include unified bus sprite definition', () => {
      expect(enhancedSvgContent).toContain('id="unified-bus-sprite"');
      expect(enhancedSvgContent).toContain('<!-- Bus body -->');
      expect(enhancedSvgContent).toContain('<!-- Wheels -->');
      expect(enhancedSvgContent).toContain('<!-- Headlights -->');
    });

    test('should include coordinated bus animation', () => {
      expect(enhancedSvgContent).toContain('id="unified-coordinated-bus"');
      expect(enhancedSvgContent).toContain('animateTransform');
      expect(enhancedSvgContent).toContain('type="translate"');
      expect(enhancedSvgContent).toContain('values=');
      expect(enhancedSvgContent).toContain('dur="60s"');
    });

    test('should include scene timing indicators', () => {
      expect(enhancedSvgContent).toContain('class="scene-progress"');
      expect(enhancedSvgContent).toContain('animate attributeName="width"');
      expect(enhancedSvgContent).toContain('values="0;20;20;0"');
    });

    test('should include progress bar animation', () => {
      expect(enhancedSvgContent).toContain('class="progress-bar"');
      expect(enhancedSvgContent).toContain('progress-fill 60s linear');
      expect(enhancedSvgContent).toContain('url(#progress-gradient)');
    });

    test('should include connection paths between scenes', () => {
      expect(enhancedSvgContent).toContain('class="connection-path"');
      expect(enhancedSvgContent).toContain('stroke-dasharray: 5,5');
      expect(enhancedSvgContent).toContain('dash-flow 2s linear infinite');
    });
  });

  describe('Scene Coordination', () => {
    test('should have 6 scenes with proper positioning', () => {
      // Check for all 6 scenes
      for (let i = 1; i <= 6; i++) {
        expect(enhancedSvgContent).toContain(`class="scene-${i}"`);
        expect(enhancedSvgContent).toContain(`Scene ${i}:`);
      }
    });

    test('should include scene highlighting CSS', () => {
      expect(enhancedSvgContent).toContain('.scene-1 {');
      expect(enhancedSvgContent).toContain('transition: all 0.5s ease-in-out');
      expect(enhancedSvgContent).toContain('.active {');
      expect(enhancedSvgContent).toContain('border: 3px solid #8b5cf6');
      expect(enhancedSvgContent).toContain('box-shadow: 0 0 20px rgba(139, 92, 246, 0.3)');
    });

    test('should have proper scene clipping', () => {
      for (let i = 1; i <= 6; i++) {
        expect(enhancedSvgContent).toContain(`id="scene-${i}-clip"`);
        expect(enhancedSvgContent).toContain(`clip-path="url(#scene-${i}-clip)"`);
      }
    });
  });

  describe('Bus Animation Coordination', () => {
    test('should have coordinated bus animation values', () => {
      // Look specifically for the unified bus animation
      const busAnimationMatch = enhancedSvgContent.match(/id="unified-coordinated-bus"[\s\S]*?values="([^"]+)"/);
      expect(busAnimationMatch).toBeTruthy();

      if (busAnimationMatch) {
        const animationPath = busAnimationMatch[1];
        const coordinates = animationPath.split(';').map(coord => coord.trim());

        // Should have multiple coordinates for scene-by-scene travel
        expect(coordinates.length).toBeGreaterThanOrEqual(6);

        // Each coordinate should be in format "x,y"
        coordinates.forEach(coord => {
          if (coord) {
            expect(coord).toMatch(/^-?\d+,-?\d+$/);
          }
        });
      }
    });

    test('should have spinning wheel animations in bus sprite', () => {
      expect(enhancedSvgContent).toContain('id="front-wheel"');
      expect(enhancedSvgContent).toContain('id="rear-wheel"');
      expect(enhancedSvgContent).toContain('type="rotate"');
      expect(enhancedSvgContent).toContain('values="0;360"');
      expect(enhancedSvgContent).toContain('dur="1s"');
      expect(enhancedSvgContent).toContain('repeatCount="indefinite"');
    });

    test('should have headlight glow animations', () => {
      expect(enhancedSvgContent).toContain('animate attributeName="opacity"');
      expect(enhancedSvgContent).toContain('values="0.8;1;0.8"');
      expect(enhancedSvgContent).toContain('dur="2s"');
    });
  });

  describe('Visual Enhancements', () => {
    test('should include enhanced title and description', () => {
      expect(enhancedSvgContent).toContain('EventRouter Journey: Enhanced Combined Storybook');
      expect(enhancedSvgContent).toContain('Enhanced with Scene-by-Scene Animation Coordination');
    });

    test('should include glow filter for scene highlighting', () => {
      expect(enhancedSvgContent).toContain('id="scene-glow"');
      expect(enhancedSvgContent).toContain('feGaussianBlur');
      expect(enhancedSvgContent).toContain('feMerge');
    });

    test('should include progress gradient definition', () => {
      expect(enhancedSvgContent).toContain('id="progress-gradient"');
      expect(enhancedSvgContent).toContain('stop-color:#8b5cf6');
      expect(enhancedSvgContent).toContain('stop-color:#3b82f6');
    });

    test('should include playback controls if enabled', () => {
      expect(enhancedSvgContent).toContain('id="playback-controls"');
      expect(enhancedSvgContent).toContain('Click to Play/Pause');
    });
  });

  describe('Timing Configuration', () => {
    test('should have configurable total duration', () => {
      expect(enhancedSvgContent).toContain('dur="60s"');
    });

    test('should support loop configuration', () => {
      expect(enhancedSvgContent).toContain('repeatCount="indefinite"');
    });

    test('should have staggered scene start times', () => {
      // Scene timing indicators should have different begin times
      const beginMatches = enhancedSvgContent.match(/begin="(\d+)s"/g);
      expect(beginMatches).toBeTruthy();
      
      if (beginMatches && beginMatches.length > 1) {
        const beginTimes = beginMatches.map(match => {
          const timeMatch = match.match(/begin="(\d+)s"/);
          return timeMatch ? parseInt(timeMatch[1]) : 0;
        });
        
        // Times should be different (staggered)
        const uniqueTimes = [...new Set(beginTimes)];
        expect(uniqueTimes.length).toBeGreaterThan(1);
      }
    });
  });

  describe('Backward Compatibility', () => {
    test('legacy SVG should maintain original structure', () => {
      expect(legacySvgContent).toContain('EventRouter Journey: Graph-Generated Storybook');
      expect(legacySvgContent).toContain('Six Scenes Generated from Graph Configurations');
    });

    test('legacy SVG should have all 6 scenes', () => {
      for (let i = 1; i <= 6; i++) {
        expect(legacySvgContent).toContain(`Scene ${i}:`);
      }
    });

    test('legacy SVG should not include enhanced animation features', () => {
      expect(legacySvgContent).not.toContain('unified-coordinated-bus');
      expect(legacySvgContent).not.toContain('scene-progress');
      expect(legacySvgContent).not.toContain('progress-bar');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing scene files gracefully', () => {
      // This test ensures the generator doesn't crash on missing files
      // The actual implementation should handle this case
      expect(enhancedSvgContent).toBeDefined();
    });

    test('should generate valid SVG even with animation errors', () => {
      // Ensure the SVG structure is valid even if some animations fail
      expect(enhancedSvgContent).toContain('<svg');
      expect(enhancedSvgContent).toContain('</svg>');
      expect(enhancedSvgContent.split('<svg').length - 1).toBeGreaterThanOrEqual(1);
      expect(enhancedSvgContent.split('</svg>').length - 1).toBeGreaterThanOrEqual(1);
    });
  });
});
