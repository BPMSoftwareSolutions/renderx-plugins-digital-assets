const { renderScene } = require('../dist/render-svg');
const { slide01 } = require('../dist/slide01-data');
const fs = require('fs');
const path = require('path');

describe('Advanced Scene Graph System', () => {
  const sceneDir = path.join(__dirname, '..', 'samples', 'slide-01-scene');
  
  beforeAll(() => {
    expect(fs.existsSync(sceneDir)).toBe(true);
  });

  describe('Scene Schema Validation', () => {
    test('slide01 scene should have valid structure', () => {
      expect(slide01).toHaveProperty('id');
      expect(slide01).toHaveProperty('canvas');
      expect(slide01).toHaveProperty('bg');
      expect(slide01).toHaveProperty('defs');
      expect(slide01).toHaveProperty('nodes');
      expect(slide01).toHaveProperty('connectors');
      
      expect(slide01.id).toBe('slide-01-manifest');
      expect(slide01.canvas).toEqual({ width: 1200, height: 720 });
      expect(slide01.bg).toBe('#0f1116');
      expect(Array.isArray(slide01.nodes)).toBe(true);
      expect(Array.isArray(slide01.connectors)).toBe(true);
    });

    test('should have sprite symbols defined', () => {
      expect(slide01.defs).toHaveProperty('symbols');
      expect(Array.isArray(slide01.defs.symbols)).toBe(true);
      expect(slide01.defs.symbols.length).toBeGreaterThan(0);
      
      // Check for expected sprite categories
      const symbolIds = slide01.defs.symbols.map(s => s.id);
      expect(symbolIds.some(id => id.startsWith('pkg/'))).toBe(true);
      expect(symbolIds.some(id => id.startsWith('manifest/'))).toBe(true);
      expect(symbolIds.some(id => id.startsWith('handlers/'))).toBe(true);
      expect(symbolIds.some(id => id.startsWith('build/'))).toBe(true);
      expect(symbolIds.some(id => id.startsWith('host/'))).toBe(true);
    });

    test('should have filters and gradients defined', () => {
      expect(slide01.defs).toHaveProperty('filters');
      expect(slide01.defs).toHaveProperty('gradients');
      expect(Array.isArray(slide01.defs.filters)).toBe(true);
      expect(Array.isArray(slide01.defs.gradients)).toBe(true);
      
      // Check for soft shadow filter
      expect(slide01.defs.filters.some(f => f.includes('softShadow'))).toBe(true);
      
      // Check for violet gradient
      expect(slide01.defs.gradients.some(g => g.includes('violetArc'))).toBe(true);
    });

    test('should have 5 main tile groups', () => {
      expect(slide01.nodes.length).toBe(5);
      
      const expectedTiles = ['plugin-package', 'plugin-manifest', 'handlers-export', 'build-publish', 'host-sdk'];
      const actualTiles = slide01.nodes.map(n => n.id);
      
      expectedTiles.forEach(tileId => {
        expect(actualTiles).toContain(tileId);
      });
    });

    test('each tile should be a group with children', () => {
      slide01.nodes.forEach(node => {
        expect(node.kind).toBe('group');
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('at');
        expect(node).toHaveProperty('size');
        expect(node).toHaveProperty('children');
        expect(Array.isArray(node.children)).toBe(true);
        expect(node.children.length).toBeGreaterThan(0);
      });
    });

    test('should have connectors with proper routing', () => {
      expect(slide01.connectors.length).toBe(2);
      
      slide01.connectors.forEach(connector => {
        expect(connector).toHaveProperty('from');
        expect(connector).toHaveProperty('to');
        expect(connector).toHaveProperty('route');
        expect(connector).toHaveProperty('markerEnd');
        expect(connector).toHaveProperty('style');
        
        expect(['straight', 'orthogonal', 'curve']).toContain(connector.route);
        expect(['arrow', 'none']).toContain(connector.markerEnd);
      });
    });
  });

  describe('SVG Rendering', () => {
    test('should render valid SVG from scene', () => {
      expect(() => renderScene(slide01)).not.toThrow();
      
      const svg = renderScene(slide01);
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    test('rendered SVG should include all symbols', () => {
      const svg = renderScene(slide01);
      
      slide01.defs.symbols.forEach(symbol => {
        expect(svg).toContain(`id="${symbol.id}"`);
      });
    });

    test('rendered SVG should include filters and gradients', () => {
      const svg = renderScene(slide01);
      
      expect(svg).toContain('id="softShadow"');
      expect(svg).toContain('id="violetArc"');
      expect(svg).toContain('feDropShadow');
      expect(svg).toContain('linearGradient');
    });

    test('rendered SVG should include all groups and sprites', () => {
      const svg = renderScene(slide01);
      
      slide01.nodes.forEach(node => {
        expect(svg).toContain(`id="${node.id}"`);
        
        if (node.children) {
          node.children.forEach(child => {
            expect(svg).toContain(`id="${child.id}"`);
          });
        }
      });
    });

    test('rendered SVG should include connectors', () => {
      const svg = renderScene(slide01);
      
      expect(svg).toContain('class="connector"');
      expect(svg).toContain('marker-end="url(#arrowHead)"');
      
      slide01.connectors.forEach(connector => {
        if (connector.dashed) {
          expect(svg).toContain('stroke-dasharray="6 6"');
        }
      });
    });

    test('should match canvas dimensions', () => {
      const svg = renderScene(slide01);
      
      expect(svg).toContain(`width="${slide01.canvas.width}"`);
      expect(svg).toContain(`height="${slide01.canvas.height}"`);
      expect(svg).toContain(`viewBox="0 0 ${slide01.canvas.width} ${slide01.canvas.height}"`);
    });

    test('should include background color', () => {
      const svg = renderScene(slide01);
      
      expect(svg).toContain(`fill="${slide01.bg}"`);
    });
  });

  describe('Generated Files Validation', () => {
    test('main scene files should exist and be valid', () => {
      const svgPath = path.join(sceneDir, 'slide-01-manifest.svg');
      const jsonPath = path.join(sceneDir, 'slide-01-manifest.json');
      
      expect(fs.existsSync(svgPath)).toBe(true);
      expect(fs.existsSync(jsonPath)).toBe(true);
      
      const svgContent = fs.readFileSync(svgPath, 'utf-8');
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      
      expect(svgContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(() => JSON.parse(jsonContent)).not.toThrow();
      
      const parsedScene = JSON.parse(jsonContent);
      expect(parsedScene.id).toBe('slide-01-manifest');
    });

    test('individual tile files should exist', () => {
      const expectedTiles = ['plugin-package', 'plugin-manifest', 'handlers-export', 'build-publish', 'host-sdk'];
      
      expectedTiles.forEach(tileId => {
        const svgPath = path.join(sceneDir, `${tileId}.svg`);
        const jsonPath = path.join(sceneDir, `${tileId}.json`);
        
        expect(fs.existsSync(svgPath)).toBe(true);
        expect(fs.existsSync(jsonPath)).toBe(true);
        
        const svgContent = fs.readFileSync(svgPath, 'utf-8');
        expect(svgContent).toContain('<?xml version="1.0" encoding="UTF-8"?>');
        expect(svgContent).toContain(`aria-label="slide-01-manifest-${tileId}"`);
      });
    });

    test('index file should have correct metadata', () => {
      const indexPath = path.join(sceneDir, 'index.json');
      expect(fs.existsSync(indexPath)).toBe(true);
      
      const indexContent = fs.readFileSync(indexPath, 'utf-8');
      const indexData = JSON.parse(indexContent);
      
      expect(indexData).toHaveProperty('title');
      expect(indexData).toHaveProperty('description');
      expect(indexData).toHaveProperty('system');
      expect(indexData).toHaveProperty('features');
      expect(indexData).toHaveProperty('scenes');
      
      expect(indexData.system).toContain('Advanced Scene Graph');
      expect(Array.isArray(indexData.features)).toBe(true);
      expect(Array.isArray(indexData.scenes)).toBe(true);
      expect(indexData.scenes.length).toBe(6); // 1 main + 5 tiles
    });
  });

  describe('Positioning Accuracy', () => {
    test('tiles should be positioned according to slide specifications', () => {
      const expectedPositions = {
        'plugin-package': { x: 23, y: 155 },
        'plugin-manifest': { x: 390, y: 155 },
        'handlers-export': { x: 757, y: 155 },
        'build-publish': { x: 23, y: 505 },
        'host-sdk': { x: 390, y: 505 }
      };
      
      slide01.nodes.forEach(node => {
        const expected = expectedPositions[node.id];
        expect(node.at).toEqual(expected);
        expect(node.size).toEqual({ width: 420, height: 140 });
      });
    });

    test('rendered SVG should have correct transforms', () => {
      const svg = renderScene(slide01);

      const expectedTransforms = [
        'transform="translate(23 155)"',
        'transform="translate(390 155)"',
        'transform="translate(757 155)"',
        'transform="translate(23 505)"',
        'transform="translate(390 505)"'
      ];

      expectedTransforms.forEach(transform => {
        expect(svg).toContain(transform);
      });
    });
  });

  describe('Handlers Export Improvements', () => {
    test('should have proper layering with dark card background', () => {
      const handlersExportNode = slide01.nodes.find(n => n.id === 'handlers-export');
      expect(handlersExportNode).toBeDefined();
      expect(handlersExportNode.children).toBeDefined();

      // Should have dark card as first child (background layer)
      const cardChild = handlersExportNode.children.find(c => c.id === 'hx.card');
      expect(cardChild).toBeDefined();
      expect(cardChild.kind).toBe('shape');
      expect(cardChild.shape).toBe('roundedRect');
      expect(cardChild.style.fill).toBe('#151922');
      expect(cardChild.style.filter).toBe('url(#softShadow)');
    });

    test('should have enhanced filters including glow effect', () => {
      expect(slide01.defs.filters).toBeDefined();
      expect(slide01.defs.filters.length).toBeGreaterThanOrEqual(2);

      // Should have both soft shadow and glow filters
      const filterStrings = slide01.defs.filters.join(' ');
      expect(filterStrings).toContain('softShadow');
      expect(filterStrings).toContain('glow');
      expect(filterStrings).toContain('feGaussianBlur');
      expect(filterStrings).toContain('feMerge');
    });

    test('should render improved handlers export with proper structure', () => {
      const svg = renderScene(slide01);

      // Should contain the dark card background
      expect(svg).toContain('fill:#151922');
      expect(svg).toContain('filter:url(#softShadow)');

      // Should contain the glow filter definition
      expect(svg).toContain('id="glow"');
      expect(svg).toContain('feGaussianBlur');

      // Should contain the violet gradient
      expect(svg).toContain('id="violetArc"');
      expect(svg).toContain('#8b5cf6');
      expect(svg).toContain('#a78bfa');
    });
  });
});
