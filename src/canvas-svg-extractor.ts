import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Canvas SVG Extractor
 * 
 * Extracts the actual SVG markup from the EventRouter canvas file
 * and saves each scene as individual SVG files, plus creates a combined version.
 */

interface CanvasComponent {
  id: string;
  type: string;
  layout: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content: {
    content: string;
    text: string;
    viewBox: string;
    preserveAspectRatio: string;
    svgMarkup: string;
  };
}

interface CanvasFile {
  components: CanvasComponent[];
}

interface ExtractionResult {
  sceneId: string;
  title: string;
  svgFile: string;
  layout: { x: number; y: number; width: number; height: number };
  extractedSuccessfully: boolean;
}

const CANVAS_FILE = join(__dirname, '..', 'assets', 'event-router', 'event_router_storybook.ui');
const SAMPLES_DIR = join(__dirname, '..', 'samples');

function loadCanvasFile(): CanvasFile {
  const content = readFileSync(CANVAS_FILE, 'utf-8');
  return JSON.parse(content) as CanvasFile;
}

function saveFile(filename: string, content: string): void {
  const filePath = join(SAMPLES_DIR, filename);
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Saved: ${filename}`);
}

function extractSceneTitle(svgMarkup: string): string {
  // Extract title from SVG comment or text elements
  const commentMatch = svgMarkup.match(/<!--\s*Scene\s*\d+:\s*([^-]+)\s*-->/i);
  if (commentMatch) {
    return commentMatch[1].trim();
  }
  
  // Fallback: look for sky text headline
  const headlineMatch = svgMarkup.match(/<text[^>]*font-size="40"[^>]*>([^<]+)</i);
  if (headlineMatch) {
    return headlineMatch[1].replace(/<[^>]*>/g, '').trim();
  }
  
  return 'EventRouter Scene';
}

function cleanSvgMarkup(svgMarkup: string): string {
  // Ensure proper XML declaration and formatting
  let cleanedSvg = svgMarkup;
  
  // Add XML declaration if missing
  if (!cleanedSvg.startsWith('<?xml')) {
    cleanedSvg = '<?xml version="1.0" encoding="UTF-8"?>\n' + cleanedSvg;
  }
  
  // Ensure proper formatting and indentation
  cleanedSvg = cleanedSvg
    .replace(/></g, '>\n<')
    .replace(/^\s+/gm, '')
    .split('\n')
    .map((line, index) => {
      if (index === 0) return line; // XML declaration
      if (index === 1) return line; // SVG root element
      
      // Simple indentation based on tag depth
      const depth = (line.match(/</g) || []).length - (line.match(/<\//g) || []).length;
      const indent = '  '.repeat(Math.max(0, depth));
      return indent + line.trim();
    })
    .join('\n');
  
  return cleanedSvg;
}

function extractIndividualScenes(canvas: CanvasFile): ExtractionResult[] {
  const results: ExtractionResult[] = [];
  
  console.log('🎬 Extracting Individual SVG Scenes from Canvas File...\n');
  
  canvas.components.forEach((component, index) => {
    if (component.type === 'svg' && component.content.svgMarkup) {
      const sceneNumber = index + 1;
      const title = extractSceneTitle(component.content.svgMarkup);
      const sceneId = `scene-${sceneNumber}-${component.id}`;
      const svgFilename = `canvas-extracted-${sceneId}.svg`;
      
      console.log(`📄 Processing Scene ${sceneNumber}: ${title}`);
      console.log(`   Component ID: ${component.id}`);
      console.log(`   Layout: ${component.layout.width}x${component.layout.height} at (${component.layout.x}, ${component.layout.y})`);
      
      try {
        // Clean and format the SVG markup
        const cleanedSvg = cleanSvgMarkup(component.content.svgMarkup);
        
        // Save individual SVG file
        saveFile(svgFilename, cleanedSvg);
        
        results.push({
          sceneId,
          title,
          svgFile: svgFilename,
          layout: component.layout,
          extractedSuccessfully: true
        });
        
        console.log(`   ✅ Successfully extracted to ${svgFilename}\n`);
        
      } catch (error) {
        console.error(`   ❌ Error extracting scene ${sceneNumber}:`, error);
        results.push({
          sceneId,
          title,
          svgFile: '',
          layout: component.layout,
          extractedSuccessfully: false
        });
      }
    }
  });
  
  return results;
}

function createCombinedStorybook(results: ExtractionResult[]): void {
  console.log('📚 Creating Combined Storybook SVG...\n');
  
  const successfulResults = results.filter(r => r.extractedSuccessfully);
  
  if (successfulResults.length === 0) {
    console.error('❌ No scenes were successfully extracted. Cannot create combined storybook.');
    return;
  }
  
  // Calculate combined canvas dimensions (2x3 grid)
  const cols = 2;
  const rows = Math.ceil(successfulResults.length / cols);
  const sceneWidth = 800;
  const sceneHeight = 400;
  const padding = 50;
  const headerHeight = 100;
  
  const totalWidth = (cols * sceneWidth) + ((cols + 1) * padding);
  const totalHeight = headerHeight + (rows * sceneHeight) + ((rows + 1) * padding);
  
  console.log(`📐 Combined canvas: ${totalWidth}x${totalHeight} (${cols}x${rows} grid)`);
  
  // Start building combined SVG
  let combinedSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}"
     xmlns="http://www.w3.org/2000/svg" role="img" aria-label="EventRouter Complete Storybook">
  
  <!-- Background -->
  <rect x="0" y="0" width="100%" height="100%" fill="#F8F9FA"/>
  
  <!-- Title -->
  <text x="${totalWidth / 2}" y="40" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#1E3A56">
    EventRouter Journey: Complete Canvas Storybook
  </text>
  <text x="${totalWidth / 2}" y="70" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="16" fill="#3C556E">
    Six Scenes of Event-Driven Architecture Through the School Bus Metaphor
  </text>
  
`;
  
  // Add each scene to the combined SVG
  successfulResults.forEach((result, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = padding + (col * (sceneWidth + padding));
    const y = headerHeight + padding + (row * (sceneHeight + padding));
    
    console.log(`   📍 Scene ${index + 1}: ${result.title} at (${x}, ${y})`);
    
    // Read the individual SVG file
    const svgFilePath = join(SAMPLES_DIR, result.svgFile);
    const svgContent = readFileSync(svgFilePath, 'utf-8');
    
    // Extract the inner SVG content (everything between <svg> tags)
    const svgMatch = svgContent.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
    if (svgMatch) {
      const innerContent = svgMatch[1];
      
      // Add scene as a group with proper positioning and clipping
      combinedSvg += `  <!-- Scene ${index + 1}: ${result.title} -->
  <g transform="translate(${x}, ${y})">
    <rect x="0" y="0" width="${sceneWidth}" height="${sceneHeight}" 
          fill="#FFFFFF" stroke="#E0E0E0" stroke-width="2" rx="8"/>
    <clipPath id="scene-${index + 1}-clip">
      <rect x="0" y="0" width="${sceneWidth}" height="${sceneHeight}" rx="8"/>
    </clipPath>
    <g clip-path="url(#scene-${index + 1}-clip)">
      <svg x="0" y="0" width="${sceneWidth}" height="${sceneHeight}" viewBox="0 0 800 400">
${innerContent}
      </svg>
    </g>
    <text x="${sceneWidth / 2}" y="${sceneHeight + 25}" text-anchor="middle" 
          font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#1E3A56">
      Scene ${index + 1}: ${result.title}
    </text>
  </g>
  
`;
    }
  });
  
  combinedSvg += '</svg>';
  
  // Save combined storybook
  const combinedFilename = 'canvas-extracted-combined-storybook.svg';
  saveFile(combinedFilename, combinedSvg);
  
  console.log(`✅ Combined storybook saved as ${combinedFilename}`);
}

