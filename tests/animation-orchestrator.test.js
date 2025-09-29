const fs = require('fs');
const path = require('path');

const { applySceneAnimationFromConfig, loadAnimationConfig } = require('../dist/animation-orchestrator');

const SAMPLES_DIR = path.join(__dirname, '..', 'samples');
const DATA_DIR = path.join(__dirname, '..', 'data');

function readSampleSvg(name) {
  return fs.readFileSync(path.join(SAMPLES_DIR, name), 'utf-8');
}

function loadConfig() {
  const json = fs.readFileSync(path.join(DATA_DIR, 'scene-animation-config.json'), 'utf-8');
  return JSON.parse(json);
}

describe('Animation Orchestrator (data-driven)', () => {
  test('Scene 1: fades entire bus and stops wheel spin at 6s per config', () => {
    const cfg = loadConfig();
    const svg = readSampleSvg('graph-scene-1-rx-node-73eke9.svg');
    const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const inner = innerMatch ? innerMatch[1] : svg;

    const out = applySceneAnimationFromConfig(inner, 1, cfg);

    // Entire bus group is faded out at 6s
    expect(out).toMatch(/<g[^>]*id="school-bus"[^>]*>[^<]*<animate[^>]*attributeName="opacity"[^>]*begin="6s"[^>]*fill="freeze"/);

    // Movement and wheel spins stop at 6s
    const numEnds = (out.match(/<animateTransform[^>]*end="6s"/g) || []).length;
    expect(numEnds).toBeGreaterThanOrEqual(2); // translate + at least one wheel; rear should be fixed by utility
  });

  test('Scene 2: movement keyTimes normalized and bus appears at startDelay', () => {
    const cfg = loadConfig();
    const svg = readSampleSvg('graph-scene-2-rx-node-s1wplc.svg');
    const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const inner = innerMatch ? innerMatch[1] : svg;

    const out = applySceneAnimationFromConfig(inner, 2, cfg);

    // Bus translate has keyTimes and dur=12s, repeatCount=indefinite (allowing for formatting differences)
    expect(out).toMatch(/<animateTransform[^>]*type="translate"[^>]*keyTimes="[^"]*0;\s*0\.25[^"]*0\.667[^"]*1"[^>]*dur="12s"[^>]*repeatCount="indefinite"/);

    // Initially hidden and appear at startDelay=6s
    expect(out).toMatch(/<g[^>]*id="school-bus"[^>]*opacity="0"/);
    expect(out).toMatch(/<g[^>]*id="school-bus"[\s\S]*?<animate[^>]*attributeName="opacity"[^>]*from="0"[^>]*to="1"[^>]*begin="6s"/);

    // Disappear at exitTime=16s
    expect(out).toMatch(/<g[^>]*id="school-bus"[\s\S]*?<animate[^>]*attributeName="opacity"[^>]*begin="16s"/);
  });

  test('Scenes 3-5: buses initially hidden and appear at scene startDelay', () => {
    const cfg = loadConfig();
    const scenes = [3,4,5];
    const files = {
      3: 'graph-scene-3-rx-node-scene3.svg',
      4: 'graph-scene-4-rx-node-scene4.svg',
      5: 'graph-scene-5-rx-node-scene5.svg'
    };
    const delays = { 3: 16, 4: 28, 5: 42 };

    scenes.forEach((sn) => {
      const svg = readSampleSvg(files[sn]);
      const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
      const inner = innerMatch ? innerMatch[1] : svg;
      const out = applySceneAnimationFromConfig(inner, sn, cfg);

      expect(out).toMatch(/<g[^>]*id="school-bus"[^>]*opacity="0"/);
      const delay = delays[sn];
      const re = new RegExp(`<g[^>]*id="school-bus"[\\s\\S]*?<animate[^>]*attributeName="opacity"[^>]*from="0"[^>]*to="1"[^>]*begin="${delay}s"`);
      expect(out).toMatch(re);
    });
  });
});

