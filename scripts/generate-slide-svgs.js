#!/usr/bin/env node
/* Slide-level SVG generator - combines all element SVGs into complete slide layouts */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const JSON_PATH = path.join(ROOT, 'assets', 'plugin-architecture', 'plugin-integration-slides.json');
const ASSETS_ROOT = path.join(ROOT, 'assets', 'plugin-architecture');

// Default slide dimensions
const SLIDE_WIDTH = 1200;
const SLIDE_HEIGHT = 800;

// Default element dimensions (can be overridden per element)
const ELEMENT_WIDTH = 420;
const ELEMENT_HEIGHT = 140;

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {
    slide: null,
    dryRun: false,
    verbose: false,
    updateCoords: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--slide' && i + 1 < args.length) {
      parsed.slide = args[++i];
    } else if (arg === '--dry-run') {
      parsed.dryRun = true;
    } else if (arg === '-v' || arg === '--verbose') {
      parsed.verbose = true;
    } else if (arg === '--update-coords') {
      parsed.updateCoords = true;
    } else if (arg === '--help') {
      console.log(`
Usage: node scripts/generate-slide-svgs.js [options]

Options:
  --slide <id>        Generate SVG for specific slide (e.g., slide-01-manifest)
  --update-coords     Update element compose coordinates in JSON file
  --dry-run          Show what would be generated without writing files
  -v, --verbose      Show detailed output
  --help             Show this help message

Examples:
  node scripts/generate-slide-svgs.js --slide slide-01-manifest
  node scripts/generate-slide-svgs.js --slide slide-01-manifest --update-coords
  node scripts/generate-slide-svgs.js --update-coords --dry-run -v
`);
      process.exit(0);
    }
  }

  return parsed;
}

// Calculate layout positions for elements in a slide
function calculateElementLayout(elements) {
  const layouts = [];
  const cols = Math.ceil(Math.sqrt(elements.length));
  const rows = Math.ceil(elements.length / cols);
  
  // Calculate spacing to fit within slide dimensions
  const availableWidth = SLIDE_WIDTH - 100; // 50px margin on each side
  const availableHeight = SLIDE_HEIGHT - 100; // 50px margin top/bottom
  
  const colWidth = availableWidth / cols;
  const rowHeight = availableHeight / rows;
  
  elements.forEach((element, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    // Center elements within their grid cells
    const x = 50 + col * colWidth + (colWidth - ELEMENT_WIDTH) / 2;
    const y = 50 + row * rowHeight + (rowHeight - ELEMENT_HEIGHT) / 2;
    
    layouts.push({
      ...element,
      compose: {
        x: Math.round(x),
        y: Math.round(y),
        width: ELEMENT_WIDTH,
        height: ELEMENT_HEIGHT
      }
    });
  });
  
  return layouts;
}

// Extract and consolidate defs from SVG content
function extractAndConsolidateDefs(svgContent) {
  const defs = [];
  let cleanContent = svgContent;

  // Extract all defs sections
  const defsRegex = /<defs>([\s\S]*?)<\/defs>/g;
  let match;
  while ((match = defsRegex.exec(svgContent)) !== null) {
    defs.push(match[1].trim());
  }

  // Remove all defs sections from content
  cleanContent = cleanContent.replace(defsRegex, '');

  return { defs, cleanContent };
}

// Generate unique IDs to avoid conflicts across elements
function makeIdsUnique(content, elementId) {
  // Replace id attributes to make them unique across elements
  return content.replace(/id="([^"]*)"/g, (match, id) => {
    return `id="${elementId}-${id}"`;
  });
}

// Update references to use unique IDs
function updateIdReferences(content, elementId) {
  // Update url() references
  content = content.replace(/url\(#([^)]*)\)/g, (match, id) => {
    return `url(#${elementId}-${id})`;
  });

  // Update other id references (href, etc.)
  content = content.replace(/href="#([^"]*)"/g, (match, id) => {
    return `href="#${elementId}-${id}"`;
  });

  return content;
}

