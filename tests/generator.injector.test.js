const fs = require('fs');
const path = require('path');
const { generateForElement, buildUseTags } = require('../scripts/lib/injector');

describe('Generator Injector (Mode A)', () => {
  const jsonPath = path.join(__dirname, '../assets/plugin-architecture/plugin-integration-slides.json');
  let spec;
  beforeAll(() => {
    spec = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  });

  test('buildUseTags generates expected hrefs for plugin-manifest sub-elements', () => {
    const slide = spec.slides.find(s => s.id === 'slide-01-manifest');
    const el = slide.elements.find(e => e.id === 'plugin-manifest');
    const uses = buildUseTags(el.sub_elements);
    expect(uses).toMatch(/xlink:href="plugin-manifest\/document-card.svg#document-card"/);
    expect(uses).toMatch(/xlink:href="plugin-manifest\/json-braces.svg#json-braces"/);
    expect(uses).toMatch(/xlink:href="plugin-manifest\/key-value-rows.svg#key-value-rows"/);
    expect(uses).toMatch(/xlink:href="plugin-manifest\/generated-stamp.svg#generated-stamp"/);
    expect(uses).toMatch(/xlink:href="plugin-manifest\/tabs.svg#tabs"/);
  });

  test('generateForElement injects <g id="sub-elements"> and namespaces; idempotent', () => {
    const slide = spec.slides.find(s => s.id === 'slide-01-manifest');
    const el = slide.elements.find(e => e.id === 'plugin-manifest');

    const parent = '<svg width="420" height="140"><title>Plugin Manifest</title>\n<!-- decorations here --></svg>';
    const out1 = generateForElement(parent, el);

    // Namespaces ensured on root
    expect(out1).toMatch(/<svg[^>]*xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    expect(out1).toMatch(/xmlns:xlink="http:\/\/www.w3.org\/1999\/xlink"/);

    // Group and some expected uses
    expect(out1).toMatch(/<g id="sub-elements">[\s\S]*?<\/g>/);
    expect(out1).toMatch(/xlink:href="plugin-manifest\/document-card.svg#document-card"/);

    // Idempotent
    const out2 = generateForElement(out1, el);
    expect(out2).toBe(out1);
  });
});

