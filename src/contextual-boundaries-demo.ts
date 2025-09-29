// contextual-boundaries-demo.ts
import * as fs from 'fs';
import { renderScene } from './render-svg';
import type { Scene } from './scene';

// Load the demo scene
const sceneData = fs.readFileSync('samples/slide-01-contextual-boundaries.json', 'utf8');
const scene: Scene = JSON.parse(sceneData);

// Generate SVG
const svg = renderScene(scene);

// Save to file
fs.writeFileSync('samples/slide-01-contextual-boundaries.svg', svg);

console.log('✅ Generated contextual boundaries demo SVG: samples/slide-01-contextual-boundaries.svg');
console.log('📊 Scene contains:');
console.log(`   - ${scene.nodes.length} nodes (including ${scene.nodes.filter(n => n.kind === 'boundary').length} boundaries)`);
console.log(`   - ${scene.ports?.length ?? 0} ports`);
console.log(`   - ${scene.connectors?.length ?? 0} connectors`);
console.log(`   - ${scene.flows?.length ?? 0} flows`);
