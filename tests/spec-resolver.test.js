const path = require('path');
const fs = require('fs');
const { deepMergeElementFromSpec, normalizeElement } = require('../scripts/lib/spec-resolver');
const { buildUseTags } = require('../scripts/lib/injector');

describe('Spec Resolver', () => {
  const ASSETS_ROOT = path.join(__dirname, '../assets/plugin-architecture');
  const SPEC_ROOT = path.join(ASSETS_ROOT, 'specs');

  test('merges spec sub_elements and preserves inline overrides', () => {
    const element = {
      id: 'plugin-manifest',
      svg: 'slide-01-manifest/plugin-manifest.svg',
      spec: 'specs/slide-01-manifest/plugin-manifest.json',
      sub_elements: [
        // Inline override for compose on generated-stamp
        { id: 'generated-stamp', svg: 'slide-01-manifest/plugin-manifest/generated-stamp.svg', compose: { x: 5, y: 7 } }
      ]
    };

    const merged = deepMergeElementFromSpec(element, { assetsRoot: ASSETS_ROOT, specRoot: SPEC_ROOT });

    // Must include all items from spec
    const ids = new Set(merged.sub_elements.map(s => s.id));
    ['document-card','json-braces','key-value-rows','generated-stamp','tabs'].forEach(id => expect(ids.has(id)).toBe(true));

    // Inline override should take precedence for x/y (transform from spec may still be present)
    const gen = merged.sub_elements.find(s => s.id === 'generated-stamp');
    expect(gen.compose.x).toBe(5);
    expect(gen.compose.y).toBe(7);
  });

  test('normalizeElement produces valid <use> tags with hrefs for all expected sub-elements', () => {
    const slideSpec = JSON.parse(fs.readFileSync(path.join(ASSETS_ROOT, 'plugin-integration-slides.json'), 'utf8'));
    const slide01 = slideSpec.slides.find(s => s.id === 'slide-01-manifest');
    const original = slide01.elements.find(e => e.id === 'plugin-manifest');

    // Build uses from resolved model (via external spec)
    const merged = deepMergeElementFromSpec({ id: original.id, svg: original.svg, spec: 'specs/slide-01-manifest/plugin-manifest.json' }, { assetsRoot: ASSETS_ROOT, specRoot: SPEC_ROOT });
    const norm = normalizeElement(merged);
    const resolvedUses = buildUseTags(norm.sub_elements);

    const lines = resolvedUses.trim().split('\n');
    expect(lines).toHaveLength(5);
    const required = [
      'plugin-manifest/document-card.svg#document-card',
      'plugin-manifest/json-braces.svg#json-braces',
      'plugin-manifest/key-value-rows.svg#key-value-rows',
      'plugin-manifest/generated-stamp.svg#generated-stamp',
      'plugin-manifest/tabs.svg#tabs'
    ];
    required.forEach(ref => expect(resolvedUses).toContain(ref));
    // Each line should have either x/y or a transform attribute
    lines.forEach(l => expect(/\s(x=\"|-?\d|)\s*|transform=\"/.test(l) || /transform=\"/.test(l)).toBeTruthy());
  });
});

