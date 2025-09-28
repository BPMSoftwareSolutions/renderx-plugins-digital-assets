const fs = require('fs');
const path = require('path');

/**
 * Validates that all sub-element SVGs referenced in plugin-integration-slides.json
 * exist on disk and contain valid <svg> roots.
 */
describe('Plugin Architecture - Sub-element SVGs', () => {
  let slides;

  beforeAll(() => {
    const configPath = path.join(__dirname, '../assets/plugin-architecture/plugin-integration-slides.json');
    const raw = fs.readFileSync(configPath, 'utf8');
    const json = JSON.parse(raw);
    slides = json.slides;
  });

  test('slide-01-manifest sub-element SVGs exist and are valid', () => {
    const slide = slides.find(s => s.id === 'slide-01-manifest');
    expect(slide).toBeTruthy();
    expect(Array.isArray(slide.elements)).toBe(true);

    const elementsWithSubs = slide.elements.filter(el => Array.isArray(el.sub_elements));
    expect(elementsWithSubs.length).toBeGreaterThan(0);

    elementsWithSubs.forEach(el => {
      el.sub_elements.forEach(sub => {
        const svgRel = sub.svg; // e.g., "slide-01-manifest/plugin-package/package-box.svg"
        const svgAbs = path.join(__dirname, '../assets/plugin-architecture', svgRel);

        // Existence
        const exists = fs.existsSync(svgAbs);
        expect(exists).toBe(true);

        // Basic SVG root validation
        const content = fs.readFileSync(svgAbs, 'utf8');
        expect(content).toMatch(/<svg[\s\S]*?>[\s\S]*<\/svg>/i);
      });
    });
  });
});