// Clean and escape SVG content for XML compliance
function cleanSVGContent(content) {
  // Convert problematic CSS style attributes to individual SVG attributes
  // This avoids XML entity parsing issues with patterns like #000;stop-opacity
  content = content.replace(/<stop([^>]*?)style="([^"]*)"([^>]*?)\/?>/g, (match, beforeStyle, styleContent, afterStyle) => {
    let attributes = beforeStyle + afterStyle;

    // Parse CSS properties and convert to SVG attributes
    const properties = styleContent.split(';').map(prop => prop.trim()).filter(prop => prop.length > 0);

    properties.forEach(prop => {
      const [key, value] = prop.split(':').map(s => s.trim());
      if (key && value) {
        // Convert CSS property names to SVG attribute names
        const attrName = key.replace('stop-', '');
        attributes += ` ${attrName}="${value}"`;
      }
    });

    // Determine if it was self-closing
    const isSelfClosing = match.endsWith('/>');
    return `<stop${attributes}${isSelfClosing ? '/>' : '>'}`;
  });

  // Also handle other style attributes that might cause issues
  content = content.replace(/style="([^"]*)"/g, (match, styleContent) => {
    // For non-stop elements, keep style but ensure proper formatting
    let properties = styleContent.split(';').map(prop => prop.trim()).filter(prop => prop.length > 0);
    let cleanStyle = properties.join('; ');

    return `style="${cleanStyle}"`;
  });

  // Fix problematic font-family attributes with nested quotes
  content = content.replace(/font-family="([^"]*)"/g, (match, fontFamily) => {
    // Remove inner quotes and clean up font family
    const cleanFontFamily = fontFamily.replace(/'/g, '').replace(/"/g, '');
    return `font-family="${cleanFontFamily}"`;
  });

  // Escape any remaining problematic characters for XML
  content = content
    // Ensure proper XML escaping for attributes
    .replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;');

  return content;
}

// Generate slide SVG content
function generateSlideSVG(slide, elements) {
  const allDefs = [];
  const elementSVGs = [];

  elements.forEach(element => {
    const elementPath = path.join(ASSETS_ROOT, element.svg);

    if (!fs.existsSync(elementPath)) {
      console.warn(`Warning: Element SVG not found: ${element.svg}`);
      return;
    }

    const elementContent = fs.readFileSync(elementPath, 'utf8');
    const compose = element.compose || { x: 0, y: 0 };

    // Extract the inner content of the element SVG (everything between <svg> tags)
    const svgMatch = elementContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (!svgMatch) {
      console.warn(`Warning: Invalid SVG format in ${element.svg}`);
      return;
    }

    let innerContent = svgMatch[1].trim();

    // Extract and consolidate defs
    const { defs, cleanContent } = extractAndConsolidateDefs(innerContent);

    // Make IDs unique to avoid conflicts
    const uniqueDefs = defs.map(def => makeIdsUnique(def, element.id));
    const uniqueContent = makeIdsUnique(cleanContent, element.id);

    // Update references to use unique IDs
    let finalContent = updateIdReferences(uniqueContent, element.id);

    // Clean content for XML compliance
    finalContent = cleanSVGContent(finalContent);

    // Clean defs for XML compliance
    const cleanDefs = uniqueDefs.map(def => cleanSVGContent(def));

    // Collect all defs
    allDefs.push(...cleanDefs);

    // Wrap in a group with transform for positioning
    elementSVGs.push(`  <g id="${element.id}" transform="translate(${compose.x},${compose.y})" data-element="${element.label}">
    <!-- ${element.label} -->
${finalContent}
  </g>`);
  });

  // Create consolidated defs section
  const consolidatedDefs = allDefs.length > 0 ? `  <defs>
${allDefs.map(def => `    ${def}`).join('\n')}
  </defs>
  ` : '';

  // Escape XML entities in text content
  const escapeXML = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Create the complete slide SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_WIDTH}" height="${SLIDE_HEIGHT}" viewBox="0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}">
  <title>${escapeXML(slide.name)}</title>
  <desc>${escapeXML(slide.story)}</desc>

