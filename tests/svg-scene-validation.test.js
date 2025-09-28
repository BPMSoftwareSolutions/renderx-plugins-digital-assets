/**
 * Test suite for SVG scene validation
 * Ensures all scenes span the entire width of their viewbox for seamless transitions
 */

const fs = require('fs');
const path = require('path');

describe('SVG Scene Validation', () => {
  let canvasData;
  
  beforeAll(() => {
    // Load the canvas file
    const canvasPath = path.join(__dirname, '../assets/event-router/event_router_storybook.ui');
    const canvasContent = fs.readFileSync(canvasPath, 'utf8');
    canvasData = JSON.parse(canvasContent);
  });

  describe('Scene Layout Consistency', () => {
    test('should have consistent viewBox and layout dimensions for seamless transitions', () => {
      const sceneComponents = canvasData.components.filter(comp =>
        comp.type === 'svg' && comp.content && comp.content.viewBox &&
        comp.id !== 'rx-node-wju9sv' && // Exclude header component
        comp.id !== 'rx-node-summary' // Exclude summary component
      );
      
      expect(sceneComponents.length).toBeGreaterThan(0);
      
      sceneComponents.forEach((scene, index) => {
        const viewBoxMatch = scene.content.viewBox.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        expect(viewBoxMatch).toBeTruthy();
        
        const [, vbX, vbY, vbWidth, vbHeight] = viewBoxMatch.map(Number);
        const layoutWidth = scene.layout.width;
        const layoutHeight = scene.layout.height;
        
        // FAILING TEST: Layout width should match viewBox width for seamless transitions
        expect(layoutWidth).toBe(vbWidth);
        expect(layoutHeight).toBe(vbHeight);
        
        console.log(`Scene ${index + 1}: Layout(${layoutWidth}x${layoutHeight}) vs ViewBox(${vbWidth}x${vbHeight})`);
      });
    });

    test('should have all scenes with the same dimensions for consistent storyboard', () => {
      const sceneComponents = canvasData.components.filter(comp =>
        comp.type === 'svg' && comp.content && comp.content.viewBox &&
        comp.id !== 'rx-node-wju9sv' && // Exclude header
        comp.id !== 'rx-node-summary' // Exclude summary
      );
      
      expect(sceneComponents.length).toBeGreaterThan(1);
      
      const firstScene = sceneComponents[0];
      const firstViewBox = firstScene.content.viewBox.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
      const [, firstVbX, firstVbY, firstVbWidth, firstVbHeight] = firstViewBox.map(Number);
      
      sceneComponents.forEach((scene, index) => {
        const viewBoxMatch = scene.content.viewBox.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/);
        const [, vbX, vbY, vbWidth, vbHeight] = viewBoxMatch.map(Number);
        
        // All scenes should have the same viewBox dimensions
        expect(vbWidth).toBe(firstVbWidth);
        expect(vbHeight).toBe(firstVbHeight);
        
        // All scenes should have the same layout dimensions
        expect(scene.layout.width).toBe(firstScene.layout.width);
        expect(scene.layout.height).toBe(firstScene.layout.height);
      });
    });
  });

  describe('Scene Animation Requirements', () => {
    test('Scene 1 - Bus should have movement animation from left to right', () => {
      const scene1 = canvasData.components.find(comp => comp.id === 'rx-node-73eke9');
      expect(scene1).toBeTruthy();
      
      const svgContent = scene1.content.svgMarkup;
      
      // FAILING TEST: Should have bus movement animation
      expect(svgContent).toMatch(/animateTransform.*translate/i);
      expect(svgContent).toMatch(/wheel[\s\S]*?rotate/i);
    });

    test('Scene 2 - Traffic light should have debounce animation', () => {
      const scene2 = canvasData.components.find(comp => comp.id === 'rx-node-s1wplc');
      expect(scene2).toBeTruthy();
      
      const svgContent = scene2.content.svgMarkup;
      
      // FAILING TEST: Should have traffic light color changes and bus stopping behavior
      expect(svgContent).toMatch(/red.*light/i);
      expect(svgContent).toMatch(/green.*light/i);
      expect(svgContent).toMatch(/yellow.*light/i);
      expect(svgContent).toMatch(/bus[\s\S]*?animateTransform[\s\S]*?translate/i);
      expect(svgContent).toMatch(/traffic.*light[\s\S]*?animate/i);
    });

    test('Scene 3 - Bus should pickup live subscribers and leave late ones', () => {
      const scene3 = canvasData.components.find(comp => comp.id === 'rx-node-scene3');
      expect(scene3).toBeTruthy();

      const svgContent = scene3.content.svgMarkup;

      // FAILING TEST: Should have bus stopping and subscriber pickup animation
      expect(svgContent).toMatch(/live.*subscriber/i);
      expect(svgContent).toMatch(/late.*subscriber/i);
      expect(svgContent).toMatch(/replay.*cache/i);
      expect(svgContent).toMatch(/bus[\s\S]*?animateTransform[\s\S]*?translate/i);
      expect(svgContent).toMatch(/subscriber[\s\S]*?animate/i);
    });

    test('Scene 3 - Live subscriber should board bus and disappear when bus leaves', () => {
      const scene3 = canvasData.components.find(comp => comp.id === 'rx-node-scene3');
      expect(scene3).toBeTruthy();

      const svgContent = scene3.content.svgMarkup;

      // FAILING TEST: Live subscriber should move toward bus and disappear
      expect(svgContent).toMatch(/live-subscriber[\s\S]*?animateTransform[\s\S]*?translate/i);

      // Animation should show subscriber moving down toward bus (y changes from 25 to 50)
      expect(svgContent).toMatch(/values.*25,25.*-\d+,50/i);

      // Subscriber should disappear when bus leaves (opacity animation to 0)
      expect(svgContent).toMatch(/live-subscriber[\s\S]*?animate[\s\S]*?opacity[\s\S]*?values.*0/i);
    });

    test('Scene 4 - Bus should drive up ramp and fly off', () => {
      const scene4 = canvasData.components.find(comp => comp.id === 'rx-node-scene4');
      expect(scene4).toBeTruthy();

      const svgContent = scene4.content.svgMarkup;

      // FAILING TEST: Should have ramp and flying animation
      expect(svgContent).toMatch(/conductor/i);
      expect(svgContent).toMatch(/transfer.*hub/i);
      expect(svgContent).toMatch(/bus[\s\S]*?animateTransform[\s\S]*?translate/i);
      expect(svgContent).toMatch(/ramp/i);
    });

    test('Scene 4 - Green bus (Plugin A) should animate driving off ramp and off page', () => {
      const scene4 = canvasData.components.find(comp => comp.id === 'rx-node-scene4');
      expect(scene4).toBeTruthy();

      const svgContent = scene4.content.svgMarkup;

      // FAILING TEST: Green bus should have animation that goes off the page
      expect(svgContent).toMatch(/Plugin A/i);
      expect(svgContent).toMatch(/green.*bus[\s\S]*?animateTransform/i);

      // Animation should show bus moving off the page (x values > 800)
      expect(svgContent).toMatch(/values.*\d+,\d+.*[89]\d{2,},\d+/i);
    });

    test('Scene 5 - Bus should stop at red light and proceed on green', () => {
      const scene5 = canvasData.components.find(comp => comp.id === 'rx-node-scene5');
      expect(scene5).toBeTruthy();
      
      const svgContent = scene5.content.svgMarkup;
      
      // FAILING TEST: Should have traffic light sequence and bus stop/go
      expect(svgContent).toMatch(/traffic.*light/i);
      expect(svgContent).toMatch(/bus[\s\S]*?animateTransform[\s\S]*?translate/i);
      expect(svgContent).toMatch(/animate.*fill.*#FF0000/i);
      expect(svgContent).toMatch(/throttle/i);
    });

    test('Scene 6 - Children should jump and board the bus', () => {
      const scene6 = canvasData.components.find(comp => comp.id === 'rx-node-scene6');
      expect(scene6).toBeTruthy();
      
      const svgContent = scene6.content.svgMarkup;
      
      // FAILING TEST: Should have jumping children and boarding animation
      expect(svgContent).toMatch(/children/i);
      expect(svgContent).toMatch(/bus[\s\S]*?animateTransform[\s\S]*?translate/i);
      expect(svgContent).toMatch(/animateTransform[\s\S]*?translate[\s\S]*?values.*270.*265.*270/i); // Jumping
      expect(svgContent).toMatch(/school.*stop/i);
    });
  });

  describe('Layout and Structure', () => {
    test('should have 3-row layout: Row 1 (Scenes 1-2), Row 2 (Scenes 3-4), Row 3 (Scenes 5-6)', () => {
      const scenes = canvasData.components.filter(comp =>
        comp.id.includes('scene') || comp.id.includes('73eke9') || comp.id.includes('s1wplc')
      );

      expect(scenes.length).toBe(6);

      // Find scenes by their actual IDs
      const scene1 = scenes.find(s => s.id.includes('73eke9'));
      const scene2 = scenes.find(s => s.id.includes('s1wplc'));
      const scene3 = scenes.find(s => s.id.includes('scene3'));
      const scene4 = scenes.find(s => s.id.includes('scene4'));
      const scene5 = scenes.find(s => s.id.includes('scene5'));
      const scene6 = scenes.find(s => s.id.includes('scene6'));

      // Row 1: Scenes 1-2 (y=50)
      expect(scene1.layout.y).toBe(50);
      expect(scene2.layout.y).toBe(50);
      expect(scene1.layout.x).toBe(0);
      expect(scene2.layout.x).toBe(800);

      // Row 2: Scenes 3-4 (y=500)
      expect(scene3.layout.y).toBe(500);
      expect(scene4.layout.y).toBe(500);
      expect(scene3.layout.x).toBe(0);
      expect(scene4.layout.x).toBe(800);

      // Row 3: Scenes 5-6 (y=950)
      expect(scene5.layout.y).toBe(950);
      expect(scene6.layout.y).toBe(950);
      expect(scene5.layout.x).toBe(0);
      expect(scene6.layout.x).toBe(800);
    });

    test('should not have header or summary components', () => {
      const headerComponent = canvasData.components.find(comp =>
        comp.id === 'rx-node-wju9sv' || comp.content?.svgMarkup?.includes('Tiny Pub/Sub Bus')
      );
      const summaryComponent = canvasData.components.find(comp =>
        comp.id === 'rx-node-summary'
      );

      // FAILING TEST: Header and summary should be removed
      expect(headerComponent).toBeUndefined();
      expect(summaryComponent).toBeUndefined();
    });
  });
});
