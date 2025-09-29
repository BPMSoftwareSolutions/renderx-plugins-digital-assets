/**
 * Tests for SVG Animation Utilities
 * Comprehensive test suite for element visibility and animation control
 */

const {
  makeElementDisappear,
  makeElementAppear,
  stopElementAnimation,
  startElementAnimation
} = require('../dist/svg-animation-utilities');

describe('SVG Animation Utilities', () => {
  // Simple test SVG for basic functionality
  const simpleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <rect id="test-rect" x="10" y="10" width="100" height="50" fill="blue"/>
  <circle id="test-circle" cx="200" cy="150" r="30" fill="red"/>
  <g id="test-group">
    <rect x="300" y="200" width="50" height="50" fill="green"/>
  </g>
</svg>`;

  // Bus SVG similar to Scene 1 for realistic testing
  const busSceneSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="900" height="400" xmlns="http://www.w3.org/2000/svg">
  <g id="school-bus" transform="translate(300, 250)">
    <animateTransform attributeName="transform" type="translate" 
      values="300,250; 900,250" dur="8s" repeatCount="indefinite"/>
    <rect x="0" y="0" width="120" height="40" fill="#FFD700"/>
  </g>
  <g id="traffic-light" transform="translate(450, 180)">
    <rect x="10" y="10" width="20" height="45" fill="#333"/>
    <circle cx="20" cy="25" r="6" fill="#FF0000">
      <animate attributeName="opacity" values="1;0.3;1" dur="3s" repeatCount="indefinite"/>
    </circle>
  </g>
</svg>`;

  describe('makeElementDisappear', () => {
    test('should add disappear animation to element by ID', () => {
      const selector = { type: 'id', value: 'test-rect' };
      const trigger = { type: 'time', value: 5 };
      
      const result = makeElementDisappear(simpleSvg, selector, trigger);
      
      expect(result).toContain('<animate');
      expect(result).toContain('attributeName="opacity"');
      expect(result).toContain('from="1"');
      expect(result).toContain('to="0"');
      expect(result).toContain('begin="5s"');
      expect(result).toContain('fill="freeze"');
    });

    test('should handle custom duration', () => {
      const selector = { type: 'id', value: 'test-circle' };
      const trigger = { type: 'time', value: 3, duration: 2 };
      
      const result = makeElementDisappear(simpleSvg, selector, trigger);
      
      expect(result).toContain('dur="2s"');
    });

    test('should not duplicate animations', () => {
      const selector = { type: 'id', value: 'test-rect' };
      const trigger = { type: 'time', value: 5 };
      
      let result = makeElementDisappear(simpleSvg, selector, trigger);
      result = makeElementDisappear(result, selector, trigger);
      
      const animateCount = (result.match(/<animate/g) || []).length;
      expect(animateCount).toBe(1);
    });

    test('should work with bus element from realistic scene', () => {
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 6 };
      
      const result = makeElementDisappear(busSceneSvg, selector, trigger);
      
      expect(result).toContain('begin="6s"');
      expect(result).toContain('attributeName="opacity"');
      // Should preserve existing animateTransform
      expect(result).toContain('animateTransform');
    });
  });

  describe('makeElementAppear', () => {
    test('should add appear animation to element by ID', () => {
      const selector = { type: 'id', value: 'test-rect' };
      const trigger = { type: 'time', value: 2 };
      
      const result = makeElementAppear(simpleSvg, selector, trigger);
      
      expect(result).toContain('<animate');
      expect(result).toContain('attributeName="opacity"');
      expect(result).toContain('from="0"');
      expect(result).toContain('to="1"');
      expect(result).toContain('begin="2s"');
      expect(result).toContain('opacity="0"'); // Initial state
    });

    test('should preserve existing opacity if present', () => {
      const svgWithOpacity = simpleSvg.replace('fill="blue"', 'fill="blue" opacity="0.5"');
      const selector = { type: 'id', value: 'test-rect' };
      const trigger = { type: 'time', value: 2 };
      
      const result = makeElementAppear(svgWithOpacity, selector, trigger);
      
      expect(result).toContain('opacity="0.5"');
      expect(result).not.toContain('opacity="0"');
    });
  });

  describe('stopElementAnimation', () => {
    test('should add end attribute to animateTransform', () => {
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 4 };
      
      const result = stopElementAnimation(busSceneSvg, selector, trigger);
      
      expect(result).toContain('end="4s"');
      expect(result).toContain('animateTransform');
    });

    test('should not modify if end attribute already exists', () => {
      const svgWithEnd = busSceneSvg.replace('repeatCount="indefinite"', 'end="10s" repeatCount="indefinite"');
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 4 };
      
      const result = stopElementAnimation(svgWithEnd, selector, trigger);
      
      expect(result).toContain('end="10s"');
      expect(result).not.toContain('end="4s"');
    });
  });

  describe('startElementAnimation', () => {
    test('should add begin attribute to animateTransform', () => {
      const svgWithoutBegin = busSceneSvg.replace('dur="8s"', 'dur="8s"');
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 3 };
      
      const result = startElementAnimation(svgWithoutBegin, selector, trigger);
      
      expect(result).toContain('begin="3s"');
    });

    test('should replace existing begin attribute', () => {
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 5 };
      
      // Assume the bus already has some begin timing
      const svgWithBegin = busSceneSvg.replace('dur="8s"', 'begin="1s" dur="8s"');
      const result = startElementAnimation(svgWithBegin, selector, trigger);
      
      expect(result).toContain('begin="5s"');
      expect(result).not.toContain('begin="1s"');
    });
  });

  describe('Element Selectors', () => {
    test('should work with class selector', () => {
      const svgWithClass = `<svg><rect class="test-class" width="100" height="50"/></svg>`;
      const selector = { type: 'class', value: 'test-class' };
      const trigger = { type: 'time', value: 1 };
      
      const result = makeElementDisappear(svgWithClass, selector, trigger);
      
      expect(result).toContain('<animate');
    });

    test('should work with tag selector', () => {
      const selector = { type: 'tag', value: 'circle' };
      const trigger = { type: 'time', value: 1 };
      
      const result = makeElementDisappear(simpleSvg, selector, trigger);
      
      expect(result).toContain('<animate');
    });
  });

  describe('SVG Validity', () => {
    test('should produce valid SVG structure', () => {
      const selector = { type: 'id', value: 'test-rect' };
      const trigger = { type: 'time', value: 5 };

      const result = makeElementDisappear(simpleSvg, selector, trigger);

      // Basic SVG structure validation
      expect(result).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(result).toContain('<svg');
      expect(result).toContain('</svg>');

      // Animation should be properly added
      expect(result).toContain('<animate');
      expect(result).toContain('attributeName="opacity"');

      // Should convert self-closing rect to regular element with animation
      expect(result).toContain('</rect>');

      // Verify the rect element was properly converted and contains animation
      expect(result).toMatch(/<rect[^>]*id="test-rect"[^>]*>.*<animate[^>]*>.*<\/rect>/s);
    });
  });

  describe('Real-world Scenarios', () => {
    test('Scene 1: Bus should disappear at 6s', () => {
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 6 };

      const result = makeElementDisappear(busSceneSvg, selector, trigger);

      expect(result).toContain('begin="6s"');
      expect(result).toContain('attributeName="opacity"');
      expect(result).toContain('from="1"');
      expect(result).toContain('to="0"');
      expect(result).toContain('fill="freeze"');

      // Should preserve existing bus animation
      expect(result).toContain('animateTransform');
      expect(result).toContain('type="translate"');
    });

    test('Should produce valid XML structure with complex SVG', () => {
      const complexSvg = `<svg>
        <g id="school-bus">
          <animateTransform attributeName="transform" type="translate"
                           values="50,250; 350,250; 350,250; 900,250"
                           dur="12s"
                           repeatCount="indefinite"/>
          <rect x="0" y="0" width="100" height="35"/>
          <g id="front-wheel">
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="1s" repeatCount="indefinite"/>
          </g>
        </g>
      </svg>`;

      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 6 };

      const result = makeElementDisappear(complexSvg, selector, trigger);

      // Should not contain malformed XML like "</g<animate.../>>"
      expect(result).not.toMatch(/<\/g<animate/);
      expect(result).not.toMatch(/repeatCount="[^"]*"\/\s*begin=/);

      // Should contain properly nested animate element
      expect(result).toContain('<animate');
      expect(result).toContain('</g>');

      // Test that result is valid XML by attempting to parse structure
      const animateMatches = result.match(/<animate[^>]*>/g);
      expect(animateMatches).toBeTruthy();
      if (animateMatches) {
        animateMatches.forEach(match => {
          expect(match).toMatch(/^<animate[^>]*>$/);
        });
      }
    });

    test('Scene 2: Bus should stop when traffic light is red', () => {
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 4 }; // Red light timing

      const result = stopElementAnimation(busSceneSvg, selector, trigger);

      expect(result).toContain('end="4s"');
      expect(result).toContain('animateTransform');
    });

    test('Scene 2: Bus should start when traffic light is green', () => {
      const selector = { type: 'id', value: 'school-bus' };
      const trigger = { type: 'time', value: 8 }; // Green light timing

      const result = startElementAnimation(busSceneSvg, selector, trigger);

      expect(result).toContain('begin="8s"');
      expect(result).toContain('animateTransform');
    });

    test('Combined scenario: Bus coordination with traffic light', () => {
      let result = busSceneSvg;

      // Stop bus at red light
      result = stopElementAnimation(result, { type: 'id', value: 'school-bus' }, { type: 'time', value: 4 });

      // Start bus at green light
      result = startElementAnimation(result, { type: 'id', value: 'school-bus' }, { type: 'time', value: 8 });

      // Hide bus after scene ends
      result = makeElementDisappear(result, { type: 'id', value: 'school-bus' }, { type: 'time', value: 12 });

      expect(result).toContain('end="4s"');
      expect(result).toContain('begin="8s"');
      expect(result).toContain('attributeName="opacity"');
      expect(result).toContain('to="0"');
    });
  });

  describe('Error Handling', () => {
    test('should handle non-existent elements gracefully', () => {
      const selector = { type: 'id', value: 'non-existent' };
      const trigger = { type: 'time', value: 1 };

      const result = makeElementDisappear(simpleSvg, selector, trigger);

      // Should return original SVG unchanged
      expect(result).toBe(simpleSvg);
    });

    test('should throw error for invalid selector type', () => {
      const selector = { type: 'invalid', value: 'test' };
      const trigger = { type: 'time', value: 1 };

      expect(() => makeElementDisappear(simpleSvg, selector, trigger)).toThrow();
    });
  });
});
