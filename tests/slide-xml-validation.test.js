const fs = require('fs');
const path = require('path');

describe('Generated Slide SVG XML Validation', () => {
  const slidesDir = path.join(__dirname, '../assets/plugin-architecture');
  const slideFiles = [
    'slide-01-manifest.svg',
    'slide-02-discovery.svg', 
    'slide-03-events.svg',
    'slide-04-ui.svg',
    'slide-05-quality.svg'
  ];

  slideFiles.forEach(slideFile => {
    describe(`${slideFile}`, () => {
      let svgContent;

      beforeAll(() => {
        const slidePath = path.join(slidesDir, slideFile);
        if (fs.existsSync(slidePath)) {
          svgContent = fs.readFileSync(slidePath, 'utf8');
        }
      });

      test('should exist', () => {
        const slidePath = path.join(slidesDir, slideFile);
        expect(fs.existsSync(slidePath)).toBe(true);
      });

      test('should have valid XML structure', () => {
        expect(svgContent).toBeDefined();
        expect(svgContent.length).toBeGreaterThan(0);
        
        // Basic XML structure checks
        expect(svgContent).toMatch(/^<svg[^>]*>/);
        expect(svgContent).toMatch(/<\/svg>\s*$/);
      });

      test('should have at most one defs section', () => {
        if (!svgContent) return;
        
        const defsMatches = svgContent.match(/<defs>/g);
        if (defsMatches) {
          expect(defsMatches.length).toBeLessThanOrEqual(1);
        }
        
        // If there are defs, they should be properly closed
        const defsOpenCount = (svgContent.match(/<defs>/g) || []).length;
        const defsCloseCount = (svgContent.match(/<\/defs>/g) || []).length;
        expect(defsOpenCount).toBe(defsCloseCount);
      });

      test('should have unique IDs', () => {
        if (!svgContent) return;
        
        // Extract all id attributes
        const idMatches = svgContent.match(/id="([^"]*)"/g);
        if (idMatches) {
          const ids = idMatches.map(match => match.match(/id="([^"]*)"/)[1]);
          const uniqueIds = new Set(ids);
          
          // Report duplicates for debugging
          if (uniqueIds.size !== ids.length) {
            const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
            console.warn(`Duplicate IDs found in ${slideFile}:`, [...new Set(duplicates)]);
          }
          
          // All IDs should be unique (no duplicates)
          expect(uniqueIds.size).toBe(ids.length);
        }
      });

      test('should parse as valid XML using DOMParser', () => {
        if (!svgContent) return;
        
        // Use jsdom's DOMParser for Node.js environment
        const { JSDOM } = require('jsdom');
        const dom = new JSDOM();
        const parser = new dom.window.DOMParser();
        
        const doc = parser.parseFromString(svgContent, 'image/svg+xml');
        
        // Check for parsing errors
        const parserError = doc.querySelector('parsererror');
        if (parserError) {
          console.error(`XML parsing error in ${slideFile}:`, parserError.textContent);
        }
        expect(parserError).toBeNull();
        
        // Verify it's a valid SVG
        const svgElement = doc.querySelector('svg');
        expect(svgElement).not.toBeNull();
      });

      test('should have proper SVG dimensions', () => {
        if (!svgContent) return;
        
        expect(svgContent).toContain('width="1200"');
        expect(svgContent).toContain('height="800"');
        expect(svgContent).toContain('viewBox="0 0 1200 800"');
      });

      test('should have slide title and description', () => {
        if (!svgContent) return;
        
        expect(svgContent).toContain('<title>');
        expect(svgContent).toContain('</title>');
        expect(svgContent).toContain('<desc>');
        expect(svgContent).toContain('</desc>');
      });

      test('should have positioned element groups', () => {
        if (!svgContent) return;
        
        // Should have element groups with transforms
        const groupMatches = svgContent.match(/<g[^>]*id="[^"]*"[^>]*transform="translate\(\d+,\d+\)"[^>]*>/g);
        if (groupMatches) {
          expect(groupMatches.length).toBeGreaterThan(0);
        }
      });

      test('should have balanced group tags', () => {
        if (!svgContent) return;
        
        const openGroups = (svgContent.match(/<g[^>]*>/g) || []).length;
        const closeGroups = (svgContent.match(/<\/g>/g) || []).length;
        
        if (openGroups !== closeGroups) {
          console.error(`Unbalanced group tags in ${slideFile}: ${openGroups} open, ${closeGroups} close`);
        }
        
        expect(openGroups).toBe(closeGroups);
      });
    });
  });

  describe('Cross-slide validation', () => {
    test('all slides should have consistent structure', () => {
      const existingSlides = slideFiles.filter(slideFile => {
        const slidePath = path.join(slidesDir, slideFile);
        return fs.existsSync(slidePath);
      });

      expect(existingSlides.length).toBeGreaterThan(0);

      existingSlides.forEach(slideFile => {
        const slidePath = path.join(slidesDir, slideFile);
        const content = fs.readFileSync(slidePath, 'utf8');
        
        // All slides should have the same dimensions
        expect(content).toContain('width="1200"');
        expect(content).toContain('height="800"');
        
        // All slides should have background
        expect(content).toContain('fill="#FAFAFA"');
        
        // All slides should have title text
        expect(content).toMatch(/<text[^>]*>Phase \d+:/);
      });
    });
  });
});
