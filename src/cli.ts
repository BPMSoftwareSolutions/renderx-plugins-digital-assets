#!/usr/bin/env node
// cli.ts - Command line interface for graph-to-SVG converter
import { graphToSVG } from "./svg-export";
import type { Graph } from "./graph";
import * as fs from "fs";
import * as path from "path";

function showHelp() {
  console.log(`
Graph-to-SVG Converter CLI

Usage:
  graph-to-svg <input.json> [output.svg]
  graph-to-svg --help

Arguments:
  input.json    Path to JSON file containing graph definition
  output.svg    Optional output SVG file path (defaults to input name with .svg extension)

Options:
  --help        Show this help message

Examples:
  graph-to-svg my-graph.json
  graph-to-svg samples/microservices-architecture.json output/diagram.svg
`);
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  const inputPath = args[0];
  
  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file '${inputPath}' not found.`);
    process.exit(1);
  }

  try {
    // Read and parse the graph JSON
    const jsonContent = fs.readFileSync(inputPath, 'utf-8');
    const graph: Graph = JSON.parse(jsonContent);
    
    // Generate SVG
    const svg = graphToSVG(graph);
    
    // Determine output path
    let outputPath = args[1];
    if (!outputPath) {
      const parsed = path.parse(inputPath);
      outputPath = path.join(parsed.dir, parsed.name + '.svg');
    }
    
    // Write SVG file
    fs.writeFileSync(outputPath, svg);
    
    console.log(`✅ Generated SVG: ${outputPath}`);
    console.log(`📊 Graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges`);
    console.log(`🎨 Layout: ${graph.meta?.layout || 'grid'}, Theme: ${graph.meta?.theme || 'light'}`);
    
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
