// config-loader.ts - Generic configuration loading and validation utilities
import * as fs from "fs";
import * as path from "path";

// Configuration types
export interface SpriteLibrary {
  id: string;
  name: string;
  description: string;
  version: string;
  categories: Record<string, SpriteCategory>;
  filters?: FilterDefinition[];
  gradients?: GradientDefinition[];
}

export interface SpriteCategory {
  name: string;
  description: string;
  sprites: Record<string, SpriteDefinition>;
}

export interface SpriteDefinition {
  id: string;
  name?: string;
  description?: string;
  svg: string;
  viewBox?: string;
  defaultSize?: { width: number; height: number };
  tags?: string[];
  dependencies?: string[];
}

export interface FilterDefinition {
  id: string;
  name?: string;
  description?: string;
  svg: string;
}

export interface GradientDefinition {
  id: string;
  name?: string;
  description?: string;
  svg: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  colors: {
    primary: string;
    secondary?: string;
    background: string;
    surface?: string;
    text: string;
    textSecondary?: string;
    border?: string;
    accent?: string;
    success?: string;
    warning?: string;
    error?: string;
    custom?: Record<string, string>;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: Record<string, number>;
    fontWeight?: Record<string, number>;
    lineHeight?: Record<string, number>;
  };
  spacing?: Record<string, number>;
  borders?: {
    radius?: Record<string, number>;
    width?: Record<string, number>;
  };
  shadows?: Record<string, string>;
  effects?: {
    opacity?: Record<string, number>;
    blur?: Record<string, number>;
  };
}

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  algorithm: "grid" | "radial" | "layered" | "force" | "hierarchical" | "circular" | "custom";
  parameters: {
    spacingX?: number;
    spacingY?: number;
    margin?: number;
    padding?: number;
    alignment?: "start" | "center" | "end";
    direction?: "horizontal" | "vertical" | "auto";
    wrap?: boolean;
  };
  gridSpecific?: {
    columns?: number | string;
    rows?: number | string;
    aspectRatio?: number;
  };
  radialSpecific?: {
    radius?: number;
    startAngle?: number;
    endAngle?: number;
    centerNode?: string;
  };
  layeredSpecific?: {
    layerSeparation?: number;
    nodeSeparation?: number;
    rankDirection?: "TB" | "BT" | "LR" | "RL";
    edgeRouting?: "straight" | "orthogonal" | "curved";
  };
  nodeDefaults?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
  };
  edgeDefaults?: {
    routing?: "straight" | "orthogonal" | "curved" | "bezier";
    arrowHeads?: boolean;
    labels?: boolean;
  };
  customPositions?: Record<string, { x: number; y: number }>;
  tileConfiguration?: {
    rows?: number;
    columns?: number;
    tileSize?: { width: number; height: number };
    tileSpacing?: { x: number; y: number };
    canvasSize?: { width: number; height: number };
    startPosition?: { x: number; y: number };
  };
  connectorRouting?: Record<string, {
    from: string;
    to: string;
    route: string;
    style: Record<string, any>;
  }>;
}

export interface SceneTemplate {
  id: string;
  name: string;
  description: string;
  version: string;
  parameters: Record<string, {
    type: string;
    description: string;
    default?: any;
    required?: boolean;
    validation?: any;
  }>;
  canvas: {
    width: number | string;
    height: number | string;
    background?: string;
  };
  dependencies?: {
    spriteLibraries?: string[];
    themes?: string[];
    layouts?: string[];
  };
  template: {
    defs?: {
      symbols?: string[];
      filters?: string[];
      gradients?: string[];
    };
    nodes: any[];
    connectors?: any[];
  };
  examples?: Array<{
    name: string;
    description?: string;
    parameters: Record<string, any>;
  }>;
}

// Configuration loader class
export class ConfigLoader {
  private configRoot: string;
  private cache: Map<string, any> = new Map();

  constructor(configRoot: string = "config") {
    this.configRoot = path.resolve(configRoot);
  }

  // Load sprite library configuration
  async loadSpriteLibrary(id: string): Promise<SpriteLibrary> {
    const cacheKey = `sprite:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const configPath = path.join(this.configRoot, "sprites", `${id}.json`);
    const config = await this.loadJsonFile<SpriteLibrary>(configPath);
    
    this.validateSpriteLibrary(config);
    this.cache.set(cacheKey, config);
    return config;
  }

  // Load theme configuration
  async loadTheme(id: string): Promise<ThemeConfig> {
    const cacheKey = `theme:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const configPath = path.join(this.configRoot, "themes", `${id}.json`);
    const config = await this.loadJsonFile<ThemeConfig>(configPath);
    
    this.validateTheme(config);
    this.cache.set(cacheKey, config);
    return config;
  }

  // Load layout configuration
  async loadLayout(id: string): Promise<LayoutConfig> {
    const cacheKey = `layout:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const configPath = path.join(this.configRoot, "layouts", `${id}.json`);
    const config = await this.loadJsonFile<LayoutConfig>(configPath);
    
    this.validateLayout(config);
    this.cache.set(cacheKey, config);
    return config;
  }

  // Load scene template
  async loadSceneTemplate(id: string): Promise<SceneTemplate> {
    const cacheKey = `template:${id}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const configPath = path.join(this.configRoot, "templates", `${id}.json`);
    const config = await this.loadJsonFile<SceneTemplate>(configPath);
    
    this.validateSceneTemplate(config);
    this.cache.set(cacheKey, config);
    return config;
  }

  // Generic JSON file loader
  private async loadJsonFile<T>(filePath: string): Promise<T> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      const content = await fs.promises.readFile(filePath, "utf-8");
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Failed to load configuration file ${filePath}: ${error}`);
    }
  }

  // Validation methods
  private validateSpriteLibrary(config: SpriteLibrary): void {
    if (!config.id || !config.name || !config.version || !config.categories) {
      throw new Error("Invalid sprite library configuration: missing required fields");
    }
  }

  private validateTheme(config: ThemeConfig): void {
    if (!config.id || !config.name || !config.version || !config.colors) {
      throw new Error("Invalid theme configuration: missing required fields");
    }
    if (!config.colors.primary || !config.colors.background || !config.colors.text) {
      throw new Error("Invalid theme configuration: missing required color fields");
    }
  }

  private validateLayout(config: LayoutConfig): void {
    if (!config.id || !config.name || !config.version || !config.algorithm || !config.parameters) {
      throw new Error("Invalid layout configuration: missing required fields");
    }
  }

  private validateSceneTemplate(config: SceneTemplate): void {
    if (!config.id || !config.name || !config.version || !config.canvas || !config.template) {
      throw new Error("Invalid scene template configuration: missing required fields");
    }
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get all available configurations
  async getAvailableConfigs(): Promise<{
    spriteLibraries: string[];
    themes: string[];
    layouts: string[];
    templates: string[];
  }> {
    const result = {
      spriteLibraries: await this.getConfigFiles("sprites"),
      themes: await this.getConfigFiles("themes"),
      layouts: await this.getConfigFiles("layouts"),
      templates: await this.getConfigFiles("templates")
    };
    return result;
  }

  private async getConfigFiles(subdir: string): Promise<string[]> {
    try {
      const dirPath = path.join(this.configRoot, subdir);
      const files = await fs.promises.readdir(dirPath);
      return files
        .filter(file => file.endsWith(".json"))
        .map(file => path.basename(file, ".json"));
    } catch (error) {
      return [];
    }
  }
}

// Default instance
export const configLoader = new ConfigLoader();
