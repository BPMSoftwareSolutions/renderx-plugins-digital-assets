#!/usr/bin/env node
// generic-graph-generator.ts - Generic graph generator using configuration files
import type { Graph } from "./graph";
import { graphToSVG } from "./svg-export";
import { configLoader, type ThemeConfig, type LayoutConfig } from "./config-loader";
import * as fs from "fs";
import * as path from "path";

export interface GraphGenerationOptions {
  graph: Graph;
  themeId?: string;
  layoutId?: string;
  outputDir?: string;
  filename?: string;
}

export interface GraphTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Array<{
    id: string;
    label?: string;
    w?: number;
    h?: number;
    data?: Record<string, unknown>;
  }>;
  edges: Array<{
    id?: string;
    from: string;
    to: string;
    label?: string;
    dashed?: boolean;
  }>;
  meta?: {
    layout?: string;
    theme?: string;
    spacingX?: number;
    spacingY?: number;
    margin?: number;
    rounded?: boolean;
    arrowHeads?: boolean;
  };
}

export class GenericGraphGenerator {
  // Generate a graph with configuration-driven styling and layout
  async generateGraph(options: GraphGenerationOptions): Promise<string> {
    const {
      graph,
      themeId,
      layoutId,
      outputDir = "samples/graphs",
      filename
    } = options;

    // Apply theme configuration if specified
    let styledGraph = graph;
    if (themeId) {
      styledGraph = await this.applyTheme(graph, themeId);
    }

    // Apply layout configuration if specified
    if (layoutId) {
      styledGraph = await this.applyLayout(styledGraph, layoutId);
    }

    // Generate SVG
    const svg = graphToSVG(styledGraph);

    // Save to file if output directory specified
    if (outputDir) {
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const graphFilename = filename || `${styledGraph.nodes[0]?.id || "graph"}-${Date.now()}.svg`;
      const svgPath = path.join(outputDir, graphFilename);
      const jsonPath = path.join(outputDir, graphFilename.replace(".svg", ".json"));

      fs.writeFileSync(svgPath, svg);
      fs.writeFileSync(jsonPath, JSON.stringify(styledGraph, null, 2));

      console.log(`✅ Generated graph: ${graphFilename}`);
      console.log(`   📊 ${styledGraph.nodes.length} nodes, ${styledGraph.edges.length} edges`);
      console.log(`   🎨 Theme: ${themeId || "default"}, Layout: ${layoutId || styledGraph.meta?.layout || "grid"}`);
      console.log(`   🖼️  ${svgPath}`);
      console.log(`   📁 ${jsonPath}`);
    }

    return svg;
  }

  // Apply theme configuration to a graph
  private async applyTheme(graph: Graph, themeId: string): Promise<Graph> {
    const theme = await configLoader.loadTheme(themeId);
    
    const themedGraph: Graph = {
      ...graph,
      meta: {
        ...graph.meta,
        theme: this.mapThemeToGraphTheme(theme)
      }
    };

    return themedGraph;
  }

  // Apply layout configuration to a graph
  private async applyLayout(graph: Graph, layoutId: string): Promise<Graph> {
    const layout = await configLoader.loadLayout(layoutId);
    
    // Map layout algorithm to supported graph layout types
    const graphLayout: "grid" | "radial" | "layered" =
      layout.algorithm === "custom" ? "grid" :
      layout.algorithm === "force" ? "grid" :
      layout.algorithm === "hierarchical" ? "layered" :
      layout.algorithm === "circular" ? "radial" :
      layout.algorithm as "grid" | "radial" | "layered";

    const layoutGraph: Graph = {
      ...graph,
      meta: {
        ...graph.meta,
        layout: graphLayout,
        spacingX: layout.parameters.spacingX,
        spacingY: layout.parameters.spacingY,
        margin: layout.parameters.margin,
        rounded: true, // Default to rounded for modern look
        arrowHeads: layout.edgeDefaults?.arrowHeads ?? true
      }
    };

    // Apply node defaults
    if (layout.nodeDefaults) {
      layoutGraph.nodes = layoutGraph.nodes.map(node => ({
        ...node,
        w: node.w || layout.nodeDefaults!.width,
        h: node.h || layout.nodeDefaults!.height
      }));
    }

    return layoutGraph;
  }

