const { graphToSVG } = require('../dist/svg-export');
const { layoutGraph } = require('../dist/layout');

describe('Graph to SVG Converter', () => {
  describe('Basic Graph Rendering', () => {
    test('should generate valid SVG for simple graph', () => {
      const graph = {
        nodes: [
          { id: 'A', label: 'Node A' },
          { id: 'B', label: 'Node B' }
        ],
        edges: [
          { from: 'A', to: 'B' }
        ]
      };

      const svg = graphToSVG(graph);
      
      expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(svg).toContain('<svg');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('Node A');
      expect(svg).toContain('Node B');
      expect(svg).toContain('class="node"');
      expect(svg).toContain('class="edge"');
    });

    test('should handle empty graph', () => {
      const graph = {
        nodes: [],
        edges: []
      };

      const svg = graphToSVG(graph);
      
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).not.toContain('class="node"');
      expect(svg).not.toContain('class="edge"');
    });

    test('should handle nodes without edges', () => {
      const graph = {
        nodes: [
          { id: 'A', label: 'Isolated Node' }
        ],
        edges: []
      };

      const svg = graphToSVG(graph);
      
      expect(svg).toContain('Isolated Node');
      expect(svg).toContain('class="node"');
      expect(svg).not.toContain('class="edge"');
    });
  });

  describe('Layout Engines', () => {
    const testGraph = {
      nodes: [
        { id: 'A' }, { id: 'B' }, { id: 'C' }, { id: 'D' }
      ],
      edges: [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'C' },
        { from: 'C', to: 'D' }
      ]
    };

    test('should use grid layout by default', () => {
      const result = layoutGraph(testGraph);
      
      expect(result.nodes).toHaveLength(4);
      expect(result.nodes[0]).toHaveProperty('x');
      expect(result.nodes[0]).toHaveProperty('y');
      expect(result.nodes[0]).toHaveProperty('w', 120);
      expect(result.nodes[0]).toHaveProperty('h', 48);
    });

    test('should use radial layout when specified', () => {
      const graph = {
        ...testGraph,
        meta: { layout: 'radial' }
      };
      
      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(4);
      // In radial layout, nodes should be positioned in a circle
      const distances = result.nodes.map(n => Math.sqrt(Math.pow(n.x - 240, 2) + Math.pow(n.y - 240, 2)));
      // All nodes should be approximately the same distance from center (220px radius)
      distances.forEach(d => expect(d).toBeCloseTo(220, 0));
    });

    test('should use layered layout when specified', () => {
      const graph = {
        ...testGraph,
        meta: { layout: 'layered', spacingX: 100, spacingY: 80 }
      };
      
      const result = layoutGraph(graph);
      
      expect(result.nodes).toHaveLength(4);
      // In layered layout, nodes should be arranged in layers based on dependencies
      const nodeA = result.nodes.find(n => n.id === 'A');
      const nodeB = result.nodes.find(n => n.id === 'B');
      const nodeC = result.nodes.find(n => n.id === 'C');
      const nodeD = result.nodes.find(n => n.id === 'D');
      
      expect(nodeA.x).toBe(0);
      expect(nodeB.x).toBe(100);
      expect(nodeC.x).toBe(200);
      expect(nodeD.x).toBe(300);
    });
  });

  describe('Themes and Styling', () => {
    const simpleGraph = {
      nodes: [{ id: 'A', label: 'Test' }],
      edges: []
    };

    test('should apply light theme by default', () => {
      const svg = graphToSVG(simpleGraph);
      
      expect(svg).toContain('fill: #ffffff'); // light background
      expect(svg).toContain('fill: #f7f8fa'); // light node fill
      expect(svg).toContain('fill: #0f172a'); // dark text
    });

    test('should apply dark theme when specified', () => {
      const graph = {
        ...simpleGraph,
        meta: { theme: 'dark' }
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).toContain('fill: #0f1116'); // dark background
      expect(svg).toContain('fill: #1f2430'); // dark node fill
      expect(svg).toContain('fill: #e6edf3'); // light text
    });

    test('should handle rounded corners option', () => {
      const graph = {
        ...simpleGraph,
        meta: { rounded: false }
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).toContain('rx="0"');
      expect(svg).toContain('ry="0"');
    });

    test('should handle arrow heads option', () => {
      const graph = {
        nodes: [{ id: 'A' }, { id: 'B' }],
        edges: [{ from: 'A', to: 'B' }],
        meta: { arrowHeads: false }
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).not.toContain('marker-end="url(#arrow)"');
    });
  });

  describe('Edge Features', () => {
    test('should render dashed edges', () => {
      const graph = {
        nodes: [{ id: 'A' }, { id: 'B' }],
        edges: [{ from: 'A', to: 'B', dashed: true }]
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).toContain('stroke-dasharray="6 6"');
    });

    test('should render edge labels', () => {
      const graph = {
        nodes: [{ id: 'A' }, { id: 'B' }],
        edges: [{ from: 'A', to: 'B', label: 'Connection' }]
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).toContain('Connection');
      expect(svg).toContain('class="edge-label"');
    });

    test('should handle custom edge IDs', () => {
      const graph = {
        nodes: [{ id: 'A' }, { id: 'B' }],
        edges: [{ id: 'custom-edge', from: 'A', to: 'B' }]
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).toContain('data-id="custom-edge"');
    });
  });

  describe('XML Safety', () => {
    test('should escape XML characters in labels', () => {
      const graph = {
        nodes: [{ id: 'A', label: 'Test <>&"\'' }],
        edges: []
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).toContain('&lt;&gt;&amp;&quot;&apos;');
      expect(svg).not.toContain('Test <>&"\'');
    });

    test('should escape XML characters in edge labels', () => {
      const graph = {
        nodes: [{ id: 'A' }, { id: 'B' }],
        edges: [{ from: 'A', to: 'B', label: 'Test <>&"\'' }]
      };
      
      const svg = graphToSVG(graph);
      
      expect(svg).toContain('&lt;&gt;&amp;&quot;&apos;');
    });
  });
});
