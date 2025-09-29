const fs = require('fs');
const path = require('path');
const { calculateElementLayout, generateSlideSVG } = require('../scripts/generate-slide-svgs');

describe('Slide SVG Generation', () => {
  const mockSlide = {
    id: 'test-slide',
    name: 'Test Slide',
    story: 'A test slide for validation'
  };

  const mockElements = [
    {
      id: 'element-1',
      label: 'Element 1',
      svg: 'test/element-1.svg'
    },
    {
      id: 'element-2', 
      label: 'Element 2',
      svg: 'test/element-2.svg'
    },
    {
      id: 'element-3',
      label: 'Element 3', 
      svg: 'test/element-3.svg'
    }
  ];

  describe('calculateElementLayout', () => {
    test('should calculate grid layout for elements', () => {
      const layout = calculateElementLayout(mockElements);
      
      expect(layout).toHaveLength(3);
      
      // Check that all elements have compose coordinates
      layout.forEach(element => {
        expect(element.compose).toBeDefined();
        expect(typeof element.compose.x).toBe('number');
        expect(typeof element.compose.y).toBe('number');
        expect(element.compose.width).toBe(420);
        expect(element.compose.height).toBe(140);
      });
      
      // Check that elements are positioned differently
      const positions = layout.map(el => `${el.compose.x},${el.compose.y}`);
      const uniquePositions = new Set(positions);
      expect(uniquePositions.size).toBe(3); // All positions should be unique
    });

    test('should handle single element', () => {
      const layout = calculateElementLayout([mockElements[0]]);
      
      expect(layout).toHaveLength(1);
      expect(layout[0].compose.x).toBeGreaterThan(0);
      expect(layout[0].compose.y).toBeGreaterThan(0);
    });

    test('should handle many elements in grid', () => {
      const manyElements = Array.from({ length: 9 }, (_, i) => ({
        id: `element-${i + 1}`,
        label: `Element ${i + 1}`,
        svg: `test/element-${i + 1}.svg`
      }));
      
      const layout = calculateElementLayout(manyElements);
      
      expect(layout).toHaveLength(9);
      
      // Should arrange in 3x3 grid
      const positions = layout.map(el => ({ x: el.compose.x, y: el.compose.y }));
      const uniqueX = new Set(positions.map(p => p.x));
      const uniqueY = new Set(positions.map(p => p.y));
      
      expect(uniqueX.size).toBe(3); // 3 columns
      expect(uniqueY.size).toBe(3); // 3 rows
    });
  });

  describe('generateSlideSVG', () => {
    test('should generate valid SVG structure', () => {
      const elementsWithLayout = calculateElementLayout(mockElements);
      const svg = generateSlideSVG(mockSlide, elementsWithLayout);
      
      // Check basic SVG structure
      expect(svg).toMatch(/^<svg[^>]*>/);
      expect(svg).toMatch(/<\/svg>$/);
      
      // Check dimensions
      expect(svg).toContain('width="1200"');
      expect(svg).toContain('height="800"');
      expect(svg).toContain('viewBox="0 0 1200 800"');
      
      // Check title and description
      expect(svg).toContain('<title>Test Slide</title>');
      expect(svg).toContain('<desc>A test slide for validation</desc>');
      
      // Check background
      expect(svg).toContain('fill="#FAFAFA"');
      
      // Check slide title text
      expect(svg).toContain('Test Slide');
    });

    test('should include element groups with transforms', () => {
      const elementsWithLayout = calculateElementLayout(mockElements);
      const svg = generateSlideSVG(mockSlide, elementsWithLayout);
      
      // Check that each element has a group with transform
      mockElements.forEach(element => {
        expect(svg).toContain(`id="${element.id}"`);
        expect(svg).toContain(`data-element="${element.label}"`);
        expect(svg).toMatch(new RegExp(`transform="translate\\(\\d+,\\d+\\)"`));
      });
    });

    test('should handle missing SVG files gracefully', () => {
      const elementsWithLayout = calculateElementLayout(mockElements);
      
      // This should not throw, but should warn about missing files
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const svg = generateSlideSVG(mockSlide, elementsWithLayout);
      
      expect(svg).toMatch(/^<svg[^>]*>/);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Element SVG not found')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration with real slide data', () => {
    test('should work with slide-01-manifest structure', () => {
      const slidesPath = path.join(__dirname, '../assets/plugin-architecture/plugin-integration-slides.json');

      if (fs.existsSync(slidesPath)) {
        const slidesData = JSON.parse(fs.readFileSync(slidesPath, 'utf8'));
        const slide01 = slidesData.slides.find(s => s.id === 'slide-01-manifest');

        if (slide01 && slide01.elements) {
          const layout = calculateElementLayout(slide01.elements);
          const svg = generateSlideSVG(slide01, layout);

          expect(svg).toContain('Phase 1: Plugin Scaffolding & Manifest');
          expect(layout).toHaveLength(5); // 5 elements in slide-01-manifest

          // Check that all elements have valid coordinates
          layout.forEach(element => {
            expect(element.compose.x).toBeGreaterThanOrEqual(0);
            expect(element.compose.y).toBeGreaterThanOrEqual(0);
            expect(element.compose.x).toBeLessThan(1200);
            expect(element.compose.y).toBeLessThan(800);
          });
        }
      }
    });
  });

  describe('XML Validation', () => {
    test('should generate valid XML structure', () => {
      const elementsWithLayout = calculateElementLayout(mockElements);
      const svg = generateSlideSVG(mockSlide, elementsWithLayout);

      // Test XML parsing using DOMParser (if available)
      if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');

        // Check for parsing errors
        const parserError = doc.querySelector('parsererror');
        expect(parserError).toBeNull();

        // Verify it's a valid SVG
        const svgElement = doc.querySelector('svg');
        expect(svgElement).not.toBeNull();
      }
    });

    test('should consolidate defs sections', () => {
      const elementsWithLayout = calculateElementLayout(mockElements);
      const svg = generateSlideSVG(mockSlide, elementsWithLayout);

      // Count defs sections - should have at most 1
      const defsMatches = svg.match(/<defs>/g);
      if (defsMatches) {
        expect(defsMatches.length).toBeLessThanOrEqual(1);
      }

      // If there are defs, they should be properly closed
      const defsOpenCount = (svg.match(/<defs>/g) || []).length;
      const defsCloseCount = (svg.match(/<\/defs>/g) || []).length;
      expect(defsOpenCount).toBe(defsCloseCount);
    });

    test('should have unique IDs across elements', () => {
      const elementsWithLayout = calculateElementLayout(mockElements);
      const svg = generateSlideSVG(mockSlide, elementsWithLayout);

      // Extract all id attributes
      const idMatches = svg.match(/id="([^"]*)"/g);
      if (idMatches) {
        const ids = idMatches.map(match => match.match(/id="([^"]*)"/)[1]);
        const uniqueIds = new Set(ids);

        // All IDs should be unique (no duplicates)
        expect(uniqueIds.size).toBe(ids.length);
      }
    });
  });
});
