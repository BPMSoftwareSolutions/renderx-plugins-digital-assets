#!/usr/bin/env node
// generic-scene-generator.ts - Generic scene generator using configuration files
import { templateProcessor } from "./template-processor";
import { configLoader } from "./config-loader";
import { renderScene } from "./render-svg";
import * as fs from "fs";
import * as path from "path";

export interface GenerationOptions {
  templateId: string;
  parameters?: Record<string, any>;
  outputDir?: string;
  generateIndividualTiles?: boolean;
  createIndex?: boolean;
}

export class GenericSceneGenerator {
  // Generate a scene from a template
  async generateScene(options: GenerationOptions): Promise<number> {
    try {
      const {
        templateId,
        parameters = {},
        outputDir = "samples/generated",
        generateIndividualTiles = false,
        createIndex = true
      } = options;

      console.log(`🎨 Generating scene from template: ${templateId}...\n`);

      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Process the template
    const scene = await templateProcessor.processTemplate(templateId, parameters);
    
    // Generate main scene
    const svg = renderScene(scene);
    const svgPath = path.join(outputDir, `${scene.id}.svg`);
    const jsonPath = path.join(outputDir, `${scene.id}.json`);
    
    fs.writeFileSync(svgPath, svg);
    fs.writeFileSync(jsonPath, JSON.stringify(scene, null, 2));
    
    console.log(`✅ Generated main scene: ${scene.id}`);
    console.log(`   📊 ${scene.nodes.length} nodes, ${scene.connectors?.length || 0} connectors`);
    console.log(`   🎨 Canvas: ${scene.canvas.width}×${scene.canvas.height}, Background: ${scene.bg}`);
    console.log(`   🖼️  ${svgPath}`);
    console.log(`   📁 ${jsonPath}\n`);

    let tilesGenerated = 0;
    
    // Generate individual tiles if requested
    if (generateIndividualTiles) {
      tilesGenerated = await this.generateIndividualTiles(scene, outputDir);
    }

    // Create index file if requested
    if (createIndex) {
      await this.createIndexFile(scene, outputDir, templateId, parameters, tilesGenerated);
    }

    console.log(`\n🎉 Generated scene from template: ${templateId}!`);
    console.log(`\n🔧 Features:`);
    console.log(`   • Template-driven generation with ${Object.keys(parameters).length} parameters`);
    console.log(`   • ${scene.defs?.symbols?.length || 0} reusable sprites from configuration`);
    console.log(`   • ${scene.defs?.filters?.length || 0} SVG filters and ${scene.defs?.gradients?.length || 0} gradients`);
    console.log(`   • ${scene.nodes.length} hierarchical nodes with precise positioning`);
    if (tilesGenerated > 0) {
      console.log(`   • ${tilesGenerated} individual tile scenes generated`);
    }

      return 0; // Success
    } catch (error: any) {
      console.error(`❌ Failed to generate scene: ${error}`);
      return 1; // Error
    }
  }

  // Generate individual tile scenes
  private async generateIndividualTiles(scene: any, outputDir: string): Promise<number> {
    let count = 0;
    
    for (const node of scene.nodes) {
      if (node.kind === "group") {
        const tileScene = this.createTileScene(scene, node);
        const tileSvg = renderScene(tileScene);
        
        const tileSvgPath = path.join(outputDir, `${node.id}.svg`);
        const tileJsonPath = path.join(outputDir, `${node.id}.json`);
        
        fs.writeFileSync(tileSvgPath, tileSvg);
        fs.writeFileSync(tileJsonPath, JSON.stringify(tileScene, null, 2));
        
        console.log(`✅ Generated tile: ${node.id}`);
        console.log(`   🖼️  ${tileSvgPath}`);
        console.log(`   📁 ${tileJsonPath}`);
        
        count++;
      }
    }
    
    return count;
  }

  // Create a scene for an individual tile
  private createTileScene(originalScene: any, tileNode: any): any {
    return {
      id: `${originalScene.id}-${tileNode.id}`,
      canvas: { width: 500, height: 200 },
      bg: originalScene.bg,
      defs: originalScene.defs,
      nodes: [{
        ...tileNode,
        at: { x: 40, y: 30 } // Center the tile in the smaller canvas
      }],
      connectors: []
    };
  }

