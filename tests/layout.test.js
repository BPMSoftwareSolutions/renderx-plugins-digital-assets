const { layoutGraph } = require('../dist/layout');

describe('Layout Engine', () => {
  describe('Grid Layout', () => {
    test('should arrange nodes in a grid pattern', () => {
      const graph = {
        nodes: [
          { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }
        ],
        edges: [],
        meta: { layout: 'grid', spacingX: 100, spacingY: 80 }
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(4);
      
      // For 4 nodes, grid should be 2x2
      expect(result.nodes[0]).toMatchObject({ x: 0, y: 0 });    // A: (0,0)
      expect(result.nodes[1]).toMatchObject({ x: 100, y: 0 });  // B: (1,0)
      expect(result.nodes[2]).toMatchObject({ x: 0, y: 80 });   // C: (0,1)
      expect(result.nodes[3]).toMatchObject({ x: 100, y: 80 }); // D: (1,1)
    });

    test('should handle single node', () => {
      const graph = {
        nodes: [{ id: 'A' }],
        edges: []
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0]).toMatchObject({ x: 0, y: 0 });
    });

    test('should use default spacing when not specified', () => {
      const graph = {
        nodes: [{ id: 'A' }, { id: 'B' }],
        edges: []
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes[0]).toMatchObject({ x: 0, y: 0 });
      expect(result.nodes[1]).toMatchObject({ x: 180, y: 0 }); // default spacingX = 180
    });
  });

  describe('Radial Layout', () => {
    test('should arrange nodes in a circle', () => {
      const graph = {
        nodes: [
          { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }
        ],
        edges: [],
        meta: { layout: 'radial' }
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(4);
      
      const centerX = 240; // R + 20 = 220 + 20
      const centerY = 240;
      const radius = 220;
      
      // Check that all nodes are approximately at the correct radius
      result.nodes.forEach(node => {
        const distance = Math.sqrt(Math.pow(node.x - centerX, 2) + Math.pow(node.y - centerY, 2));
        expect(distance).toBeCloseTo(radius, 0);
      });
      
      // Check that nodes are evenly distributed around the circle
      const angles = result.nodes.map(node => 
        Math.atan2(node.y - centerY, node.x - centerX)
      );
      
      // Sort angles to check distribution
      angles.sort((a, b) => a - b);
      const expectedAngleStep = (2 * Math.PI) / 4;
      
      for (let i = 1; i < angles.length; i++) {
        const actualStep = angles[i] - angles[i-1];
        expect(actualStep).toBeCloseTo(expectedAngleStep, 1);
      }
    });

    test('should handle single node in center area', () => {
      const graph = {
        nodes: [{ id: 'A' }],
        edges: [],
        meta: { layout: 'radial' }
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(1);
      // Single node should be at angle 0
      expect(result.nodes[0].x).toBeCloseTo(460, 0); // 240 + 220 * cos(0)
      expect(result.nodes[0].y).toBeCloseTo(240, 0); // 240 + 220 * sin(0)
    });
  });

  describe('Layered Layout', () => {
    test('should arrange nodes in layers based on dependencies', () => {
      const graph = {
        nodes: [
          { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }
        ],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'C' },
          { from: 'A', to: 'D' }
        ],
        meta: { layout: 'layered', spacingX: 100, spacingY: 80 }
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(4);
      
      const nodeA = result.nodes.find(n => n.id === 'A');
      const nodeB = result.nodes.find(n => n.id === 'B');
      const nodeC = result.nodes.find(n => n.id === 'C');
      const nodeD = result.nodes.find(n => n.id === 'D');
      
      // A should be at layer 0 (source)
      expect(nodeA.x).toBe(0);
      
      // B and D should be at layer 1 (depend on A)
      expect(nodeB.x).toBe(100);
      expect(nodeD.x).toBe(100);
      
      // C should be at layer 2 (depends on B)
      expect(nodeC.x).toBe(200);
      
      // Nodes in same layer should have different Y coordinates
      expect(nodeB.y).not.toBe(nodeD.y);
    });

    test('should handle disconnected components', () => {
      const graph = {
        nodes: [
          { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }
        ],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'C', to: 'D' }
        ],
        meta: { layout: 'layered', spacingX: 100, spacingY: 80 }
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(4);
      
      const nodeA = result.nodes.find(n => n.id === 'A');
      const nodeB = result.nodes.find(n => n.id === 'B');
      const nodeC = result.nodes.find(n => n.id === 'C');
      const nodeD = result.nodes.find(n => n.id === 'D');
      
      // A and C should be sources (layer 0)
      expect(nodeA.x).toBe(0);
      expect(nodeC.x).toBe(0);
      
      // B and D should be at layer 1
      expect(nodeB.x).toBe(100);
      expect(nodeD.x).toBe(100);
    });

    test('should handle cycles gracefully', () => {
      const graph = {
        nodes: [
          { id: 'A' }, { id: 'B' }, { id: 'C' }
        ],
        edges: [
          { from: 'A', to: 'B' },
          { from: 'B', to: 'C' },
          { from: 'C', to: 'A' } // Creates a cycle
        ],
        meta: { layout: 'layered' }
      };

      // Should not throw an error
      expect(() => layoutGraph(graph)).not.toThrow();
      
      const result = layoutGraph(graph);
      expect(result.nodes).toHaveLength(3);
    });
  });

  describe('Node Dimensions', () => {
    test('should apply default dimensions', () => {
      const graph = {
        nodes: [{ id: 'A' }],
        edges: []
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes[0]).toMatchObject({
        w: 120,
        h: 48
      });
    });

    test('should preserve custom dimensions', () => {
      const graph = {
        nodes: [{ id: 'A', w: 200, h: 100 }],
        edges: []
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes[0]).toMatchObject({
        w: 200,
        h: 100
      });
    });

    test('should mix default and custom dimensions', () => {
      const graph = {
        nodes: [
          { id: 'A', w: 200 }, // Custom width, default height
          { id: 'B', h: 100 }  // Default width, custom height
        ],
        edges: []
      };

      const result = layoutGraph(graph);
      
      expect(result.nodes[0]).toMatchObject({ w: 200, h: 48 });
      expect(result.nodes[1]).toMatchObject({ w: 120, h: 100 });
    });
  });
});