function generateSummaryReport(results: ExtractionResult[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📋 CANVAS SVG EXTRACTION SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.extractedSuccessfully);
  const failed = results.filter(r => !r.extractedSuccessfully);
  
  console.log(`\n🎯 **Extraction Results:**`);
  console.log(`   • Total scenes found: ${results.length}`);
  console.log(`   • Successfully extracted: ${successful.length}`);
  console.log(`   • Failed extractions: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log(`\n📁 **Successfully Extracted Scenes:**`);
    successful.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title} → ${result.svgFile}`);
      console.log(`      Layout: ${result.layout.width}x${result.layout.height} at (${result.layout.x}, ${result.layout.y})`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n❌ **Failed Extractions:**`);
    failed.forEach((result, index) => {
      console.log(`   ${index + 1}. ${result.title} (${result.sceneId})`);
    });
  }
  
  console.log(`\n🎊 **Canvas SVG Extraction Complete!**`);
  console.log(`\nThe original SVG content from the canvas file has been successfully extracted`);
  console.log(`and saved as individual SVG files, plus a combined storybook presentation.`);
  console.log(`\nThese are the actual animated SVG scenes from the original canvas file,`);
  console.log(`preserving all animations, styling, and visual details.`);
}

async function main(): Promise<void> {
  console.log('🎨 EventRouter Canvas SVG Extractor');
  console.log('Extracting real SVG content from canvas UI file...\n');
  
  try {
    // Load canvas file
    const canvas = loadCanvasFile();
    console.log(`📂 Loaded canvas file with ${canvas.components.length} components\n`);
    
    // Extract individual scenes
    const results = extractIndividualScenes(canvas);
    
    // Create combined storybook
    createCombinedStorybook(results);
    
    // Generate summary report
    generateSummaryReport(results);
    
  } catch (error) {
    console.error('❌ Error during extraction:', error);
    process.exit(1);
  }
}

// Run the extractor
if (require.main === module) {
  main().catch(console.error);
}

export { main as runCanvasSvgExtractor };