  // Create index file with metadata
  private async createIndexFile(
    scene: any, 
    outputDir: string, 
    templateId: string, 
    parameters: Record<string, any>,
    tilesGenerated: number
  ): Promise<void> {
    const template = await configLoader.loadSceneTemplate(templateId);
    
    const indexData = {
      template: {
        id: templateId,
        name: template.name,
        description: template.description,
        version: template.version
      },
      generation: {
        timestamp: new Date().toISOString(),
        parameters: parameters,
        parametersUsed: Object.keys(parameters).length,
        parametersAvailable: Object.keys(template.parameters).length
      },
      scenes: [{
        id: scene.id,
        canvas: scene.canvas,
        background: scene.bg,
        nodes: scene.nodes.length,
        connectors: scene.connectors?.length || 0,
        sprites: scene.defs?.symbols?.length || 0,
        filters: scene.defs?.filters?.length || 0,
        gradients: scene.defs?.gradients?.length || 0
      }],
      files: {
        mainScene: {
          svg: `${scene.id}.svg`,
          json: `${scene.id}.json`
        },
        tiles: scene.nodes
          .filter((n: any) => n.kind === "group")
          .map((n: any) => ({
            id: n.id,
            name: this.getTileName(n.id),
            svg: `${n.id}.svg`,
            json: `${n.id}.json`
          }))
      },
      dependencies: template.dependencies || {},
      examples: template.examples || []
    };

    const indexPath = path.join(outputDir, "index.json");
    fs.writeFileSync(indexPath, JSON.stringify(indexData, null, 2));
    
    console.log(`\n📋 Created index: ${indexPath}`);
  }

  // Convert tile ID to human-readable name
  private getTileName(tileId: string): string {
    return tileId
      .split("-")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // List available templates
  async listTemplates(): Promise<void> {
    const configs = await configLoader.getAvailableConfigs();
    
    console.log("📋 Available Scene Templates:");
    for (const templateId of configs.templates) {
      try {
        const template = await configLoader.loadSceneTemplate(templateId);
        console.log(`   • ${templateId}: ${template.name} (v${template.version})`);
        console.log(`     ${template.description}`);
        if (template.examples && template.examples.length > 0) {
          console.log(`     Examples: ${template.examples.map(e => e.name).join(", ")}`);
        }
        console.log();
      } catch (error) {
        console.log(`   • ${templateId}: Error loading template`);
      }
    }
  }

  // List available configurations
  async listConfigurations(): Promise<void> {
    const configs = await configLoader.getAvailableConfigs();
    
    console.log("🎨 Available Configurations:");
    console.log(`   Sprite Libraries: ${configs.spriteLibraries.join(", ")}`);
    console.log(`   Themes: ${configs.themes.join(", ")}`);
    console.log(`   Layouts: ${configs.layouts.join(", ")}`);
    console.log(`   Templates: ${configs.templates.join(", ")}`);
  }

  // Generate from template example
  async generateFromExample(templateId: string, exampleName: string, outputDir?: string): Promise<number> {
    const examples = await templateProcessor.getTemplateExamples(templateId);
    const example = examples.find(e => e.name === exampleName);
    
    if (!example) {
      throw new Error(`Example "${exampleName}" not found in template "${templateId}"`);
    }

    console.log(`🎯 Generating from example: ${exampleName}`);
    console.log(`   Description: ${example.description || "No description"}`);
    
    return this.generateScene({
      templateId,
      parameters: example.parameters,
      outputDir: outputDir || `samples/${templateId}-${exampleName.toLowerCase().replace(/\s+/g, "-")}`,
      generateIndividualTiles: true,
      createIndex: true
    });
  }

  // Validate template parameters
  async validateTemplate(templateId: string, parameters: Record<string, any>): Promise<void> {
    const template = await configLoader.loadSceneTemplate(templateId);
    const validation = templateProcessor.validateParameters(template, parameters);
    
    if (!validation.valid) {
      console.error("❌ Template validation failed:");
      for (const error of validation.errors) {
        console.error(`   • ${error}`);
      }
      throw new Error("Template validation failed");
    }
    
    console.log("✅ Template parameters are valid");
  }
}

// Default instance
export const genericSceneGenerator = new GenericSceneGenerator();

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "list-templates":
      genericSceneGenerator.listTemplates().catch(console.error);
      break;
    case "list-configs":
      genericSceneGenerator.listConfigurations().catch(console.error);
      break;
    case "generate":
      if (args.length < 2) {
        console.error("Usage: node generic-scene-generator.js generate <templateId> [parameters...]");
        process.exit(1);
      }
      const templateId = args[1];
      const parameters: Record<string, any> = {};
      
      // Parse parameters from command line (key=value format)
      for (let i = 2; i < args.length; i++) {
        const [key, value] = args[i].split("=");
        if (key && value) {
          parameters[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
      
      genericSceneGenerator.generateScene({
        templateId,
        parameters,
        generateIndividualTiles: true,
        createIndex: true
      }).catch(console.error);
      break;
    case "example":
      if (args.length < 3) {
        console.error("Usage: node generic-scene-generator.js example <templateId> <exampleName>");
        process.exit(1);
      }
      genericSceneGenerator.generateFromExample(args[1], args[2]).catch(console.error);
      break;
    default:
      console.log("Usage:");
      console.log("  node generic-scene-generator.js list-templates");
      console.log("  node generic-scene-generator.js list-configs");
      console.log("  node generic-scene-generator.js generate <templateId> [key=value...]");
      console.log("  node generic-scene-generator.js example <templateId> <exampleName>");
  }
}
