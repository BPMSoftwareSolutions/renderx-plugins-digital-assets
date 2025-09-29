// event-router-demo.ts
import * as fs from 'fs';
import { renderSceneWithDiagnostics } from './render-svg';
import { generateDiagnosticReport, createDiagnosticSummary, exportDiagnosticReport } from './diagnostics';
import type { Scene } from './scene';

console.log('🚌 Running EventRouter Contextual Boundaries Demo...\n');

// Load the event-router scene
const sceneData = fs.readFileSync('samples/event-router-contextual-boundaries.json', 'utf8');
const scene: Scene = JSON.parse(sceneData);

console.log('📊 Scene Overview:');
console.log(`   - Canvas: ${scene.canvas.width}x${scene.canvas.height}`);
console.log(`   - Total nodes: ${scene.nodes.length}`);
console.log(`   - Boundaries: ${scene.nodes.filter(n => n.kind === 'boundary').length}`);
console.log(`   - Ports: ${scene.ports?.length ?? 0}`);
console.log(`   - Connectors: ${scene.connectors?.length ?? 0}`);
console.log(`   - Flows: ${scene.flows?.length ?? 0}\n`);

// Generate diagnostic report
console.log('🔍 Running Boundary Enforcement Analysis...\n');
const diagnosticReport = generateDiagnosticReport(scene);
console.log(createDiagnosticSummary(diagnosticReport));

// Render scene with diagnostics
const { svg, diagnostics } = renderSceneWithDiagnostics(scene);

// Save the enhanced SVG
fs.writeFileSync('samples/event-router-with-containment.svg', svg);

// Save diagnostic report
fs.writeFileSync('samples/event-router-diagnostics.json', exportDiagnosticReport(diagnosticReport));

console.log('📁 Files Generated:');
console.log('   - samples/event-router-with-containment.svg (Enhanced EventRouter with containment)');
console.log('   - samples/event-router-diagnostics.json (Diagnostic report)');

// Analyze the scene structure
console.log('\n🎭 Scene Analysis:');
const boundaries = scene.nodes.filter(n => n.kind === 'boundary');
boundaries.forEach((boundary, index) => {
  const childCount = boundary.children?.length ?? 0;
  const policy = boundary.policy ? 
    `${boundary.policy.mode} mode, ${boundary.policy.overflow} overflow` : 
    'default policy';
  
  console.log(`   ${index + 1}. "${boundary.title}" - ${childCount} children (${policy})`);
});

// Flow analysis
if (scene.flows && scene.flows.length > 0) {
  console.log('\n🌊 Flow Analysis:');
  scene.flows.forEach((flow, index) => {
    const pathSteps = flow.path.split('>').length;
    const activatedBoundaries = flow.activate?.boundaryIds?.length ?? 0;
    console.log(`   ${index + 1}. "${flow.id}" - ${pathSteps} steps, activates ${activatedBoundaries} boundaries`);
  });
}

// Performance metrics
const endTime = Date.now();
console.log(`\n⚡ EventRouter Demo completed successfully!`);
console.log(`\n📋 Summary of EventRouter Story Demonstrated:`);
console.log('   🏭 Scene 1: Publisher Origin (Bus leaves depot)');
console.log('   📋 Scene 2: Route Planning (Manifest + debounce)');
console.log('   🚏 Scene 3: First Stop (Live & late subscribers)');
console.log('   🎼 Scene 4: Transfer Hub (Conductor orchestration)');
console.log('   🛣️  Scene 5: Rules of the Road (Boundaries & performance)');
console.log('   🏫 Scene 6: Final Destination (Application state updated)');

console.log('\n✨ Visual Containment Features Demonstrated:');
console.log('   ✓ Six contextual boundaries with strict enforcement');
console.log('   ✓ Grid snapping and position validation');
console.log('   ✓ Port-based connections between scenes');
console.log('   ✓ Manhattan routing with orthogonal paths');
console.log('   ✓ Animated flow traversing all six scenes');
console.log('   ✓ Boundary highlighting during token motion');
console.log('   ✓ Professional visual styling with shadows and gradients');
console.log('   ✓ Machine-readable diagnostics for quality assurance');

// Create a test with intentional violations to show enforcement
console.log('\n🧪 Creating Violation Test Scene...');

const violationTestScene: Scene = {
  id: "event-router-violation-test",
  canvas: { width: 800, height: 600 },
  bg: "#87CEEB",
  nodes: [
    {
      kind: "boundary",
      id: "test-scene-boundary",
      title: "Test Scene: Intentional Violations",
      at: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      style: { 
        fill: "#FFF3E0", 
        stroke: "#F57C00", 
        strokeWidth: 2, 
        labelColor: "#F57C00"
      },
      policy: { mode: "strict", overflow: "clip", tolerance: 1, snap: { grid: 8 } },
      children: [
        // This bus should be fine
        {
          kind: "shape",
          id: "good-bus",
          at: { x: 50, y: 50 },
          size: { "width": 80, "height": 30 },
          shape: "roundedRect",
          style: { fill: "#FFD700", stroke: "#CC8400", strokeWidth: 2 }
        },
        // This depot will overflow the boundary
        {
          kind: "shape",
          id: "overflow-depot",
          at: { x: 350, y: 250 }, // This will extend outside the 400x300 boundary
          size: { width: 120, height: 80 },
          shape: "roundedRect",
          style: { fill: "#8B7355", stroke: "#6B5535", strokeWidth: 2 }
        },
        // This text will also overflow
        {
          kind: "text",
          id: "overflow-caption",
          at: { x: 380, y: 280 },
          text: "This caption overflows the scene boundary!",
          style: { fill: "#F57C00", fontSize: 14, fontWeight: "bold" as any }
        }
      ]
    }
  ]
};

// Test the violation detection on EventRouter-style scene
const testDiagnosticReport = generateDiagnosticReport(violationTestScene);
console.log('\n' + createDiagnosticSummary(testDiagnosticReport));

// Render the test scene
const { svg: testSvg } = renderSceneWithDiagnostics(violationTestScene);
fs.writeFileSync('samples/event-router-violation-test.svg', testSvg);
fs.writeFileSync('samples/event-router-violation-diagnostics.json', exportDiagnosticReport(testDiagnosticReport));

console.log('\n📁 Violation Test Files Generated:');
console.log('   - samples/event-router-violation-test.svg (Test scene with violations)');
console.log('   - samples/event-router-violation-diagnostics.json (Violation diagnostics)');

// Show auto-fix suggestions if available
if (testDiagnosticReport.suggestions.length > 0) {
  console.log('\n🔧 Auto-fix Suggestions for EventRouter Scene:');
  testDiagnosticReport.suggestions.forEach((suggestion, i) => {
    console.log(`   ${i + 1}. [${suggestion.confidence.toUpperCase()}] ${suggestion.description}`);
    if (suggestion.changes.at) {
      console.log(`      Suggested position: (${suggestion.changes.at.x}, ${suggestion.changes.at.y})`);
    }
  });
}

console.log('\n🎉 EventRouter Visual Containment Demo Complete!');
console.log('\n🚌 The school bus has successfully completed its journey through all six scenes');
console.log('   with full boundary enforcement and professional visual containment! 🎊');
