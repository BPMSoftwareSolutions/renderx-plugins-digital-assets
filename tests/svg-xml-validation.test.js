const fs = require('fs');
const path = require('path');

// Recursively collect all .svg files under a directory (excluding node_modules)
function collectSvgFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSvgFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.svg')) {
      files.push(full);
    }
  }
  return files;
}

describe('SVG XML Well-formedness - Entity Escaping', () => {
  const root = path.join(__dirname, '..');
  const svgFiles = collectSvgFiles(path.join(root, 'assets'));

  test('should find SVG files to validate', () => {
    expect(svgFiles.length).toBeGreaterThan(0);
  });

  test('all SVG files must not contain unescaped ampersands', () => {
    // Matches any '&' that is NOT starting a known valid entity (amp, lt, gt, apos, quot, or numeric)
    const badAmpRegex = /&(?!amp;|lt;|gt;|apos;|quot;|#[0-9]+;|#x[0-9A-Fa-f]+;)/;

    const offenders = [];

    svgFiles.forEach((file) => {
      const content = fs.readFileSync(file, 'utf8');
      if (badAmpRegex.test(content)) {
        offenders.push(file);
      }
    });

    // Intentionally expect no offenders; current repo should fail if any SVG has raw '&'
    expect({ offendersCount: offenders.length, offenders }).toEqual({ offendersCount: 0, offenders: [] });
  });
});

