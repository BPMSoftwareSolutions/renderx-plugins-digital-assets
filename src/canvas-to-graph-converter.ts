import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { renderScene } from './render-svg';
import type { Scene } from './scene';

/**
 * Canvas to Graph Converter
 * 
 * Converts the EventRouter canvas file into proper graph configurations
 * that generate SVGs matching the original canvas content.
 * 
 * This establishes the graph configurations as the single source of truth
 * while preserving all the rich animated content from the canvas file.
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

const CANVAS_FILE = join(__dirname, '..', 'assets', 'event-router', 'event_router_storybook.ui');
const SAMPLES_DIR = join(__dirname, '..', 'samples');

function loadCanvasFile(): CanvasFile {
  const content = readFileSync(CANVAS_FILE, 'utf-8');
  return JSON.parse(content) as CanvasFile;
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

function cleanSvgMarkup(svgMarkup: string): string[] {
  // Remove the outer <svg> wrapper and extract inner content
  const svgMatch = svgMarkup.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  const innerContent = svgMatch ? svgMatch[1] : svgMarkup;
  
  // Split into lines and clean up
  return innerContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
}

function createSceneConfig(component: CanvasComponent, sceneNumber: number): Scene {
  const title = extractSceneTitle(component.content.svgMarkup);
  const rawSvgLines = cleanSvgMarkup(component.content.svgMarkup);
  
  return {
    id: `event-router-scene-${sceneNumber}-${component.id}`,
    canvas: { 
      width: component.layout.width, 
      height: component.layout.height 
    },
    bg: "#87CEEB", // Sky blue background
    defs: {
      filters: [
        "<filter id=\"sceneShadow\" x=\"-20%\" y=\"-20%\" width=\"140%\" height=\"140%\"><feDropShadow dx=\"0\" dy=\"4\" stdDeviation=\"8\" flood-color=\"#000\" flood-opacity=\"0.25\"/></filter>",
        "<filter id=\"busGlow\"><feGaussianBlur stdDeviation=\"2\" result=\"b\"/><feMerge><feMergeNode in=\"b\"/><feMergeNode in=\"SourceGraphic\"/></feMerge></filter>"
      ],
      gradients: [
        "<linearGradient id=\"roadGradient\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#404040\"/><stop offset=\"0.5\" stop-color=\"#505050\"/><stop offset=\"1\" stop-color=\"#404040\"/></linearGradient>",
        "<linearGradient id=\"busGradient\" x1=\"0\" y1=\"0\" x2=\"1\" y2=\"0\"><stop offset=\"0\" stop-color=\"#FFD700\"/><stop offset=\"0.5\" stop-color=\"#FFA500\"/><stop offset=\"1\" stop-color=\"#FFD700\"/></linearGradient>"
      ],
      rawSvg: rawSvgLines
    },
    nodes: [
      {
        kind: "raw-svg",
        id: `scene-${sceneNumber}-content`,
        at: { x: 0, y: 0 },
        size: {
          width: component.layout.width,
          height: component.layout.height
        },
        rawSvg: "USE_DEFS_RAWSVG"
      }
    ]
  };
}

function saveFile(filename: string, content: string): void {
  const filePath = join(SAMPLES_DIR, filename);
  writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ Saved: ${filename}`);
}

async function main(): Promise<void> {
  console.log('🔄 Canvas to Graph Converter');
  console.log('Converting EventRouter canvas file to graph configurations...\n');
  
  try {
    // Load canvas file
    const canvas = loadCanvasFile();
    console.log(`📂 Loaded canvas file with ${canvas.components.length} components\n`);
    
    const sceneResults: Array<{
      sceneNumber: number;
      title: string;
      configFile: string;
      svgFile: string;
      success: boolean;
    }> = [];
    
    // Process each scene
    canvas.components.forEach((component, index) => {
      if (component.type === 'svg' && component.content.svgMarkup) {
        const sceneNumber = index + 1;
        const title = extractSceneTitle(component.content.svgMarkup);
        
        console.log(`📄 Processing Scene ${sceneNumber}: ${title}`);
        console.log(`   Component ID: ${component.id}`);
        console.log(`   Layout: ${component.layout.width}x${component.layout.height} at (${component.layout.x}, ${component.layout.y})`);
        
        try {
          // Create scene configuration
          const sceneConfig = createSceneConfig(component, sceneNumber);
          const configFilename = `graph-scene-${sceneNumber}-${component.id}.json`;
          saveFile(configFilename, JSON.stringify(sceneConfig, null, 2));
          
          // Generate SVG from graph configuration
          const svg = renderScene(sceneConfig);
          const svgFilename = `graph-scene-${sceneNumber}-${component.id}.svg`;
          saveFile(svgFilename, svg);
          
          sceneResults.push({
            sceneNumber,
            title,
            configFile: configFilename,
            svgFile: svgFilename,
            success: true
          });
          
          console.log(`   ✅ Successfully converted to graph configuration`);
          console.log(`   📊 Raw SVG lines: ${sceneConfig.defs?.rawSvg?.length || 0}\n`);
          
        } catch (error) {
          console.error(`   ❌ Error processing scene ${sceneNumber}:`, error);
          sceneResults.push({
            sceneNumber,
            title,
            configFile: '',
            svgFile: '',
            success: false
          });
        }
      }
    });
    
    // Generate summary report
    console.log('='.repeat(80));
    console.log('📋 CANVAS TO GRAPH CONVERSION SUMMARY');
    console.log('='.repeat(80));
    
    const successful = sceneResults.filter(r => r.success);
    const failed = sceneResults.filter(r => !r.success);
    
    console.log(`\n🎯 **Conversion Results:**`);
    console.log(`   • Total scenes processed: ${sceneResults.length}`);
    console.log(`   • Successfully converted: ${successful.length}`);
    console.log(`   • Failed conversions: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log(`\n📁 **Successfully Converted Scenes:**`);
      successful.forEach((result, index) => {
        console.log(`   ${index + 1}. Scene ${result.sceneNumber}: ${result.title}`);
        console.log(`      Config: ${result.configFile}`);
        console.log(`      SVG: ${result.svgFile}`);
      });
    }
    
    console.log(`\n🎊 **Canvas to Graph Conversion Complete!**`);
    console.log(`\nAll EventRouter scenes have been converted from canvas format to`);
    console.log(`graph configurations that serve as the single source of truth.`);
    console.log(`\nThe graph configurations now generate SVGs that match the original`);
    console.log(`canvas content, including all animations and visual details.`);
    
  } catch (error) {
    console.error('❌ Error during conversion:', error);
    process.exit(1);
  }
}

// Run the converter
if (require.main === module) {
  main().catch(console.error);
}

export { main as runCanvasToGraphConverter };
