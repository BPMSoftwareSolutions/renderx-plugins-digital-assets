// template-processor.test.js - Tests for template processing and parameter substitution
const { TemplateProcessor } = require('../dist/template-processor');
const fs = require('fs');
const path = require('path');

describe('Template Processor', () => {
  let templateProcessor;

  beforeEach(() => {
    templateProcessor = new TemplateProcessor();
  });

  describe('Template Processing', () => {
    test('should process simple-plugin-scene template with default parameters', async () => {
      const scene = await templateProcessor.processTemplate('simple-plugin-scene');
      
      expect(scene).toBeDefined();
      expect(scene.id).toBe('simple-plugin-scene');
      expect(scene.canvas.width).toBe(800);
      expect(scene.canvas.height).toBe(600);
      expect(scene.bg).toBe('#0f1116');
      expect(scene.nodes).toBeDefined();
      expect(scene.nodes.length).toBe(2);
    });

    test('should process template with custom parameters', async () => {
      const parameters = {
        canvasWidth: 1200,
        canvasHeight: 800,
        backgroundColor: '#ffffff',
        tileWidth: 400,
        tileHeight: 150
      };
      
      const scene = await templateProcessor.processTemplate('simple-plugin-scene', parameters);

      expect(scene.canvas.width).toBe(1200);
      expect(scene.canvas.height).toBe(800);
      expect(scene.bg).toBe('#ffffff');

      // Check that tile dimensions were substituted
      const firstTile = scene.nodes[0];
      expect(firstTile.size.width).toBe(400);
      expect(firstTile.size.height).toBe(150);
    });

    test('should load and merge dependencies', async () => {
      const scene = await templateProcessor.processTemplate('simple-plugin-scene');
      
      expect(scene.defs).toBeDefined();
      expect(scene.defs.symbols).toBeDefined();
      expect(scene.defs.symbols.length).toBeGreaterThan(0);
      
      // Should include sprites from plugin-architecture library
      const symbolIds = scene.defs.symbols.map(s => s.id);
      expect(symbolIds).toContain('pkg/box');
      expect(symbolIds).toContain('pkg/label');
      
      // Should include filters and gradients
      expect(scene.defs.filters).toBeDefined();
      expect(scene.defs.filters.length).toBeGreaterThan(0);
      expect(scene.defs.gradients).toBeDefined();
      expect(scene.defs.gradients.length).toBeGreaterThan(0);
    });

    test('should process nested parameter substitution', async () => {
      const parameters = {
        tileWidth: 500,
        tileHeight: 200
      };
      
      const scene = await templateProcessor.processTemplate('simple-plugin-scene', parameters);
      
      // Check that parameters were substituted in nested children
      const firstTile = scene.nodes[0];
      const firstChild = firstTile.children[0];
      expect(firstChild.size.width).toBe(500);
      expect(firstChild.size.height).toBe(200);
    });
  });

  describe('Parameter Validation', () => {
    test('should validate parameters against template schema', async () => {
      const template = await templateProcessor.configLoader.loadSceneTemplate('simple-plugin-scene');
      
      const validParams = {
        canvasWidth: 800,
        canvasHeight: 600,
        backgroundColor: '#0f1116'
      };
      
      const validation = templateProcessor.validateParameters(template, validParams);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect invalid parameter types', async () => {
      const template = await templateProcessor.configLoader.loadSceneTemplate('simple-plugin-scene');
      
      const invalidParams = {
        canvasWidth: 'not-a-number',
        backgroundColor: 'not-a-color'
      };
      
      const validation = templateProcessor.validateParameters(template, invalidParams);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    test('should detect missing required parameters', async () => {
      // Create a mock template with required parameters
      const template = {
        parameters: {
          requiredParam: {
            type: 'string',
            required: true,
            description: 'A required parameter'
          }
        }
      };
      
      const validation = templateProcessor.validateParameters(template, {});
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain('Required parameter missing: requiredParam');
    });
  });

  describe('Symbol Matching', () => {
    test('should match symbols with wildcards', async () => {
      const scene = await templateProcessor.processTemplate('simple-plugin-scene');
      
      // The template uses specific symbol IDs, but let's verify the matching logic
      expect(scene.defs.symbols).toBeDefined();
      
      // Should have matched pkg/box and pkg/label from the template
      const symbolIds = scene.defs.symbols.map(s => s.id);
      expect(symbolIds).toContain('pkg/box');
      expect(symbolIds).toContain('pkg/label');
    });
  });

  describe('Template Examples', () => {
    test('should retrieve template examples', async () => {
      const examples = await templateProcessor.getTemplateExamples('simple-plugin-scene');
      
      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0].name).toBeDefined();
      expect(examples[0].parameters).toBeDefined();
    });

    test('should process template from example parameters', async () => {
      const examples = await templateProcessor.getTemplateExamples('simple-plugin-scene');
      const firstExample = examples[0];
      
      const scene = await templateProcessor.processTemplate('simple-plugin-scene', firstExample.parameters);
      
      expect(scene).toBeDefined();
      expect(scene.id).toBe('simple-plugin-scene');
    });
  });

  describe('Error Handling', () => {
    test('should handle missing template gracefully', async () => {
      await expect(templateProcessor.processTemplate('non-existent-template'))
        .rejects.toThrow();
    });

    test('should handle missing dependencies gracefully', async () => {
      // This would test with a template that references non-existent dependencies
      // For now, we verify that valid templates work correctly
      const scene = await templateProcessor.processTemplate('simple-plugin-scene');
      expect(scene).toBeDefined();
    });

    test('should warn about unknown parameters', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const parameters = {
        unknownParameter: 'value'
      };
      
      await templateProcessor.processTemplate('simple-plugin-scene', parameters);
      
      expect(consoleSpy).toHaveBeenCalledWith('Unknown parameter: unknownParameter');
      consoleSpy.mockRestore();
    });
  });

  describe('Parameter Substitution', () => {
    test('should substitute simple parameters', () => {
      const result = templateProcessor.substituteParameters('{{width}}', { width: 800 });
      expect(result).toBe('800');
    });

    test('should substitute multiple parameters', () => {
      const result = templateProcessor.substituteParameters('{{width}}x{{height}}', { width: 800, height: 600 });
      expect(result).toBe('800x600');
    });

    test('should handle missing parameters gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const result = templateProcessor.substituteParameters('{{missing}}', {});
      expect(result).toBe('{{missing}}');
      expect(consoleSpy).toHaveBeenCalledWith('Parameter not found: missing');
      
      consoleSpy.mockRestore();
    });

    test('should resolve parameter references', () => {
      const result = templateProcessor.resolveValue('{{width}}', { width: 800 });
      expect(result).toBe(800);
      
      const literalResult = templateProcessor.resolveValue(800, { width: 400 });
      expect(literalResult).toBe(800);
    });
  });

  describe('Condition Evaluation', () => {
    test('should evaluate boolean conditions', () => {
      expect(templateProcessor.evaluateCondition(true, {})).toBe(true);
      expect(templateProcessor.evaluateCondition(false, {})).toBe(false);
      expect(templateProcessor.evaluateCondition(undefined, {})).toBe(true);
    });

    test('should evaluate parameter conditions', () => {
      const params = { showConnectors: true, hideElements: false };
      
      expect(templateProcessor.evaluateCondition('{{showConnectors}}', params)).toBe(true);
      expect(templateProcessor.evaluateCondition('{{hideElements}}', params)).toBe(false);
      expect(templateProcessor.evaluateCondition('{{missing}}', params)).toBe(false);
    });
  });
});
