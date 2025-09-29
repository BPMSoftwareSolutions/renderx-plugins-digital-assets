// boundary-containment.test.js
const { enforceBoundaries, DEFAULT_BOUNDARY_POLICY, snap, clampTo, contains } = require('../dist/boundary-enforcement');
const { generateDiagnosticReport, generateAutoFixSuggestions } = require('../dist/diagnostics');
const { collectContainmentRequirements, generateClipPath, needsContainment } = require('../dist/visual-containment');

describe('Boundary Enforcement System', () => {
  describe('Utility Functions', () => {
    test('snap function rounds to grid correctly', () => {
      expect(snap(13, 4)).toBe(12);
      expect(snap(15, 4)).toBe(16);
      expect(snap(10, 1)).toBe(10);
    });

    test('clampTo constrains rectangle within container', () => {
      const container = { x: 0, y: 0, w: 100, h: 100 };
      const child = { x: 50, y: 150, w: 30, h: 20 };
      const clamped = clampTo(container, child);
      
      expect(clamped.x).toBe(50);
      expect(clamped.y).toBe(80); // 100 - 20 = 80
      expect(clamped.w).toBe(30);
      expect(clamped.h).toBe(20);
    });

    test('contains function detects containment correctly', () => {
      const container = { x: 0, y: 0, w: 100, h: 100 };
      const inside = { x: 10, y: 10, w: 50, h: 50 };
      const outside = { x: 50, y: 50, w: 60, h: 60 };
      
      expect(contains(container, inside)).toBe(true);
      expect(contains(container, outside)).toBe(false);
      expect(contains(container, outside, 10)).toBe(true); // with tolerance
    });
  });

  describe('Boundary Policy Enforcement', () => {
    test('enforces strict mode with clipping', () => {
      const scene = {
        id: 'test-scene',
        canvas: { width: 400, height: 300 },
        nodes: [
          {
            kind: 'boundary',
            id: 'container',
            at: { x: 50, y: 50 },
            size: { width: 200, height: 150 },
            policy: { mode: 'strict', overflow: 'clip', tolerance: 0 },
            children: [
              {
                kind: 'shape',
                id: 'overflow-node',
                at: { x: 180, y: 120 }, // This will overflow
                size: { width: 50, height: 50 },
                shape: 'rect'
              }
            ]
          }
        ]
      };

      const result = enforceBoundaries(scene);
      
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].code).toBe('OUT_OF_BOUNDS');
      expect(result.diagnostics[0].severity).toBe('error');
      expect(result.summary.errors).toBe(1);
    });

    test('applies grid snapping when configured', () => {
      const scene = {
        id: 'snap-test',
        canvas: { width: 400, height: 300 },
        nodes: [
          {
            kind: 'boundary',
            id: 'container',
            at: { x: 0, y: 0 },
            size: { width: 200, height: 200 },
            policy: { mode: 'strict', overflow: 'clip', snap: { grid: 10 } },
            children: [
              {
                kind: 'shape',
                id: 'snap-node',
                at: { x: 23, y: 37 }, // Should snap to 20, 40
                size: { width: 30, height: 30 },
                shape: 'rect'
              }
            ]
          }
        ]
      };

      const result = enforceBoundaries(scene);
      const processedNode = result.scene.nodes[0].children[0];
      
      // Check if the node was snapped (stored in _absRect)
      expect(processedNode._absRect.x).toBe(20);
      expect(processedNode._absRect.y).toBe(40);
    });

    test('loose mode generates warnings instead of errors', () => {
      const scene = {
        id: 'loose-test',
        canvas: { width: 400, height: 300 },
        nodes: [
          {
            kind: 'boundary',
            id: 'container',
            at: { x: 50, y: 50 },
            size: { width: 100, height: 100 },
            policy: { mode: 'loose', overflow: 'clip', tolerance: 0 },
            children: [
              {
                kind: 'shape',
                id: 'overflow-node',
                at: { x: 80, y: 80 }, // This will overflow
                size: { width: 50, height: 50 },
                shape: 'rect'
              }
            ]
          }
        ]
      };

      const result = enforceBoundaries(scene);
      
      expect(result.diagnostics).toHaveLength(1);
      expect(result.diagnostics[0].severity).toBe('warning');
      expect(result.summary.warnings).toBe(1);
      expect(result.summary.errors).toBe(0);
    });
  });

  describe('Visual Containment', () => {
    test('generates clipPath for boundaries with strict policy', () => {
      const boundary = {
        kind: 'boundary',
        id: 'test-boundary',
        at: { x: 10, y: 20 },
        size: { width: 100, height: 80 },
        policy: { mode: 'strict', overflow: 'clip' }
      };

      const clipPath = generateClipPath(boundary);
      
      expect(clipPath.id).toBe('clip-test-boundary');
      expect(clipPath.rect).toEqual({ x: 10, y: 20, w: 100, h: 80 });
      expect(clipPath.type).toBe('clip');
    });

    test('generates mask for boundaries with mask overflow', () => {
      const boundary = {
        kind: 'boundary',
        id: 'mask-boundary',
        at: { x: 0, y: 0 },
        size: { width: 200, height: 150 },
        policy: { mode: 'strict', overflow: 'mask' }
      };

      const clipPath = generateClipPath(boundary);
      
      expect(clipPath.type).toBe('mask');
    });

    test('needsContainment identifies boundaries requiring containment', () => {
      const strictBoundary = {
        kind: 'boundary',
        id: 'strict',
        policy: { mode: 'strict', overflow: 'clip' }
      };

      const looseBoundary = {
        kind: 'boundary',
        id: 'loose',
        policy: { mode: 'loose', overflow: 'clip' }
      };

      const noPolicyBoundary = {
        kind: 'boundary',
        id: 'default'
      };

      expect(needsContainment(strictBoundary)).toBe(true);
      expect(needsContainment(looseBoundary)).toBe(false);
      expect(needsContainment(noPolicyBoundary)).toBe(true); // Uses default strict policy
    });
  });

  describe('Diagnostic System', () => {
    test('generates comprehensive diagnostic report', () => {
      const scene = {
        id: 'diagnostic-test',
        canvas: { width: 300, height: 200 },
        nodes: [
          {
            kind: 'boundary',
            id: 'container',
            at: { x: 50, y: 50 },
            size: { width: 100, height: 100 },
            policy: { mode: 'strict', overflow: 'clip' },
            children: [
              {
                kind: 'shape',
                id: 'good-node',
                at: { x: 10, y: 10 },
                size: { width: 30, height: 30 },
                shape: 'rect'
              },
              {
                kind: 'shape',
                id: 'bad-node',
                at: { x: 80, y: 80 },
                size: { width: 40, height: 40 },
                shape: 'rect'
              }
            ]
          }
        ]
      };

      const report = generateDiagnosticReport(scene);
      
      expect(report.sceneId).toBe('diagnostic-test');
      expect(report.summary.totalNodes).toBe(3);
      expect(report.summary.boundariesProcessed).toBe(1);
      expect(report.summary.errors).toBe(1);
      expect(report.diagnostics).toHaveLength(1);
      expect(report.suggestions).toHaveLength(1);
      expect(report.suggestions[0].type).toBe('MOVE_NODE');
      expect(report.suggestions[0].confidence).toBe('high');
    });

    test('generates auto-fix suggestions for boundary violations', () => {
      const enforcementResult = {
        scene: {},
        diagnostics: [
          {
            code: 'OUT_OF_BOUNDS',
            nodeId: 'test-node',
            boundaryId: 'test-boundary',
            severity: 'error',
            message: 'Node escapes boundary',
            suggestedFix: { at: { x: 10, y: 20 } }
          }
        ],
        summary: { errors: 1, warnings: 0 }
      };

      const suggestions = generateAutoFixSuggestions(enforcementResult);
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].type).toBe('MOVE_NODE');
      expect(suggestions[0].nodeId).toBe('test-node');
      expect(suggestions[0].changes.at).toEqual({ x: 10, y: 20 });
      expect(suggestions[0].confidence).toBe('high');
    });
  });

  describe('Integration Tests', () => {
    test('complete workflow: enforcement -> containment -> diagnostics', () => {
      const scene = {
        id: 'integration-test',
        canvas: { width: 500, height: 400 },
        nodes: [
          {
            kind: 'boundary',
            id: 'main-container',
            at: { x: 100, y: 100 },
            size: { width: 200, height: 150 },
            policy: { mode: 'strict', overflow: 'clip', tolerance: 2, snap: { grid: 5 } },
            children: [
              {
                kind: 'shape',
                id: 'contained-node',
                at: { x: 23, y: 37 }, // Will be snapped to 25, 40
                size: { width: 50, height: 40 },
                shape: 'roundedRect'
              },
              {
                kind: 'text',
                id: 'overflow-text',
                at: { x: 180, y: 130 }, // Will overflow
                text: 'Overflow text'
              }
            ]
          }
        ]
      };

      // Step 1: Enforcement
      const enforcementResult = enforceBoundaries(scene);
      expect(enforcementResult.diagnostics).toHaveLength(1);
      expect(enforcementResult.diagnostics[0].code).toBe('OUT_OF_BOUNDS');

      // Step 2: Containment requirements
      const containmentContext = collectContainmentRequirements(enforcementResult.scene);
      expect(containmentContext.clipPaths).toHaveLength(1);
      expect(containmentContext.clipPaths[0].id).toBe('clip-main-container');

      // Step 3: Diagnostics
      const report = generateDiagnosticReport(scene);
      expect(report.summary.errors).toBe(1);
      expect(report.suggestions).toHaveLength(1);
      expect(report.suggestions[0].type).toBe('MOVE_NODE');
    });
  });
});

describe('Default Boundary Policy', () => {
  test('has expected default values', () => {
    expect(DEFAULT_BOUNDARY_POLICY.mode).toBe('strict');
    expect(DEFAULT_BOUNDARY_POLICY.overflow).toBe('clip');
    expect(DEFAULT_BOUNDARY_POLICY.snap.grid).toBe(2);
    expect(DEFAULT_BOUNDARY_POLICY.tolerance).toBe(1);
  });
});