  // Map theme config to simple graph theme
  private mapThemeToGraphTheme(theme: ThemeConfig): "light" | "dark" {
    // Simple heuristic: if background is dark, use dark theme
    const bgColor = theme.colors.background;
    const brightness = this.getColorBrightness(bgColor);
    return brightness < 128 ? "dark" : "light";
  }

  // Calculate color brightness (0-255)
  private getColorBrightness(hexColor: string): number {
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  // Load a graph template from JSON file
  async loadGraphTemplate(templatePath: string): Promise<GraphTemplate> {
    try {
      const content = await fs.promises.readFile(templatePath, "utf-8");
      return JSON.parse(content) as GraphTemplate;
    } catch (error) {
      throw new Error(`Failed to load graph template ${templatePath}: ${error}`);
    }
  }

  // Convert graph template to Graph object
  templateToGraph(template: GraphTemplate): Graph {
    // Ensure meta properties match Graph interface constraints
    const meta = template.meta ? {
      layout: this.mapLayoutType(template.meta.layout),
      theme: this.mapThemeType(template.meta.theme),
      spacingX: template.meta.spacingX,
      spacingY: template.meta.spacingY,
      margin: template.meta.margin,
      rounded: template.meta.rounded,
      arrowHeads: template.meta.arrowHeads
    } : undefined;

    return {
      nodes: template.nodes,
      edges: template.edges,
      meta
    };
  }

  // Map layout string to valid Graph layout type
  private mapLayoutType(layout?: string): "grid" | "radial" | "layered" | undefined {
    if (!layout) return undefined;
    switch (layout) {
      case "grid":
      case "radial":
      case "layered":
        return layout;
      default:
        return "grid"; // Default fallback
    }
  }

  // Map theme string to valid Graph theme type
  private mapThemeType(theme?: string): "light" | "dark" | undefined {
    if (!theme) return undefined;
    switch (theme) {
      case "light":
      case "dark":
        return theme;
      default:
        return "light"; // Default fallback
    }
  }

  // Generate graph from template file
  async generateFromTemplate(
    templatePath: string,
    options: Omit<GraphGenerationOptions, "graph"> = {}
  ): Promise<string> {
    const template = await this.loadGraphTemplate(templatePath);
    const graph = this.templateToGraph(template);
    
    console.log(`🎨 Generating graph from template: ${template.name}`);
    console.log(`   Description: ${template.description}`);
    
    return this.generateGraph({
      graph,
      ...options,
      filename: options.filename || `${template.id}.svg`
    });
  }

  // Create sample graph templates
  async createSampleTemplates(outputDir: string = "config/graph-templates"): Promise<void> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const templates: GraphTemplate[] = [
      {
        id: "microservices",
        name: "Microservices Architecture",
        description: "A typical microservices architecture with API gateway, services, and databases",
        nodes: [
          { id: "gateway", label: "API Gateway" },
          { id: "auth", label: "Auth Service" },
          { id: "user", label: "User Service" },
          { id: "order", label: "Order Service" },
          { id: "payment", label: "Payment Service" },
          { id: "userdb", label: "User DB" },
          { id: "orderdb", label: "Order DB" },
          { id: "paymentdb", label: "Payment DB" }
        ],
        edges: [
          { from: "gateway", to: "auth" },
          { from: "gateway", to: "user" },
          { from: "gateway", to: "order" },
          { from: "gateway", to: "payment" },
          { from: "user", to: "userdb" },
          { from: "order", to: "orderdb" },
          { from: "payment", to: "paymentdb" },
          { from: "order", to: "payment", label: "process", dashed: true }
        ],
        meta: {
          layout: "layered",
          theme: "dark-plugin",
          spacingX: 200,
          spacingY: 120,
          margin: 40,
          rounded: true,
          arrowHeads: true
        }
      },
      {
        id: "data-pipeline",
        name: "Data Processing Pipeline",
        description: "A data processing pipeline from sources to analytics",
        nodes: [
          { id: "sources", label: "Data Sources" },
          { id: "ingestion", label: "Data Ingestion" },
          { id: "transform", label: "Transform" },
          { id: "warehouse", label: "Data Warehouse" },
          { id: "analytics", label: "Analytics" },
          { id: "dashboard", label: "Dashboard" }
        ],
        edges: [
          { from: "sources", to: "ingestion" },
          { from: "ingestion", to: "transform" },
          { from: "transform", to: "warehouse" },
          { from: "warehouse", to: "analytics" },
          { from: "analytics", to: "dashboard" }
        ],
        meta: {
          layout: "layered",
          theme: "dark-plugin",
          spacingX: 180,
          spacingY: 100,
          margin: 30,
          rounded: true,
          arrowHeads: true
        }
      },
      {
        id: "social-network",
        name: "Social Network Graph",
        description: "A social network showing connections between users",
        nodes: [
          { id: "alice", label: "Alice" },
          { id: "bob", label: "Bob" },
          { id: "charlie", label: "Charlie" },
          { id: "diana", label: "Diana" },
          { id: "eve", label: "Eve" },
          { id: "frank", label: "Frank" }
        ],
        edges: [
          { from: "alice", to: "bob", label: "friends" },
          { from: "alice", to: "charlie", label: "friends" },
          { from: "bob", to: "diana", label: "friends" },
          { from: "charlie", to: "eve", label: "friends" },
          { from: "diana", to: "frank", label: "friends" },
          { from: "eve", to: "frank", label: "friends" },
          { from: "alice", to: "diana", label: "colleagues", dashed: true }
        ],
        meta: {
          layout: "radial",
          theme: "dark-plugin",
          spacingX: 150,
          spacingY: 150,
          margin: 50,
          rounded: true,
          arrowHeads: false
        }
      }
    ];

    for (const template of templates) {
      const templatePath = path.join(outputDir, `${template.id}.json`);
      fs.writeFileSync(templatePath, JSON.stringify(template, null, 2));
      console.log(`✅ Created template: ${templatePath}`);
    }

    console.log(`\n🎉 Created ${templates.length} sample graph templates in ${outputDir}`);
  }