${consolidatedDefs}  <!-- Slide background -->
  <rect width="100%" height="100%" fill="#FAFAFA"/>

  <!-- Slide title -->
  <text x="${SLIDE_WIDTH/2}" y="40" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="600" fill="#1F2937">${escapeXML(slide.name)}</text>

  <!-- Elements -->
${elementSVGs.join('\n\n')}
</svg>
`;
}

// Main execution
function main() {
  const args = parseArgs();
  
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Error: Slides JSON file not found: ${JSON_PATH}`);
    process.exit(1);
  }
  
  const slidesData = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  let slides = slidesData.slides;
  
  // Filter to specific slide if requested
  if (args.slide) {
    slides = slides.filter(slide => slide.id === args.slide);
    if (slides.length === 0) {
      console.error(`Error: Slide not found: ${args.slide}`);
      process.exit(1);
    }
  }
  
  const results = {
    processed: 0,
    updated: 0,
    coordsUpdated: 0,
    details: []
  };
  
  slides.forEach(slide => {
    if (args.verbose) {
      console.log(`\nProcessing slide: ${slide.id}`);
    }
    
    let elements = slide.elements || [];
    let coordsNeedUpdate = false;
    
    // Check if elements need coordinate updates
    elements.forEach(element => {
      if (!element.compose || (element.compose.x === undefined && element.compose.y === undefined)) {
        coordsNeedUpdate = true;
      }
    });
    
    // Update coordinates if needed or requested
    if (coordsNeedUpdate || args.updateCoords) {
      if (args.verbose) {
        console.log(`  Calculating layout for ${elements.length} elements...`);
      }

      elements = calculateElementLayout(elements);

      if (args.updateCoords && !args.dryRun) {
        // Update the original JSON data - need to preserve sub_elements structure
        const slideIndex = slidesData.slides.findIndex(s => s.id === slide.id);
        elements.forEach((updatedElement, elementIndex) => {
          // Preserve existing sub_elements and other properties, just update compose
          const originalElement = slidesData.slides[slideIndex].elements[elementIndex];
          slidesData.slides[slideIndex].elements[elementIndex] = {
            ...originalElement,
            compose: updatedElement.compose
          };

          if (args.verbose) {
            console.log(`    Updated ${originalElement.id} compose:`, updatedElement.compose);
          }
        });
        results.coordsUpdated++;
      }
    }
    
    // Generate slide SVG
    const slideSVG = generateSlideSVG(slide, elements);
    const outputPath = path.join(ASSETS_ROOT, `${slide.id}.svg`);
    
    if (!args.dryRun) {
      fs.writeFileSync(outputPath, slideSVG, 'utf8');
      results.updated++;
    }
    
    results.processed++;
    results.details.push({
      slideId: slide.id,
      file: `${slide.id}.svg`,
      elements: elements.length,
      coordsUpdated: coordsNeedUpdate || args.updateCoords
    });
    
    if (args.verbose) {
      console.log(`  Generated: ${outputPath}`);
      elements.forEach(element => {
        const compose = element.compose || { x: 0, y: 0 };
        console.log(`    ${element.label}: (${compose.x}, ${compose.y})`);
      });
    }
  });
  
  // Update JSON file if coordinates were updated
  if (args.updateCoords && !args.dryRun && results.coordsUpdated > 0) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(slidesData, null, 2), 'utf8');
    if (args.verbose) {
      console.log(`\nUpdated coordinates in: ${JSON_PATH}`);
    }
  }
  
  // Output summary
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main();
}

module.exports = {
  calculateElementLayout,
  generateSlideSVG
};
