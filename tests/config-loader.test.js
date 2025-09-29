// config-loader.test.js - Tests for configuration loading and validation
const { ConfigLoader } = require('../dist/config-loader');
const fs = require('fs');
const path = require('path');

describe('Configuration Loader', () => {
  let configLoader;

  beforeEach(() => {
    configLoader = new ConfigLoader('config');
  });

  afterEach(() => {
    configLoader.clearCache();
  });

  describe('Sprite Library Loading', () => {
    test('should load plugin-architecture sprite library', async () => {
      const library = await configLoader.loadSpriteLibrary('plugin-architecture');
      
      expect(library).toBeDefined();
      expect(library.id).toBe('plugin-architecture');
      expect(library.name).toBe('Plugin Architecture Sprites');
      expect(library.version).toBe('1.0.0');
      expect(library.categories).toBeDefined();
      
      // Check that categories exist
      expect(library.categories.pkg).toBeDefined();
      expect(library.categories.manifest).toBeDefined();
      expect(library.categories.handlers).toBeDefined();
      expect(library.categories.build).toBeDefined();
      expect(library.categories.host).toBeDefined();
      
      // Check sprite count
      const totalSprites = Object.values(library.categories)
        .reduce((sum, cat) => sum + Object.keys(cat.sprites).length, 0);
      expect(totalSprites).toBeGreaterThan(15);
    });

    test('should include filters and gradients', async () => {
      const library = await configLoader.loadSpriteLibrary('plugin-architecture');
      
      expect(library.filters).toBeDefined();
      expect(library.filters.length).toBeGreaterThanOrEqual(2);
      expect(library.filters.some(f => f.id === 'softShadow')).toBe(true);
      expect(library.filters.some(f => f.id === 'glow')).toBe(true);
      
      expect(library.gradients).toBeDefined();
      expect(library.gradients.length).toBeGreaterThanOrEqual(1);
      expect(library.gradients.some(g => g.id === 'violetArc')).toBe(true);
    });

    test('should cache loaded libraries', async () => {
      const library1 = await configLoader.loadSpriteLibrary('plugin-architecture');
      const library2 = await configLoader.loadSpriteLibrary('plugin-architecture');
      
      expect(library1).toBe(library2); // Same object reference due to caching
    });

    test('should throw error for non-existent library', async () => {
      await expect(configLoader.loadSpriteLibrary('non-existent'))
        .rejects.toThrow();
    });
  });

  describe('Theme Loading', () => {
    test('should load dark-plugin theme', async () => {
      const theme = await configLoader.loadTheme('dark-plugin');
      
      expect(theme).toBeDefined();
      expect(theme.id).toBe('dark-plugin');
      expect(theme.name).toBe('Dark Plugin Theme');
      expect(theme.version).toBe('1.0.0');
      
      // Check required color properties
      expect(theme.colors.primary).toBe('#8b5cf6');
      expect(theme.colors.background).toBe('#0f1116');
      expect(theme.colors.text).toBe('#e6edf3');
      
      // Check optional properties
      expect(theme.typography).toBeDefined();
      expect(theme.spacing).toBeDefined();
      expect(theme.borders).toBeDefined();
    });

    test('should validate theme configuration', async () => {
      const theme = await configLoader.loadTheme('dark-plugin');
      
      // Should have required fields
      expect(theme.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.background).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.colors.text).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('Layout Loading', () => {
    test('should load standard-graph layout', async () => {
      const layout = await configLoader.loadLayout('standard-graph');
      
      expect(layout).toBeDefined();
      expect(layout.id).toBe('standard-graph');
      expect(layout.name).toBe('Standard Graph Layouts');
      expect(layout.algorithm).toBe('layered');
      expect(layout.parameters).toBeDefined();
      expect(layout.parameters.spacingX).toBe(180);
      expect(layout.parameters.spacingY).toBe(120);
    });

    test('should load plugin-tiles layout', async () => {
      const layout = await configLoader.loadLayout('plugin-tiles');
      
      expect(layout).toBeDefined();
      expect(layout.id).toBe('plugin-tiles');
      expect(layout.algorithm).toBe('custom');
      expect(layout.customPositions).toBeDefined();
      expect(layout.tileConfiguration).toBeDefined();
    });
  });

  describe('Scene Template Loading', () => {
    test('should load simple-plugin-scene template', async () => {
      const template = await configLoader.loadSceneTemplate('simple-plugin-scene');
      
      expect(template).toBeDefined();
      expect(template.id).toBe('simple-plugin-scene');
      expect(template.name).toBe('Simple Plugin Scene Template');
      expect(template.parameters).toBeDefined();
      expect(template.canvas).toBeDefined();
      expect(template.template).toBeDefined();
      expect(template.template.nodes).toBeDefined();
      expect(template.template.nodes.length).toBeGreaterThan(0);
    });

    test('should include parameter definitions', async () => {
      const template = await configLoader.loadSceneTemplate('simple-plugin-scene');
      
      expect(template.parameters.canvasWidth).toBeDefined();
      expect(template.parameters.canvasWidth.type).toBe('number');
      expect(template.parameters.canvasWidth.default).toBe(800);
      
      expect(template.parameters.backgroundColor).toBeDefined();
      expect(template.parameters.backgroundColor.type).toBe('color');
      expect(template.parameters.backgroundColor.default).toBe('#0f1116');
    });

    test('should include dependencies', async () => {
      const template = await configLoader.loadSceneTemplate('simple-plugin-scene');
      
      expect(template.dependencies).toBeDefined();
      expect(template.dependencies.spriteLibraries).toContain('plugin-architecture');
      expect(template.dependencies.themes).toContain('dark-plugin');
      expect(template.dependencies.layouts).toContain('plugin-tiles');
    });

    test('should include examples', async () => {
      const template = await configLoader.loadSceneTemplate('simple-plugin-scene');
      
      expect(template.examples).toBeDefined();
      expect(template.examples.length).toBeGreaterThan(0);
      expect(template.examples[0].name).toBeDefined();
      expect(template.examples[0].parameters).toBeDefined();
    });
  });

  describe('Configuration Discovery', () => {
    test('should list available configurations', async () => {
      const configs = await configLoader.getAvailableConfigs();
      
      expect(configs).toBeDefined();
      expect(configs.spriteLibraries).toContain('plugin-architecture');
      expect(configs.themes).toContain('dark-plugin');
      expect(configs.layouts).toContain('standard-graph');
      expect(configs.layouts).toContain('plugin-tiles');
      expect(configs.templates).toContain('simple-plugin-scene');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing configuration files gracefully', async () => {
      await expect(configLoader.loadSpriteLibrary('missing'))
        .rejects.toThrow(/Failed to load configuration file/);
    });

    test('should validate configuration structure', async () => {
      // This would test with malformed JSON files if they existed
      // For now, we test that valid files pass validation
      const library = await configLoader.loadSpriteLibrary('plugin-architecture');
      expect(() => configLoader.validateSpriteLibrary(library)).not.toThrow();
    });
  });

  describe('Cache Management', () => {
    test('should clear cache properly', async () => {
      await configLoader.loadSpriteLibrary('plugin-architecture');
      configLoader.clearCache();
      
      // Loading again should work (would fail if cache corruption occurred)
      const library = await configLoader.loadSpriteLibrary('plugin-architecture');
      expect(library).toBeDefined();
    });
  });
});
