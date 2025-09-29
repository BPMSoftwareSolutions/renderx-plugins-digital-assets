// contextual-boundaries.test.js
const { renderScene } = require('../dist/render-svg');

describe('Contextual Boundaries Feature', () => {
  const sampleScene = {
    id: 'test-boundaries',
    canvas: { width: 800, height: 600 },
    bg: '#0f1116',
    defs: {
      filters: ['<filter id="laneShadow"><feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/></filter>'],
      gradients: ['<linearGradient id="rail" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7c3aed"/><stop offset="1" stop-color="#a78bfa"/></linearGradient>']
    },
    nodes: [
      {
        kind: 'boundary',
        id: 'lane1',
        title: 'Test Lane',
        at: { x: 50, y: 50 },
        size: { width: 300, height: 200 },
        style: { fill: '#141a24', stroke: '#253146', strokeWidth: 1.5, labelColor: '#e6edf3' },
        grid: { cols: 2, rowH: 80, gutter: 10, padding: 20 },
        children: [
          {
            kind: 'shape',
            id: 'node1',
            shape: 'roundedRect',
            at: { x: 20, y: 20 },
            size: { width: 100, height: 60 },
            style: { fill: '#1f2430', stroke: '#384559' }
          }
        ]
      }
    ],
    ports: [
      { id: 'port1', nodeId: 'node1', side: 'right', offset: 30 }
    ],
    connectors: [],
    flows: []
  };

  test('should render boundary nodes with titles', () => {
    const svg = renderScene(sampleScene);
    
    expect(svg).toContain('class="boundary"');
    expect(svg).toContain('Test Lane');
    expect(svg).toContain('boundary-title');
    expect(svg).toContain('filter="url(#laneShadow)"');
  });

  test('should include CSS styles for boundaries and animations', () => {
    const svg = renderScene(sampleScene);
    
    expect(svg).toContain('.active-glow rect');
    expect(svg).toContain('.connector { stroke-linecap: round; stroke-linejoin: round; }');
    expect(svg).toContain('.boundary-title');
    expect(svg).toContain('.flow-token');
  });

  test('should handle port-based connections', () => {
    const sceneWithConnector = {
      ...sampleScene,
      nodes: [
        ...sampleScene.nodes,
        {
          kind: 'boundary',
          id: 'lane2',
          title: 'Second Lane',
          at: { x: 400, y: 50 },
          size: { width: 300, height: 200 },
          style: { fill: '#141a24', stroke: '#253146', strokeWidth: 1.5, labelColor: '#e6edf3' },
          children: [
            {
              kind: 'shape',
              id: 'node2',
              shape: 'roundedRect',
              at: { x: 20, y: 20 },
              size: { width: 100, height: 60 },
              style: { fill: '#1f2430', stroke: '#384559' }
            }
          ]
        }
      ],
      ports: [
        ...sampleScene.ports,
        { id: 'port2', nodeId: 'node2', side: 'left', offset: 30 }
      ],
      connectors: [
        {
          id: 'conn1',
          from: { port: 'port1' },
          to: { port: 'port2' },
          route: 'orthogonal',
          style: { stroke: '#8b5cf6', strokeWidth: 2 }
        }
      ]
    };

    const svg = renderScene(sceneWithConnector);
    
    expect(svg).toContain('class="connector"');
    expect(svg).toContain('id="conn1"');
    // Should contain Manhattan routing path (multiple L commands)
    expect(svg).toMatch(/M \d+ \d+ L \d+ \d+ L \d+ \d+ L \d+ \d+/);
  });

  test('should render flows with animation', () => {
    const sceneWithFlow = {
      ...sampleScene,
      nodes: [
        ...sampleScene.nodes,
        {
          kind: 'boundary',
          id: 'lane2',
          title: 'Second Lane',
          at: { x: 400, y: 50 },
          size: { width: 300, height: 200 },
          style: { fill: '#141a24', stroke: '#253146', strokeWidth: 1.5, labelColor: '#e6edf3' },
          children: [
            {
              kind: 'shape',
              id: 'node2',
              shape: 'roundedRect',
              at: { x: 20, y: 20 },
              size: { width: 100, height: 60 },
              style: { fill: '#1f2430', stroke: '#384559' }
            }
          ]
        }
      ],
      ports: [
        ...sampleScene.ports,
        { id: 'port2', nodeId: 'node2', side: 'left', offset: 30 }
      ],
      connectors: [
        {
          id: 'conn1',
          from: { port: 'port1' },
          to: { port: 'port2' },
          route: 'orthogonal',
          style: { stroke: '#8b5cf6', strokeWidth: 2 }
        }
      ],
      flows: [
        {
          id: 'flow1',
          path: 'conn1',
          token: { size: 4, color: '#d6bcfa' },
          speed: 160,
          loop: true
        }
      ]
    };

    const svg = renderScene(sceneWithFlow);
    
    expect(svg).toContain('class="flow"');
    expect(svg).toContain('id="flow1"');
    expect(svg).toContain('animateMotion');
    expect(svg).toContain('repeatCount="infinite"');
    expect(svg).toContain('mpath href="#flow1-path"');
    expect(svg).toContain('fill="#d6bcfa"');
  });

  test('should handle empty ports, connectors, and flows arrays', () => {
    const minimalScene = {
      id: 'minimal',
      canvas: { width: 400, height: 300 },
      nodes: [
        {
          kind: 'boundary',
          id: 'lane1',
          title: 'Minimal Lane',
          at: { x: 50, y: 50 },
          size: { width: 300, height: 200 },
          style: { fill: '#141a24', stroke: '#253146' },
          children: []
        }
      ]
    };

    const svg = renderScene(minimalScene);
    
    expect(svg).toContain('class="boundary"');
    expect(svg).toContain('Minimal Lane');
    expect(svg).not.toContain('class="connector"');
    expect(svg).not.toContain('class="flow"');
  });
});
