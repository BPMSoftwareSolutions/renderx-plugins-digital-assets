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

  test('Scene 2: stop at red 10s, start at green 14s, disappear at 16s', () => {
    const cfg = loadConfig();
    const svg = readSampleSvg('graph-scene-2-rx-node-s1wplc.svg');
    const innerMatch = svg.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    const inner = innerMatch ? innerMatch[1] : svg;

    const out = applySceneAnimationFromConfig(inner, 2, cfg);

    // Stop and start timings
    expect(out).toMatch(/<animateTransform[^>]*end="10s"/);
    expect(out).toMatch(/<animateTransform[^>]*begin="14s"/);

    // Disappear at exitTime
    expect(out).toMatch(/<g[^>]*id="school-bus"[^>]*>[^<]*<animate[^>]*attributeName="opacity"[^>]*begin="16s"/);
  });
});

