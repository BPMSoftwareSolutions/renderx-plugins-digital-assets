const { 
  makeElementDisappear, 
  makeElementAppear, 
  stopElementAnimation, 
  startElementAnimation 
} = require('./dist/svg-animation-utilities');
const fs = require('fs');

console.log('🎬 SVG Animation Utilities Demo');
console.log('===============================\n');

// Test 1: Simple SVG - Element Disappear
console.log('1️⃣ Testing makeElementDisappear on simple SVG...');
const simpleSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect id="test-rect" x="50" y="50" width="100" height="50" fill="blue"/>
  <circle id="test-circle" cx="250" cy="75" r="30" fill="red"/>
</svg>`;

const disappearResult = makeElementDisappear(
  simpleSvg, 
  { type: 'id', value: 'test-rect' }, 
  { type: 'time', value: 2 }
);

fs.writeFileSync('test-results/simple-disappear.svg', disappearResult);
console.log('✅ Result saved to test-results/simple-disappear.svg');
console.log('   - Blue rectangle will disappear at 2s\n');

// Test 2: Simple SVG - Element Appear
console.log('2️⃣ Testing makeElementAppear on simple SVG...');
const appearResult = makeElementAppear(
  simpleSvg, 
  { type: 'id', value: 'test-circle' }, 
  { type: 'time', value: 1 }
);

fs.writeFileSync('test-results/simple-appear.svg', appearResult);
console.log('✅ Result saved to test-results/simple-appear.svg');
console.log('   - Red circle will appear at 1s\n');

// Test 3: Scene 1 SVG - Bus Disappear
console.log('3️⃣ Testing makeElementDisappear on Scene 1 SVG...');
const scene1Svg = fs.readFileSync('samples/graph-scene-1-rx-node-73eke9.svg', 'utf-8');

const scene1DisappearResult = makeElementDisappear(
  scene1Svg, 
  { type: 'id', value: 'school-bus' }, 
  { type: 'time', value: 6 }
);

fs.writeFileSync('test-results/scene1-bus-disappear.svg', scene1DisappearResult);
console.log('✅ Result saved to test-results/scene1-bus-disappear.svg');
console.log('   - School bus will disappear at 6s (after leaving depot)\n');

// Test 4: Scene 2 SVG - Traffic Light Coordination
console.log('4️⃣ Testing traffic light coordination on Scene 2 SVG...');
const scene2Svg = fs.readFileSync('samples/graph-scene-2-rx-node-s1wplc.svg', 'utf-8');

// Stop bus when traffic light is red
let scene2Result = stopElementAnimation(
  scene2Svg, 
  { type: 'id', value: 'school-bus' }, 
  { type: 'time', value: 4 }
);

// Start bus when traffic light turns green
scene2Result = startElementAnimation(
  scene2Result, 
  { type: 'id', value: 'school-bus' }, 
  { type: 'time', value: 8 }
);

fs.writeFileSync('test-results/scene2-traffic-coordination.svg', scene2Result);
console.log('✅ Result saved to test-results/scene2-traffic-coordination.svg');
console.log('   - Bus stops at 4s (red light)');
console.log('   - Bus starts at 8s (green light)\n');

// Test 5: Combined Scenario - Full Bus Coordination
console.log('5️⃣ Testing combined bus coordination scenario...');
let combinedResult = scene2Svg;

// Stop at red light
combinedResult = stopElementAnimation(
  combinedResult, 
  { type: 'id', value: 'school-bus' }, 
  { type: 'time', value: 4 }
);

// Resume at green light
combinedResult = startElementAnimation(
  combinedResult, 
  { type: 'id', value: 'school-bus' }, 
  { type: 'time', value: 8 }
);

// Disappear after scene ends
combinedResult = makeElementDisappear(
  combinedResult, 
  { type: 'id', value: 'school-bus' }, 
  { type: 'time', value: 12, duration: 0.5 }
);

fs.writeFileSync('test-results/combined-bus-coordination.svg', combinedResult);
console.log('✅ Result saved to test-results/combined-bus-coordination.svg');
console.log('   - Bus stops at 4s (red light)');
console.log('   - Bus resumes at 8s (green light)');
console.log('   - Bus disappears at 12s (scene end)\n');

console.log('🎊 Demo complete! Check the test-results/ directory for all generated SVG files.');
console.log('💡 Open any SVG file in a browser to see the animations in action.');
