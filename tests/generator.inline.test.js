const { generateForElementInline } = require('../scripts/lib/injector');

function parentSvg() {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">\n</svg>';
}

const loader = (map) => (svgPath) => {
  if (!(svgPath in map)) throw new Error('Missing mock for ' + svgPath);
  return map[svgPath];
};

describe('Inline composition mode', () => {
  test('inlines sub-element anchor content and wraps with transform + data-sub-id', () => {
    const subs = [
      { id: 'a', svg: 'slide-01-manifest/x/a.svg', compose: { x: 10, y: 20 } },
      { id: 'b', svg: 'slide-01-manifest/x/b.svg', compose: { transform: 'translate(5,6) scale(2)' } },
    ];

    const map = {
      'slide-01-manifest/x/a.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g id="a"><rect x="1" y="2" width="3" height="4"/></g></svg>',
      'slide-01-manifest/x/b.svg': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g id="b"><circle cx="3" cy="3" r="2"/></g></svg>',
    };

    const out = generateForElementInline(parentSvg(), { sub_elements: subs }, { loadSvg: loader(map) });

    expect(out).toContain('<g id="sub-elements">');
    expect(out).not.toContain('<use');

    // Wrapper groups with transforms and data-sub-id markers
    expect(out).toContain('<g data-sub-id="a"');
    expect(out).toContain('transform="translate(10,20)"');
    expect(out).toContain('<rect x="1" y="2" width="3" height="4"/>');

    expect(out).toContain('<g data-sub-id="b"');
    expect(out).toContain('transform="translate(5,6) scale(2)"');
    expect(out).toContain('<circle cx="3" cy="3" r="2"/>');
  });
});

