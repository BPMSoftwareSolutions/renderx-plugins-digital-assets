/* JSON-driven SVG injector library (Mode A) */
const SLIDE_PREFIX_RE = /^slide-\d{2}-[^/]+\//;

function buildUseTags(subElements) {
  return subElements
    .filter(se => se && se.id && se.svg)
    .map(se => {
      const href = `${se.svg.replace(SLIDE_PREFIX_RE, '')}#${se.id}`;
      const c = se.compose || {};
      const hasTransformFields = typeof c.transform === 'string' || typeof c.s === 'number' || typeof c.sx === 'number' || typeof c.sy === 'number' || typeof c.r === 'number';
      if (typeof c.transform === 'string') {
        return `  <use transform="${c.transform}" xlink:href="${href}"/>`;
      }
      if (hasTransformFields) {
        const tx = typeof c.x === 'number' ? c.x : 0;
        const ty = typeof c.y === 'number' ? c.y : 0;
        const s = typeof c.s === 'number' ? c.s : null;
        const sx = typeof c.sx === 'number' ? c.sx : (s != null ? s : null);
        const sy = typeof c.sy === 'number' ? c.sy : (s != null ? s : null);
        const r = typeof c.r === 'number' ? c.r : null;
        const ox = typeof c.ox === 'number' ? c.ox : null;
        const oy = typeof c.oy === 'number' ? c.oy : null;
        const parts = [];
        parts.push(`translate(${tx},${ty})`);
        if (sx != null && sy != null) parts.push(`scale(${sx},${sy})`);
        else if (sx != null) parts.push(`scale(${sx})`);
        if (r != null) parts.push(ox != null && oy != null ? `rotate(${r},${ox},${oy})` : `rotate(${r})`);
        return `  <use transform="${parts.join(' ')}" xlink:href="${href}"/>`;
      }
      const x = typeof c.x === 'number' ? c.x : 0;
      const y = typeof c.y === 'number' ? c.y : 0;
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

function buildTransform(compose) {
  const c = compose || {};
  if (typeof c.transform === 'string') return c.transform;
  const tx = typeof c.x === 'number' ? c.x : 0;
  const ty = typeof c.y === 'number' ? c.y : 0;
  const s = typeof c.s === 'number' ? c.s : null;
  const sx = typeof c.sx === 'number' ? c.sx : (s != null ? s : null);
  const sy = typeof c.sy === 'number' ? c.sy : (s != null ? s : null);
  const r = typeof c.r === 'number' ? c.r : null;
  const ox = typeof c.ox === 'number' ? c.ox : null;
  const oy = typeof c.oy === 'number' ? c.oy : null;
  const parts = [];
  parts.push(`translate(${tx},${ty})`);
  if (sx != null && sy != null) parts.push(`scale(${sx},${sy})`);
  else if (sx != null) parts.push(`scale(${sx})`);
  if (r != null) parts.push(ox != null && oy != null ? `rotate(${r},${ox},${oy})` : `rotate(${r})`);
  return parts.join(' ');
}

function extractAnchor(svgContent, id) {
  // Find <g ... id="id" ...>inner</g>; return { attrs, inner }
  // Use a more robust approach that handles nested groups correctly
  const startRe = new RegExp(`<g\\s+([^>]*?)id=["']${id}["']([^>]*)>`, 'i');
  const startMatch = svgContent.match(startRe);
  if (!startMatch) return { attrs: '', inner: '' };

  const startIndex = startMatch.index + startMatch[0].length;
  let depth = 1;
  let endIndex = startIndex;

  // Find the matching closing </g> by counting nested groups
  while (depth > 0 && endIndex < svgContent.length) {
    const nextOpen = svgContent.indexOf('<g', endIndex);
    const nextClose = svgContent.indexOf('</g>', endIndex);

    if (nextClose === -1) break; // No more closing tags

    if (nextOpen !== -1 && nextOpen < nextClose) {
      // Found opening tag before closing tag
      depth++;
      endIndex = nextOpen + 2;
    } else {
      // Found closing tag
      depth--;
      if (depth === 0) {
        endIndex = nextClose;
        break;
      }
      endIndex = nextClose + 4;
    }
  }

  if (depth !== 0) {
    console.warn(`Warning: Unbalanced group tags for id="${id}"`);
    return { attrs: '', inner: '' };
  }

  let attrs = (startMatch[1] + ' ' + startMatch[2]).trim();
  // Remove any id attribute remnants just in case
  attrs = attrs.replace(/\s*id=["'][^"']+["']/ig, '').trim();
  const inner = svgContent.substring(startIndex, endIndex);
  return { attrs, inner };
}

function generateForElementInline(parentSvgContent, element, options = {}) {
  if (!options.loadSvg) throw new Error('generateForElementInline requires options.loadSvg');
  const parts = (element.sub_elements || []).filter(se => se && se.id && se.svg).map(se => {
    const svgStr = options.loadSvg(se.svg);
    const { attrs, inner } = extractAnchor(svgStr, se.id);
    const transform = buildTransform(se.compose || {});
    const dataSrc = se.svg.replace(SLIDE_PREFIX_RE, '');
    const innerWrapped = attrs ? `  <g ${attrs}>\n${inner}\n  </g>` : inner;
    return `  <g data-sub-id="${se.id}" data-src="${dataSrc}" transform="${transform}">\n${innerWrapped}\n  </g>`;
  }).join('\n');
  let updated = ensureNamespaces(parentSvgContent);
  updated = injectGroup(updated, parts);
  return updated;
}

function generateForElementTemplateExact(parentSvgContent, element, options = {}) {
  if (!options.loadSvg) throw new Error('generateForElementTemplateExact requires options.loadSvg');

  // Extract content from each sub-element and flatten into direct SVG children
  const parts = (element.sub_elements || []).filter(se => se && se.id && se.svg).map(se => {
    const svgStr = options.loadSvg(se.svg);

    // For template-exact mode, use extractAnchor to get both attributes and inner content
    // to preserve styling information from the group element
    const { attrs, inner } = extractAnchor(svgStr, se.id);
    if (inner.trim()) {
      let processedInner = inner;

      // If the group has attributes (like fill, stroke), we need to preserve them
      // by wrapping the inner content in a group with those attributes
      if (attrs.trim()) {
        processedInner = `<g ${attrs}>\n${processedInner}\n</g>`;
      }

      // Handle defs sections specially - they need unique IDs
      const idMatches = processedInner.match(/id=["']([^"']+)["']/g);
      if (idMatches) {
        idMatches.forEach(idMatch => {
          const idValue = idMatch.match(/id=["']([^"']+)["']/)[1];
          const uniqueId = `${se.id}-${idValue}`;
          // Update the ID definition
          processedInner = processedInner.replace(
            new RegExp(`id=["']${idValue}["']`, 'g'),
            `id="${uniqueId}"`
          );
          // Update references to this ID
          processedInner = processedInner.replace(
            new RegExp(`url\\(#${idValue}\\)`, 'g'),
            `url(#${uniqueId})`
          );
        });
      }

      // Normalize indentation
      const lines = processedInner.trim().split('\n');
      const normalized = lines.map(line => {
        return line.replace(/^    /, '  ');
      }).join('\n');
      return normalized;
    }

    console.warn(`Warning: Could not find group element ${se.id} in ${se.svg}`);
    return '';
  }).filter(part => part.length > 0);

  // Start with clean SVG wrapper (no xmlns:xlink)
  const svgMatch = parentSvgContent.match(/<svg[^>]*>/);
  const svgTag = svgMatch ? svgMatch[0].replace(/\s*xmlns:xlink="[^"]*"/g, '') : '<svg xmlns="http://www.w3.org/2000/svg" width="420" height="140" viewBox="0 0 420 140">';

  // For template-exact mode, only include the extracted sub-elements (no parent template content)
  if (parts.length > 0) {
    return `${svgTag}\n  ${parts.join('\n  ')}\n</svg>\n\n`;
  } else {
    return `${svgTag}\n</svg>\n\n`;
  }
}

module.exports = {
  buildUseTags,
  ensureNamespaces,
  injectGroup,
  generateForElement,
  generateForElementInline,
  generateForElementTemplateExact,
};