  // List available graph templates
  async listGraphTemplates(templateDir: string = "config/graph-templates"): Promise<void> {
    try {
      const files = await fs.promises.readdir(templateDir);
      const templateFiles = files.filter(file => file.endsWith(".json"));

      console.log("📋 Available Graph Templates:");
      for (const file of templateFiles) {
        try {
          const template = await this.loadGraphTemplate(path.join(templateDir, file));
          console.log(`   • ${template.id}: ${template.name}`);
          console.log(`     ${template.description}`);
          console.log(`     Nodes: ${template.nodes.length}, Edges: ${template.edges.length}`);
          console.log();
        } catch (error) {
          console.log(`   • ${file}: Error loading template`);
        }
      }
    } catch (error) {
      console.log("No graph templates directory found. Use 'create-samples' to create sample templates.");
    }
  }
}

// Default instance
export const genericGraphGenerator = new GenericGraphGenerator();

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case "create-samples":
      genericGraphGenerator.createSampleTemplates().catch(console.error);
      break;
    case "list-templates":
      genericGraphGenerator.listGraphTemplates().catch(console.error);
      break;
    case "generate":
      if (args.length < 2) {
        console.error("Usage: node generic-graph-generator.js generate <templatePath> [themeId] [layoutId]");
        process.exit(1);
      }
      genericGraphGenerator.generateFromTemplate(args[1], {
        themeId: args[2],
        layoutId: args[3]
      }).catch(console.error);
      break;
    default:
      console.log("Usage:");
      console.log("  node generic-graph-generator.js create-samples");
      console.log("  node generic-graph-generator.js list-templates");
      console.log("  node generic-graph-generator.js generate <templatePath> [themeId] [layoutId]");
  }
}
