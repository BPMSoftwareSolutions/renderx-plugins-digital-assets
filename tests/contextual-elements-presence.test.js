const fs = require('fs');
const path = require('path');

describe('Contextual Element SVGs - Presence and Well-formedness', () => {
  const base = path.join(__dirname, '../assets/plugin-architecture/slide-01-manifest');
  const files = [
    'plugin-package.svg',
    'plugin-manifest.svg',
    'handlers-export.svg',
    'build-publish.svg',
    'host-sdk.svg',
  ];

  test('all integrated contextual SVGs should exist and have an <svg> root', () => {
    files.forEach(file => {
      const full = path.join(base, file);
      expect(fs.existsSync(full)).toBe(true);
      const content = fs.readFileSync(full, 'utf8');
      expect(content).toMatch(/<svg[\s\S]*?>[\s\S]*<\/svg>/i);
    });
  });
});

