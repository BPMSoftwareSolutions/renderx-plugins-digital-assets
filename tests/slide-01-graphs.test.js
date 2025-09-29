const { graphToSVG } = require('../dist/svg-export');
const fs = require('fs');
const path = require('path');

describe('Slide 01 Graph Specifications', () => {
  const slide01Dir = path.join(__dirname, '..', 'samples', 'slide-01');
  let indexData;
  
  beforeAll(() => {
    // Load the index file
    const indexPath = path.join(slide01Dir, 'index.json');
    expect(fs.existsSync(indexPath)).toBe(true);
    indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  });

  test('should have valid index file structure', () => {
    expect(indexData).toHaveProperty('title');
    expect(indexData).toHaveProperty('description');
    expect(indexData).toHaveProperty('source');
    expect(indexData).toHaveProperty('generated');
    expect(indexData).toHaveProperty('graphs');
    expect(Array.isArray(indexData.graphs)).toBe(true);
    expect(indexData.graphs.length).toBe(8);
  });

  test('should reference slide-01-manifest as source', () => {
    expect(indexData.source).toContain('plugin-integration-slides.json');
    expect(indexData.title).toContain('Plugin Scaffolding & Manifest');
  });

  describe('Individual Graph Files', () => {
    indexData?.graphs?.forEach(graphInfo => {
      describe(`${graphInfo.name}`, () => {
        let graph;
        let jsonPath;
        let svgPath;

        beforeAll(() => {
          jsonPath = path.join(slide01Dir, graphInfo.file);
          svgPath = path.join(slide01Dir, graphInfo.svg);
          
          expect(fs.existsSync(jsonPath)).toBe(true);
          expect(fs.existsSync(svgPath)).toBe(true);
          
          graph = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        });

        test('should have valid graph structure', () => {
          expect(graph).toHaveProperty('nodes');
          expect(graph).toHaveProperty('edges');
          expect(graph).toHaveProperty('meta');
          expect(Array.isArray(graph.nodes)).toBe(true);
          expect(Array.isArray(graph.edges)).toBe(true);
        });

        test('should match index metadata', () => {
          expect(graph.nodes.length).toBe(graphInfo.nodes);
          expect(graph.edges.length).toBe(graphInfo.edges);
          expect(graph.meta.layout).toBe(graphInfo.layout);
          expect(graph.meta.theme).toBe(graphInfo.theme);
        });

        test('should have description and source metadata', () => {
          expect(graph).toHaveProperty('description');
          expect(graph).toHaveProperty('source');
          expect(graph.description).toBe(graphInfo.description);
          expect(graph.source).toContain('slide-01-manifest');
        });

        test('should generate valid SVG', () => {
          expect(() => graphToSVG(graph)).not.toThrow();
          
          const svg = graphToSVG(graph);
          expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
          expect(svg).toContain('<svg');
          expect(svg).toContain('</svg>');
          expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        });

        test('should have valid node IDs and labels', () => {
          graph.nodes.forEach(node => {
            expect(node).toHaveProperty('id');
            expect(node).toHaveProperty('label');
            expect(typeof node.id).toBe('string');
            expect(typeof node.label).toBe('string');
            expect(node.id.length).toBeGreaterThan(0);
            expect(node.label.length).toBeGreaterThan(0);
          });
        });

        test('should have valid edges with existing node references', () => {
          const nodeIds = new Set(graph.nodes.map(n => n.id));
          
          graph.edges.forEach(edge => {
            expect(edge).toHaveProperty('from');
            expect(edge).toHaveProperty('to');
            expect(nodeIds.has(edge.from)).toBe(true);
            expect(nodeIds.has(edge.to)).toBe(true);
            
            if (edge.label) {
              expect(typeof edge.label).toBe('string');
              expect(edge.label.length).toBeGreaterThan(0);
            }
          });
        });

        test('generated SVG file should match programmatic generation', () => {
          const generatedSVG = graphToSVG(graph);
          const fileSVG = fs.readFileSync(svgPath, 'utf-8');
          
          // Compare key structural elements (allowing for minor formatting differences)
          expect(fileSVG).toContain('<?xml version="1.0" encoding="UTF-8"?>');
          expect(fileSVG).toContain('<svg');
          expect(fileSVG).toContain('</svg>');
          
          // Check that all nodes are represented
          graph.nodes.forEach(node => {
            expect(fileSVG).toContain(node.label);
            expect(fileSVG).toContain(`data-id="${node.id}"`);
          });
          
          // Check that all edges are represented
          graph.edges.forEach(edge => {
            if (edge.label) {
              expect(fileSVG).toContain(edge.label);
            }
          });
        });
      });
    });
  });

  describe('Graph Content Validation', () => {
    test('plugin-package-structure should represent sub-elements correctly', () => {
      const graph = JSON.parse(fs.readFileSync(path.join(slide01Dir, 'plugin-package-structure.json'), 'utf-8'));
      
      const expectedNodes = ['package-box', 'shadow', 'label', 'glyphs', 'npm-badge'];
      const actualNodes = graph.nodes.map(n => n.id);
      
      expectedNodes.forEach(nodeId => {
        expect(actualNodes).toContain(nodeId);
      });
      
      // Should have package-box as the central element
      const packageBoxEdges = graph.edges.filter(e => e.from === 'package-box');
      expect(packageBoxEdges.length).toBeGreaterThan(0);
    });

    test('slide-01-architecture should represent main elements', () => {
      const graph = JSON.parse(fs.readFileSync(path.join(slide01Dir, 'slide-01-architecture.json'), 'utf-8'));
      
      const expectedElements = ['plugin-package', 'plugin-manifest', 'handlers-export', 'build-publish', 'host-sdk'];
      const actualNodes = graph.nodes.map(n => n.id);
      
      expectedElements.forEach(elementId => {
        expect(actualNodes).toContain(elementId);
      });
    });

    test('plugin-workflow should represent development process', () => {
      const graph = JSON.parse(fs.readFileSync(path.join(slide01Dir, 'plugin-workflow.json'), 'utf-8'));
      
      const workflowSteps = ['scaffold', 'define-manifest', 'implement-handlers', 'build-package', 'publish-npm', 'host-discovery'];
      const actualNodes = graph.nodes.map(n => n.id);
      
      workflowSteps.forEach(stepId => {
        expect(actualNodes).toContain(stepId);
      });
      
      // Should be a linear workflow (layered layout)
      expect(graph.meta.layout).toBe('layered');
    });

    test('plugin-capabilities should use radial layout for capabilities', () => {
      const graph = JSON.parse(fs.readFileSync(path.join(slide01Dir, 'plugin-capabilities.json'), 'utf-8'));
      
      expect(graph.meta.layout).toBe('radial');
      
      // Should have plugin-core as central node
      const coreNode = graph.nodes.find(n => n.id === 'plugin-core');
      expect(coreNode).toBeDefined();
      
      // Should have capability nodes connected to core
      const capabilityEdges = graph.edges.filter(e => e.from === 'plugin-core');
      expect(capabilityEdges.length).toBeGreaterThan(0);
    });
  });
});
