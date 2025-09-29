// template-processor.ts - Template processing and parameter substitution utilities
import type { Scene } from "./scene";
import type { SceneTemplate, SpriteLibrary, ThemeConfig, LayoutConfig } from "./config-loader";
import { configLoader } from "./config-loader";

export interface TemplateContext {
  parameters: Record<string, any>;
  spriteLibraries: SpriteLibrary[];
  themes: ThemeConfig[];
  layouts: LayoutConfig[];
}

export class TemplateProcessor {
  public configLoader = configLoader;

  // Process a scene template with given parameters
  async processTemplate(
    templateId: string, 
    parameters: Record<string, any> = {}
  ): Promise<Scene> {
    const template = await configLoader.loadSceneTemplate(templateId);
    
    // Merge parameters with defaults
    const mergedParams = this.mergeParameters(template, parameters);
    
    // Load dependencies
    const context = await this.loadDependencies(template, mergedParams);
    
    // Process the template
    const scene = this.processSceneTemplate(template, context);
    
    return scene;
  }

  // Merge user parameters with template defaults
  private mergeParameters(template: SceneTemplate, userParams: Record<string, any>): Record<string, any> {
    const merged: Record<string, any> = {};
    
    // Start with template defaults
    for (const [key, paramDef] of Object.entries(template.parameters)) {
      merged[key] = paramDef.default;
    }
    
    // Override with user parameters
    for (const [key, value] of Object.entries(userParams)) {
      if (template.parameters[key]) {
        merged[key] = value;
      } else {
        console.warn(`Unknown parameter: ${key}`);
      }
    }
    
    // Validate required parameters
    for (const [key, paramDef] of Object.entries(template.parameters)) {
      if (paramDef.required && merged[key] === undefined) {
        throw new Error(`Required parameter missing: ${key}`);
      }
    }
    
    return merged;
  }

  // Load all dependencies (sprite libraries, themes, layouts)
  private async loadDependencies(template: SceneTemplate, parameters: Record<string, any>): Promise<TemplateContext> {
    const context: TemplateContext = {
      parameters,
      spriteLibraries: [],
      themes: [],
      layouts: []
    };

    if (template.dependencies) {
      // Load sprite libraries
      if (template.dependencies.spriteLibraries) {
        for (const libId of template.dependencies.spriteLibraries) {
          const resolvedId = this.substituteParameters(libId, parameters);
          const library = await configLoader.loadSpriteLibrary(resolvedId);
          context.spriteLibraries.push(library);
        }
      }

      // Load themes
      if (template.dependencies.themes) {
        for (const themeId of template.dependencies.themes) {
          const resolvedId = this.substituteParameters(themeId, parameters);
          const theme = await configLoader.loadTheme(resolvedId);
          context.themes.push(theme);
        }
      }

      // Load layouts
      if (template.dependencies.layouts) {
        for (const layoutId of template.dependencies.layouts) {
          const resolvedId = this.substituteParameters(layoutId, parameters);
          const layout = await configLoader.loadLayout(resolvedId);
          context.layouts.push(layout);
        }
      }
    }

    return context;
  }

  // Process the scene template into a concrete scene
  private processSceneTemplate(template: SceneTemplate, context: TemplateContext): Scene {
    const scene: Scene = {
      id: this.substituteParameters(template.id, context.parameters),
      canvas: {
        width: this.resolveValue(template.canvas.width, context.parameters),
        height: this.resolveValue(template.canvas.height, context.parameters)
      },
      bg: template.canvas.background ? this.substituteParameters(template.canvas.background, context.parameters) : undefined,
      defs: this.processDefs(template, context),
      nodes: this.processNodes(template.template.nodes, context),
      connectors: template.template.connectors ? this.processConnectors(template.template.connectors, context) : undefined
    };

    return scene;
  }

  // Process defs section (symbols, filters, gradients)
  private processDefs(template: SceneTemplate, context: TemplateContext): Scene["defs"] {
    const defs: Scene["defs"] = {
      symbols: [],
      filters: [],
      gradients: []
    };

    // Collect symbols from sprite libraries
    for (const library of context.spriteLibraries) {
      // Add symbols based on template requirements
      if (template.template.defs?.symbols) {
        for (const symbolPattern of template.template.defs.symbols) {
          const symbols = this.matchSymbols(library, symbolPattern);
          for (const symbol of symbols) {
            defs.symbols!.push({ id: symbol.id, svg: symbol.svg });
          }
        }
      }

      // Add filters
      if (library.filters && template.template.defs?.filters) {
        for (const filterName of template.template.defs.filters) {
          const filter = library.filters.find(f => f.id === filterName);
          if (filter) {
            defs.filters!.push(filter.svg);
          }
        }
      }

      // Add gradients
      if (library.gradients && template.template.defs?.gradients) {
        for (const gradientName of template.template.defs.gradients) {
          const gradient = library.gradients.find(g => g.id === gradientName);
          if (gradient) {
            defs.gradients!.push(gradient.svg);
          }
        }
      }
    }

    return defs;
  }

