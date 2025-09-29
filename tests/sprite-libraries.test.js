const fs = require('fs');
const path = require('path');

describe('Sprite Libraries', () => {
  const spriteLibraries = [
    'microservices',
    'data-flow', 
    'network',
    'ui-components',
    'business-process'
  ];

  // Test that all sprite library files exist and are valid JSON
  spriteLibraries.forEach(libraryName => {
    describe(`${libraryName} sprite library`, () => {
      let library;

      beforeAll(() => {
        const libraryPath = path.join(__dirname, '..', 'config', 'sprites', `${libraryName}.json`);
        expect(fs.existsSync(libraryPath)).toBe(true);
        
        const libraryContent = fs.readFileSync(libraryPath, 'utf8');
        library = JSON.parse(libraryContent);
      });

      test('should have required metadata fields', () => {
        expect(library).toHaveProperty('id');
        expect(library).toHaveProperty('name');
        expect(library).toHaveProperty('description');
        expect(library).toHaveProperty('version');
        expect(library).toHaveProperty('categories');
        
        expect(library.id).toBe(libraryName);
        expect(typeof library.name).toBe('string');
        expect(typeof library.description).toBe('string');
        expect(library.version).toBe('1.0.0');
      });

      test('should have valid category structure', () => {
        expect(typeof library.categories).toBe('object');
        expect(Object.keys(library.categories).length).toBeGreaterThan(0);

        Object.entries(library.categories).forEach(([categoryKey, category]) => {
          expect(category).toHaveProperty('name');
          expect(category).toHaveProperty('description');
          expect(category).toHaveProperty('sprites');
          
          expect(typeof category.name).toBe('string');
          expect(typeof category.description).toBe('string');
          expect(typeof category.sprites).toBe('object');
        });
      });

      test('should have valid sprite definitions', () => {
        Object.values(library.categories).forEach(category => {
          Object.entries(category.sprites).forEach(([spriteKey, sprite]) => {
            // Required fields
            expect(sprite).toHaveProperty('id');
            expect(sprite).toHaveProperty('name');
            expect(sprite).toHaveProperty('description');
            expect(sprite).toHaveProperty('svg');
            expect(sprite).toHaveProperty('viewBox');
            expect(sprite).toHaveProperty('defaultSize');
            expect(sprite).toHaveProperty('tags');

            // Field types
            expect(typeof sprite.id).toBe('string');
            expect(typeof sprite.name).toBe('string');
            expect(typeof sprite.description).toBe('string');
            expect(typeof sprite.svg).toBe('string');
            expect(typeof sprite.viewBox).toBe('string');
            expect(Array.isArray(sprite.tags)).toBe(true);

            // Default size structure
            expect(sprite.defaultSize).toHaveProperty('width');
            expect(sprite.defaultSize).toHaveProperty('height');
            expect(typeof sprite.defaultSize.width).toBe('number');
            expect(typeof sprite.defaultSize.height).toBe('number');

            // SVG content validation
            expect(sprite.svg.length).toBeGreaterThan(0);
            expect(sprite.svg).toMatch(/<[^>]+>/); // Contains at least one XML/SVG tag

            // ViewBox format validation
            expect(sprite.viewBox).toMatch(/^\d+\s+\d+\s+\d+\s+\d+$/);

            // Tags validation
            expect(sprite.tags.length).toBeGreaterThan(0);
            sprite.tags.forEach(tag => {
              expect(typeof tag).toBe('string');
              expect(tag.length).toBeGreaterThan(0);
            });
          });
        });
      });

      test('should have consistent sprite ID format', () => {
        Object.values(library.categories).forEach(category => {
          Object.entries(category.sprites).forEach(([spriteKey, sprite]) => {
            // ID should follow category/sprite-name format
            expect(sprite.id).toMatch(/^[a-z-]+\/[a-z-]+$/);
            
            // ID should start with a category that exists in the library
            const idCategory = sprite.id.split('/')[0];
            const categoryKeys = Object.keys(library.categories);
            const categoryExists = categoryKeys.some(key => 
              key === idCategory || 
              key.replace(/[^a-z]/g, '') === idCategory.replace(/[^a-z]/g, '')
            );
            expect(categoryExists).toBe(true);
          });
        });
      });
    });
  });

  // Test specific library content
  describe('microservices library content', () => {
    let library;

    beforeAll(() => {
      const libraryPath = path.join(__dirname, '..', 'config', 'sprites', 'microservices.json');
      library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    });

    test('should have container-related sprites', () => {
      expect(library.categories).toHaveProperty('containers');
      expect(library.categories.containers.sprites).toHaveProperty('docker-container');
      expect(library.categories.containers.sprites).toHaveProperty('kubernetes-pod');
    });

    test('should have API-related sprites', () => {
      expect(library.categories).toHaveProperty('apis');
      expect(library.categories.apis.sprites).toHaveProperty('rest-api');
      expect(library.categories.apis.sprites).toHaveProperty('graphql');
    });
  });

  describe('data-flow library content', () => {
    let library;

    beforeAll(() => {
      const libraryPath = path.join(__dirname, '..', 'config', 'sprites', 'data-flow.json');
      library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    });

    test('should have data source sprites', () => {
      expect(library.categories).toHaveProperty('sources');
      expect(library.categories.sources.sprites).toHaveProperty('file-source');
      expect(library.categories.sources.sprites).toHaveProperty('database-source');
    });

    test('should have transformation sprites', () => {
      expect(library.categories).toHaveProperty('transformations');
      expect(library.categories.transformations.sprites).toHaveProperty('etl-process');
    });
  });

  describe('network library content', () => {
    let library;

    beforeAll(() => {
      const libraryPath = path.join(__dirname, '..', 'config', 'sprites', 'network.json');
      library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    });

    test('should have infrastructure sprites', () => {
      expect(library.categories).toHaveProperty('infrastructure');
      expect(library.categories.infrastructure.sprites).toHaveProperty('router');
      expect(library.categories.infrastructure.sprites).toHaveProperty('firewall');
    });

    test('should have cloud sprites', () => {
      expect(library.categories).toHaveProperty('cloud');
      expect(library.categories.cloud.sprites).toHaveProperty('cloud-region');
    });
  });

  describe('ui-components library content', () => {
    let library;

    beforeAll(() => {
      const libraryPath = path.join(__dirname, '..', 'config', 'sprites', 'ui-components.json');
      library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    });

    test('should have form sprites', () => {
      expect(library.categories).toHaveProperty('forms');
      expect(library.categories.forms.sprites).toHaveProperty('text-input');
      expect(library.categories.forms.sprites).toHaveProperty('button-primary');
    });

    test('should have layout sprites', () => {
      expect(library.categories).toHaveProperty('layout');
      expect(library.categories.layout.sprites).toHaveProperty('header');
      expect(library.categories.layout.sprites).toHaveProperty('card');
    });
  });

  describe('business-process library content', () => {
    let library;

    beforeAll(() => {
      const libraryPath = path.join(__dirname, '..', 'config', 'sprites', 'business-process.json');
      library = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
    });

    test('should have process sprites', () => {
      expect(library.categories).toHaveProperty('processes');
      expect(library.categories.processes.sprites).toHaveProperty('process-task');
    });

    test('should have decision sprites', () => {
      expect(library.categories).toHaveProperty('decisions');
      expect(library.categories.decisions.sprites).toHaveProperty('exclusive-gateway');
    });

    test('should have event sprites', () => {
      expect(library.categories).toHaveProperty('events');
      expect(library.categories.events.sprites).toHaveProperty('start-event');
      expect(library.categories.events.sprites).toHaveProperty('end-event');
    });
  });
});
