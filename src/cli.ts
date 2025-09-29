#!/usr/bin/env node
// cli.ts - Enhanced CLI with configuration-driven generation
import type { Graph } from "./graph";
import { graphToSVG } from "./svg-export";
import { genericSceneGenerator } from "./generic-scene-generator";
import { genericGraphGenerator } from "./generic-graph-generator";
import { configLoader } from "./config-loader";
import * as fs from "fs";

function showHelp() {
  console.log("🎨 Graph-to-SVG CLI - Configuration-Driven Generation");
  console.log("");
  console.log("BASIC USAGE:");
  console.log("  graph-to-svg <input.json> [output.svg]           Convert simple graph JSON to SVG");
  console.log("");
  console.log("SCENE GENERATION:");
  console.log("  graph-to-svg scene list                          List available scene templates");
  console.log("  graph-to-svg scene generate <templateId>         Generate scene from template");
  console.log("  graph-to-svg scene example <templateId> <name>   Generate from template example");
  console.log("");
  console.log("GRAPH GENERATION:");
  console.log("  graph-to-svg graph create-samples                Create sample graph templates");
  console.log("  graph-to-svg graph list                          List available graph templates");
  console.log("  graph-to-svg graph generate <template> [theme] [layout]  Generate from template");
  console.log("");
  console.log("CONFIGURATION:");
  console.log("  graph-to-svg config list                         List all available configurations");
  console.log("  graph-to-svg config sprites                      List sprite libraries");
  console.log("  graph-to-svg config themes                       List themes");
  console.log("  graph-to-svg config layouts                      List layouts");
  console.log("");
  console.log("EXAMPLES:");
  console.log("  graph-to-svg scene generate plugin-architecture-scene");
  console.log("  graph-to-svg scene example plugin-architecture-scene \"Default Plugin Architecture\"");
  console.log("  graph-to-svg graph generate config/graph-templates/microservices.json dark-plugin standard-graph");
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(1);
  }

  const command = args[0];
  const subcommand = args[1];

  try {
    switch (command) {
      case "scene":
        await handleSceneCommand(subcommand, args.slice(2));
        break;
      case "graph":
        await handleGraphCommand(subcommand, args.slice(2));
        break;
      case "config":
        await handleConfigCommand(subcommand, args.slice(2));
        break;
      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;
      default:
        // Legacy mode: treat first arg as input file
        await handleLegacyMode(args);
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
    process.exit(1);
  }
}

async function handleSceneCommand(subcommand: string, args: string[]) {
  switch (subcommand) {
    case "list":
      await genericSceneGenerator.listTemplates();
      break;
    case "generate":
      if (args.length < 1) {
        console.error("Usage: graph-to-svg scene generate <templateId> [key=value...]");
        process.exit(1);
      }
      const templateId = args[0];
      const parameters: Record<string, any> = {};

      // Parse parameters from command line (key=value format)
      for (let i = 1; i < args.length; i++) {
        const [key, value] = args[i].split("=");
        if (key && value) {
          parameters[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }

      await genericSceneGenerator.generateScene({
        templateId,
        parameters,
        generateIndividualTiles: true,
        createIndex: true
      });
      break;
    case "example":
      if (args.length < 2) {
        console.error("Usage: graph-to-svg scene example <templateId> <exampleName>");
        process.exit(1);
      }
      await genericSceneGenerator.generateFromExample(args[0], args[1]);
      break;
    default:
      console.error("Unknown scene command. Use 'list', 'generate', or 'example'");
      process.exit(1);
  }
}

async function handleGraphCommand(subcommand: string, args: string[]) {
  switch (subcommand) {
    case "create-samples":
      await genericGraphGenerator.createSampleTemplates();
      break;
    case "list":
      await genericGraphGenerator.listGraphTemplates();
      break;
    case "generate":
      if (args.length < 1) {
        console.error("Usage: graph-to-svg graph generate <templatePath> [themeId] [layoutId]");
        process.exit(1);
      }
      await genericGraphGenerator.generateFromTemplate(args[0], {
        themeId: args[1],
        layoutId: args[2]
      });
      break;
    default:
      console.error("Unknown graph command. Use 'create-samples', 'list', or 'generate'");
      process.exit(1);
  }
}

async function handleConfigCommand(subcommand: string, args: string[]) {
  const configs = await configLoader.getAvailableConfigs();

  switch (subcommand) {
    case "list":
      console.log("🎨 Available Configurations:");
      console.log(`   Sprite Libraries (${configs.spriteLibraries.length}): ${configs.spriteLibraries.join(", ")}`);
      console.log(`   Themes (${configs.themes.length}): ${configs.themes.join(", ")}`);
      console.log(`   Layouts (${configs.layouts.length}): ${configs.layouts.join(", ")}`);
      console.log(`   Templates (${configs.templates.length}): ${configs.templates.join(", ")}`);
      break;
    case "sprites":
      console.log("🎨 Available Sprite Libraries:");
      for (const libId of configs.spriteLibraries) {
        try {
          const lib = await configLoader.loadSpriteLibrary(libId);
          const spriteCount = Object.values(lib.categories).reduce((sum, cat) => sum + Object.keys(cat.sprites).length, 0);
          console.log(`   • ${libId}: ${lib.name} (v${lib.version}) - ${spriteCount} sprites`);
          console.log(`     ${lib.description}`);
        } catch (error) {
          console.log(`   • ${libId}: Error loading library`);
        }
      }
      break;
    case "themes":
      console.log("🎨 Available Themes:");
      for (const themeId of configs.themes) {
        try {
          const theme = await configLoader.loadTheme(themeId);
          console.log(`   • ${themeId}: ${theme.name} (v${theme.version})`);
          console.log(`     ${theme.description}`);
          console.log(`     Colors: ${theme.colors.primary} (primary), ${theme.colors.background} (background)`);
        } catch (error) {
          console.log(`   • ${themeId}: Error loading theme`);
        }
      }
      break;
    case "layouts":
      console.log("🎨 Available Layouts:");
      for (const layoutId of configs.layouts) {
        try {
          const layout = await configLoader.loadLayout(layoutId);
          console.log(`   • ${layoutId}: ${layout.name} (v${layout.version})`);
          console.log(`     ${layout.description}`);
          console.log(`     Algorithm: ${layout.algorithm}, Spacing: ${layout.parameters.spacingX}×${layout.parameters.spacingY}`);
        } catch (error) {
          console.log(`   • ${layoutId}: Error loading layout`);
        }
      }
      break;
    default:
      console.error("Unknown config command. Use 'list', 'sprites', 'themes', or 'layouts'");
      process.exit(1);
  }
}

async function handleLegacyMode(args: string[]) {
  const inputFile = args[0];
  const outputFile = args[1] || inputFile.replace(/\.json$/, ".svg");

  const graphData = JSON.parse(fs.readFileSync(inputFile, "utf-8")) as Graph;
  const svg = graphToSVG(graphData);
  fs.writeFileSync(outputFile, svg);
  console.log(`✅ Generated SVG: ${outputFile}`);
}

if (require.main === module) {
  main();
}
