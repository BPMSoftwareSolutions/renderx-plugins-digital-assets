/* JSON-driven SVG injector library (Mode A) */
const SLIDE_PREFIX_RE = /^slide-\d{2}-[^/]+\//;

function buildUseTags(subElements) {
  return subElements
    .filter(se => se && se.id && se.svg)
    .map(se => {
      const href = `${se.svg.replace(SLIDE_PREFIX_RE, '')}#${se.id}`;
      const x = se.compose && typeof se.compose.x === 'number' ? se.compose.x : 0;
      const y = se.compose && typeof se.compose.y === 'number' ? se.compose.y : 0;
      return `  <use x="${x}" y="${y}" xlink:href="${href}"/>`;
    })
    .join('\n');
}

function ensureNamespaces(svgContent) {
  // Ensure xmlns and xmlns:xlink on root <svg ...>
  return svgContent.replace(/<svg(\s[^>]*)?>/i, (m, attrs = '') => {
    const hasXmlns = /xmlns=/.test(m);
    const hasXlink = /xmlns:xlink=/.test(m);
    let updated = `<svg${attrs || ''}`;
    if (!hasXmlns) updated += ' xmlns="http://www.w3.org/2000/svg"';
    if (!hasXlink) updated += ' xmlns:xlink="http://www.w3.org/1999/xlink"';
    updated += '>';
    return updated;
  });
}

function injectGroup(svgContent, inner) {
  const groupStartRe = /<g\s+id=["']sub-elements["'][^>]*>/i;
  const groupFullRe = /<g\s+id=["']sub-elements["'][^>]*>[\s\S]*?<\/g>/i;

  if (groupFullRe.test(svgContent)) {
    return svgContent.replace(groupFullRe, `<g id="sub-elements">\n${inner}\n</g>`);
  }

  if (groupStartRe.test(svgContent)) {
    // Has start but no close (edge), normalize by closing
    return svgContent.replace(groupStartRe, `<g id=\"sub-elements\">\n${inner}\n</g>`);
  }

  // Insert before closing </svg>
  if (/<\/svg>/i.test(svgContent)) {
    return svgContent.replace(/<\/svg>/i, `<!-- Composed from sub-elements -->\n<g id=\"sub-elements\">\n${inner}\n</g>\n</svg>`);
  }

  // Fallback: append group
  return `${svgContent}\n<g id="sub-elements">\n${inner}\n</g>`;
}

function generateForElement(parentSvgContent, element /* from JSON */) {
  const uses = buildUseTags(element.sub_elements || []);
  let updated = ensureNamespaces(parentSvgContent);
  updated = injectGroup(updated, uses);
  return updated;
}

module.exports = {
  buildUseTags,
  ensureNamespaces,
  injectGroup,
  generateForElement,
};

