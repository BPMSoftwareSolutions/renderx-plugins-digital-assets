// generic-generators.test.js - Tests for generic scene and graph generators
const { GenericSceneGenerator } = require('../dist/generic-scene-generator');
const { GenericGraphGenerator } = require('../dist/generic-graph-generator');
const fs = require('fs');
const path = require('path');

describe('Generic Generators', () => {
  const testOutputDir = 'test-output';

  beforeEach(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('Generic Scene Generator', () => {
    let sceneGenerator;

    beforeEach(() => {
      sceneGenerator = new GenericSceneGenerator();
    });

    test('should generate scene from template', async () => {
      const result = await sceneGenerator.generateScene({
        templateId: 'simple-plugin-scene',
        outputDir: testOutputDir,
        generateIndividualTiles: false,
        createIndex: false
      });

      expect(result).toBe(0); // Success exit code
      expect(fs.existsSync(path.join(testOutputDir, 'simple-plugin-scene.svg'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'simple-plugin-scene.json'))).toBe(true);
    });

    test('should generate individual tiles when requested', async () => {
      const result = await sceneGenerator.generateScene({
        templateId: 'simple-plugin-scene',
        outputDir: testOutputDir,
        generateIndividualTiles: true,
        createIndex: false
      });

      expect(result).toBe(0);
      expect(fs.existsSync(path.join(testOutputDir, 'plugin-package.svg'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'plugin-manifest.svg'))).toBe(true);
    });

    test('should create index file when requested', async () => {
      const result = await sceneGenerator.generateScene({
        templateId: 'simple-plugin-scene',
        outputDir: testOutputDir,
        generateIndividualTiles: false,
        createIndex: true
      });

      expect(result).toBe(0);
      expect(fs.existsSync(path.join(testOutputDir, 'index.json'))).toBe(true);
      
      const indexContent = JSON.parse(fs.readFileSync(path.join(testOutputDir, 'index.json'), 'utf-8'));
      expect(indexContent.scenes).toBeDefined();
      expect(indexContent.scenes.length).toBe(1);
      expect(indexContent.scenes[0].id).toBe('simple-plugin-scene');
    });

    test('should apply custom parameters', async () => {
      const customParams = {
        canvasWidth: 1000,
        canvasHeight: 700,
        backgroundColor: '#ffffff'
      };

      const result = await sceneGenerator.generateScene({
        templateId: 'simple-plugin-scene',
        parameters: customParams,
        outputDir: testOutputDir,
        generateIndividualTiles: false,
        createIndex: false
      });

      expect(result).toBe(0);
      
      const sceneData = JSON.parse(fs.readFileSync(path.join(testOutputDir, 'simple-plugin-scene.json'), 'utf-8'));
      expect(sceneData.canvas.width).toBe(1000);
      expect(sceneData.canvas.height).toBe(700);
      expect(sceneData.bg).toBe('#ffffff');
    });

    test('should generate from template example', async () => {
      const result = await sceneGenerator.generateFromExample('simple-plugin-scene', 'Default Simple Scene', testOutputDir);

      expect(result).toBe(0);
      expect(fs.existsSync(path.join(testOutputDir, 'simple-plugin-scene.svg'))).toBe(true);
    });

    test('should handle missing template gracefully', async () => {
      const result = await sceneGenerator.generateScene({
        templateId: 'non-existent-template',
        outputDir: testOutputDir
      });

      expect(result).toBe(1); // Error exit code
    });

    test('should list available templates', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await sceneGenerator.listTemplates();
      
      expect(consoleSpy).toHaveBeenCalledWith('📋 Available Scene Templates:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('simple-plugin-scene'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Generic Graph Generator', () => {
    let graphGenerator;

    beforeEach(() => {
      graphGenerator = new GenericGraphGenerator();
    });

    test('should generate graph from simple data', async () => {
      const graph = {
        nodes: [
          { id: 'A', label: 'Node A' },
          { id: 'B', label: 'Node B' }
        ],
        edges: [
          { from: 'A', to: 'B' }
        ]
      };

      const svg = await graphGenerator.generateGraph({
        graph,
        outputDir: testOutputDir,
        filename: 'test-graph.svg'
      });

      expect(svg).toBeDefined();
      expect(svg).toContain('<svg');
      expect(fs.existsSync(path.join(testOutputDir, 'test-graph.svg'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'test-graph.json'))).toBe(true);
    });

    test('should apply theme configuration', async () => {
      const graph = {
        nodes: [{ id: 'A', label: 'Node A' }],
        edges: []
      };

      const svg = await graphGenerator.generateGraph({
        graph,
        themeId: 'dark-plugin',
        outputDir: testOutputDir,
        filename: 'themed-graph.svg'
      });

      expect(svg).toBeDefined();
      
      const graphData = JSON.parse(fs.readFileSync(path.join(testOutputDir, 'themed-graph.json'), 'utf-8'));
      expect(graphData.meta.theme).toBe('dark');
    });

    test('should apply layout configuration', async () => {
      const graph = {
        nodes: [
          { id: 'A', label: 'Node A' },
          { id: 'B', label: 'Node B' }
        ],
        edges: [{ from: 'A', to: 'B' }]
      };

      const svg = await graphGenerator.generateGraph({
        graph,
        layoutId: 'standard-graph',
        outputDir: testOutputDir,
        filename: 'layout-graph.svg'
      });

      expect(svg).toBeDefined();
      
      const graphData = JSON.parse(fs.readFileSync(path.join(testOutputDir, 'layout-graph.json'), 'utf-8'));
      expect(graphData.meta.layout).toBe('layered');
      expect(graphData.meta.spacingX).toBe(180);
      expect(graphData.meta.spacingY).toBe(120);
    });

    test('should create sample templates', async () => {
      const sampleDir = path.join(testOutputDir, 'graph-templates');
      await graphGenerator.createSampleTemplates(sampleDir);

      expect(fs.existsSync(path.join(sampleDir, 'microservices.json'))).toBe(true);
      expect(fs.existsSync(path.join(sampleDir, 'data-pipeline.json'))).toBe(true);
      expect(fs.existsSync(path.join(sampleDir, 'social-network.json'))).toBe(true);
      
      // Verify template structure
      const microservicesTemplate = JSON.parse(fs.readFileSync(path.join(sampleDir, 'microservices.json'), 'utf-8'));
      expect(microservicesTemplate.id).toBe('microservices');
      expect(microservicesTemplate.name).toBe('Microservices Architecture');
      expect(microservicesTemplate.nodes).toBeDefined();
      expect(microservicesTemplate.edges).toBeDefined();
      expect(microservicesTemplate.nodes.length).toBe(8);
      expect(microservicesTemplate.edges.length).toBe(8);
    });

    test('should generate from template file', async () => {
      // First create sample templates
      const sampleDir = path.join(testOutputDir, 'graph-templates');
      await graphGenerator.createSampleTemplates(sampleDir);
      
      // Then generate from template
      const svg = await graphGenerator.generateFromTemplate(
        path.join(sampleDir, 'microservices.json'),
        { outputDir: testOutputDir }
      );

      expect(svg).toBeDefined();
      expect(fs.existsSync(path.join(testOutputDir, 'microservices.svg'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'microservices.json'))).toBe(true);
    });

    test('should load graph template correctly', async () => {
      const sampleDir = path.join(testOutputDir, 'graph-templates');
      await graphGenerator.createSampleTemplates(sampleDir);
      
      const template = await graphGenerator.loadGraphTemplate(path.join(sampleDir, 'social-network.json'));
      
      expect(template.id).toBe('social-network');
      expect(template.name).toBe('Social Network Graph');
      expect(template.nodes.length).toBe(6);
      expect(template.edges.length).toBe(7);
      expect(template.meta.layout).toBe('radial');
    });

    test('should convert template to graph correctly', async () => {
      const template = {
        id: 'test-template',
        name: 'Test Template',
        nodes: [{ id: 'A', label: 'Node A' }],
        edges: [],
        meta: { layout: 'grid', theme: 'dark-plugin' }
      };

      const graph = graphGenerator.templateToGraph(template);
      
      expect(graph.nodes).toEqual(template.nodes);
      expect(graph.edges).toEqual(template.edges);
      expect(graph.meta.layout).toBe('grid');
      expect(graph.meta.theme).toBe('light'); // Mapped from theme name
    });

    test('should list graph templates', async () => {
      const sampleDir = path.join(testOutputDir, 'graph-templates');
      await graphGenerator.createSampleTemplates(sampleDir);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await graphGenerator.listGraphTemplates(sampleDir);
      
      expect(consoleSpy).toHaveBeenCalledWith('📋 Available Graph Templates:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('microservices'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('data-pipeline'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('social-network'));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    test('should work with both scene and graph generators', async () => {
      const sceneGenerator = new GenericSceneGenerator();
      const graphGenerator = new GenericGraphGenerator();

      // Generate a scene
      const sceneResult = await sceneGenerator.generateScene({
        templateId: 'simple-plugin-scene',
        outputDir: path.join(testOutputDir, 'scenes')
      });

      // Create and generate a graph
      await graphGenerator.createSampleTemplates(path.join(testOutputDir, 'graph-templates'));
      const graphSvg = await graphGenerator.generateFromTemplate(
        path.join(testOutputDir, 'graph-templates', 'microservices.json'),
        { outputDir: path.join(testOutputDir, 'graphs') }
      );

      expect(sceneResult).toBe(0);
      expect(graphSvg).toBeDefined();
      expect(fs.existsSync(path.join(testOutputDir, 'scenes', 'simple-plugin-scene.svg'))).toBe(true);
      expect(fs.existsSync(path.join(testOutputDir, 'graphs', 'microservices.svg'))).toBe(true);
    });
  });
});
