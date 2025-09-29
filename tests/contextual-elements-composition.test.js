const fs = require('fs');
const path = require('path');

describe('Contextual Element SVGs - Composition from sub-elements', () => {
  const base = path.join(__dirname, '../assets/plugin-architecture/slide-01-manifest');

  const expectations = {
    'plugin-package.svg': [
      'plugin-package/package-box.svg#package-box',
      'plugin-package/shadow.svg#shadow',
      'plugin-package/label.svg#label',
      'plugin-package/glyphs.svg#glyphs',
      'plugin-package/npm-badge.svg#npm-badge',
    ],
    'plugin-manifest.svg': [
      'plugin-manifest/document-card.svg#document-card',
      'plugin-manifest/json-braces.svg#json-braces',
      'plugin-manifest/key-value-rows.svg#key-value-rows',
      'plugin-manifest/generated-stamp.svg#generated-stamp',
      'plugin-manifest/tabs.svg#tabs',
    ],
    'handlers-export.svg': [
      'handlers-export/ports.svg#ports',
      'handlers-export/connectors.svg#connectors',
      'handlers-export/gradient.svg#gradient',
      'handlers-export/circuit-traces.svg#circuit-traces',
    ],
    'host-sdk.svg': [
      'host-sdk/console.svg#console',
      'host-sdk/rails.svg#rails',
      'host-sdk/ports.svg#ports',
      'host-sdk/modules.svg#modules',
    ],
  };

  Object.entries(expectations).forEach(([file, refs]) => {
    test(`${file} should reference its sub-elements via <use xlink:href> or inline <g data-sub-id>`, () => {
      const full = path.join(base, file);
      const content = fs.readFileSync(full, 'utf8');
      refs.forEach(ref => {
        const id = ref.split('#')[1];
        const ok = content.includes(`xlink:href="${ref}"`) || content.includes(`data-sub-id="${id}"`);
        expect(ok).toBe(true);
      });
    });
  });
});