  // Match symbols based on pattern (supports wildcards like "pkg/*")
  private matchSymbols(library: SpriteLibrary, pattern: string): Array<{ id: string; svg: string }> {
    const symbols: Array<{ id: string; svg: string }> = [];
    
    for (const [categoryName, category] of Object.entries(library.categories)) {
      for (const [spriteName, sprite] of Object.entries(category.sprites)) {
        const fullId = `${categoryName}/${spriteName}`;
        
        if (this.matchesPattern(fullId, pattern)) {
          symbols.push({ id: sprite.id, svg: sprite.svg });
        }
      }
    }
    
    return symbols;
  }

  // Check if a string matches a pattern (supports * wildcard)
  private matchesPattern(str: string, pattern: string): boolean {
    if (pattern === str) return true;
    if (pattern.endsWith("/*")) {
      const prefix = pattern.slice(0, -2);
      return str.startsWith(prefix + "/");
    }
    return false;
  }

  // Process template nodes
  private processNodes(nodes: any[], context: TemplateContext): Scene["nodes"] {
    return nodes.map(node => this.processNode(node, context));
  }

  // Process a single node
  private processNode(node: any, context: TemplateContext): any {
    const processed = { ...node };
    
    // Substitute parameters in all string values
    this.substituteInObject(processed, context.parameters);
    
    // Process children recursively
    if (processed.children) {
      processed.children = processed.children.map((child: any) => this.processNode(child, context));
    }
    
    return processed;
  }

  // Process template connectors
  private processConnectors(connectors: any[], context: TemplateContext): Scene["connectors"] {
    return connectors
      .filter(connector => this.evaluateCondition(connector.condition, context.parameters))
      .map(connector => {
        const processed = { ...connector };
        delete processed.condition; // Remove condition from final output
        this.substituteInObject(processed, context.parameters);
        return processed;
      });
  }

  // Evaluate a condition (simple boolean or parameter reference)
  evaluateCondition(condition: any, parameters: Record<string, any>): boolean {
    if (condition === undefined) return true;
    if (typeof condition === "boolean") return condition;
    if (typeof condition === "string" && condition.startsWith("{{") && condition.endsWith("}}")) {
      const paramName = condition.slice(2, -2);
      return Boolean(parameters[paramName]);
    }
    return Boolean(condition);
  }

  // Substitute parameters in an object recursively
  private substituteInObject(obj: any, parameters: Record<string, any>): void {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "string") {
        obj[key] = this.resolveValue(value, parameters);
      } else if (typeof value === "object" && value !== null) {
        this.substituteInObject(value, parameters);
      }
    }
  }

  // Substitute parameters in a string value
  private substituteParameters(value: string, parameters: Record<string, any>): string {
    return value.replace(/\{\{(\w+)\}\}/g, (match, paramName) => {
      if (parameters.hasOwnProperty(paramName)) {
        return String(parameters[paramName]);
      }
      console.warn(`Parameter not found: ${paramName}`);
      return match;
    });
  }

  // Resolve a value that might be a parameter reference or literal
  resolveValue(value: any, parameters: Record<string, any>): any {
    if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
      const paramName = value.slice(2, -2);
      const resolvedValue = parameters[paramName] ?? value;

      // Return the resolved value with its original type
      return resolvedValue;
    }
    if (typeof value === 'string' && value.includes('{{')) {
      return this.substituteParameters(value, parameters);
    }
    return value;
  }

  // Get available examples for a template
  async getTemplateExamples(templateId: string): Promise<Array<{ name: string; description?: string; parameters: Record<string, any> }>> {
    const template = await this.configLoader.loadSceneTemplate(templateId);
    return template.examples || [];
  }

  // Validate parameters against template schema
  validateParameters(template: SceneTemplate, parameters: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check required parameters
    for (const [key, paramDef] of Object.entries(template.parameters)) {
      if (paramDef.required && parameters[key] === undefined) {
        errors.push(`Required parameter missing: ${key}`);
      }
    }
    
    // Check parameter types (basic validation)
    for (const [key, value] of Object.entries(parameters)) {
      const paramDef = template.parameters[key];
      if (paramDef && !this.validateParameterType(value, paramDef.type)) {
        errors.push(`Parameter ${key} has invalid type. Expected: ${paramDef.type}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }

  // Basic type validation
  private validateParameterType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case "string": return typeof value === "string";
      case "number": return typeof value === "number";
      case "boolean": return typeof value === "boolean";
      case "color": return typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value);
      case "array": return Array.isArray(value);
      case "object": return typeof value === "object" && value !== null && !Array.isArray(value);
      default: return true; // Unknown types pass validation
    }
  }


}

// Default instance
export const templateProcessor = new TemplateProcessor();
