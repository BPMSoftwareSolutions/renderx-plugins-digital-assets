const fs = require('fs');
const path = require('path');

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('Slide-driven composition validation', () => {
  const slidesJsonPath = path.join(__dirname, '../assets/plugin-architecture/plugin-integration-slides.json');
  const slides = JSON.parse(fs.readFileSync(slidesJsonPath, 'utf8'));

  const slide = slides.slides.find(s => s.id === 'slide-01-manifest');
  if (!slide) throw new Error('slide-01-manifest not found in plugin-integration-slides.json');

  const targetElements = new Set(['plugin-package', 'plugin-manifest', 'handlers-export', 'host-sdk']);

  slide.elements
    .filter(el => targetElements.has(el.id))
    .forEach(el => {
      test(`${el.id} integrated SVG should include sub-elements at specified coordinates`, () => {
        const integratedSvgPath = path.join(__dirname, '../assets/plugin-architecture', el.svg);
        const content = fs.readFileSync(integratedSvgPath, 'utf8');

        el.sub_elements.forEach(sub => {
          expect(sub.compose).toBeDefined();
          expect(typeof sub.compose.x).toBe('number');
          expect(typeof sub.compose.y).toBe('number');

          const expectedHref = `${sub.svg.replace('slide-01-manifest/', '')}#${sub.id}`;
          const pattern1 = new RegExp(`<use[\\s\\S]*?xlink:href=\"${escapeRegExp(expectedHref)}\"[\\s\\S]*?x=\"${sub.compose.x}\"[\\s\\S]*?y=\"${sub.compose.y}\"[\\s\\S]*?>`);
          const pattern2 = new RegExp(`<use[\\s\\S]*?xlink:href=\"${escapeRegExp(expectedHref)}\"[\\s\\S]*?y=\"${sub.compose.y}\"[\\s\\S]*?x=\"${sub.compose.x}\"[\\s\\S]*?>`);
          const pattern3 = new RegExp(`<use[\\s\\S]*?x=\"${sub.compose.x}\"[\\s\\S]*?y=\"${sub.compose.y}\"[\\s\\S]*?xlink:href=\"${escapeRegExp(expectedHref)}\"[\\s\\S]*?>`);
          const pattern4 = new RegExp(`<use[\\s\\S]*?y=\"${sub.compose.y}\"[\\s\\S]*?x=\"${sub.compose.x}\"[\\s\\S]*?xlink:href=\"${escapeRegExp(expectedHref)}\"[\\s\\S]*?>`);
          expect(pattern1.test(content) || pattern2.test(content) || pattern3.test(content) || pattern4.test(content)).toBe(true);
        });
      });
    });
});

