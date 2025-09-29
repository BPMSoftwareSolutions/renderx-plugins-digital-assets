const fs = require('fs');
const path = require('path');

describe('Theme System', () => {
  const themes = [
    'dark-plugin',
    'light-professional',
    'high-contrast',
    'blueprint',
    'neon'
  ];

  // Test that all theme files exist and are valid JSON
  themes.forEach(themeName => {
    describe(`${themeName} theme`, () => {
      let theme;

      beforeAll(() => {
        const themePath = path.join(__dirname, '..', 'config', 'themes', `${themeName}.json`);
        expect(fs.existsSync(themePath)).toBe(true);
        
        const themeContent = fs.readFileSync(themePath, 'utf8');
        theme = JSON.parse(themeContent);
      });

      test('should have required metadata fields', () => {
        expect(theme).toHaveProperty('id');
        expect(theme).toHaveProperty('name');
        expect(theme).toHaveProperty('description');
        expect(theme).toHaveProperty('version');
        
        expect(theme.id).toBe(themeName);
        expect(typeof theme.name).toBe('string');
        expect(typeof theme.description).toBe('string');
        expect(theme.version).toBe('1.0.0');
      });

      test('should have valid color palette', () => {
        expect(theme).toHaveProperty('colors');
        expect(typeof theme.colors).toBe('object');

        // Required base colors
        const requiredColors = [
          'primary', 'secondary', 'background', 'surface', 
          'text', 'textSecondary', 'border', 'accent',
          'success', 'warning', 'error'
        ];

        requiredColors.forEach(colorKey => {
          expect(theme.colors).toHaveProperty(colorKey);
          expect(typeof theme.colors[colorKey]).toBe('string');
          expect(theme.colors[colorKey]).toMatch(/^#[0-9a-fA-F]{6}$/);
        });

        // Custom colors should be an object
        if (theme.colors.custom) {
          expect(typeof theme.colors.custom).toBe('object');
          Object.values(theme.colors.custom).forEach(color => {
            expect(typeof color).toBe('string');
            expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
          });
        }
      });

      test('should have valid typography settings', () => {
        expect(theme).toHaveProperty('typography');
        expect(typeof theme.typography).toBe('object');

        expect(theme.typography).toHaveProperty('fontFamily');
        expect(typeof theme.typography.fontFamily).toBe('string');

        expect(theme.typography).toHaveProperty('fontSize');
        expect(typeof theme.typography.fontSize).toBe('object');
        
        const requiredFontSizes = ['xs', 'sm', 'base', 'lg', 'xl', 'xxl'];
        requiredFontSizes.forEach(size => {
          expect(theme.typography.fontSize).toHaveProperty(size);
          expect(typeof theme.typography.fontSize[size]).toBe('number');
          expect(theme.typography.fontSize[size]).toBeGreaterThan(0);
        });

        expect(theme.typography).toHaveProperty('fontWeight');
        expect(typeof theme.typography.fontWeight).toBe('object');

        expect(theme.typography).toHaveProperty('lineHeight');
        expect(typeof theme.typography.lineHeight).toBe('object');
      });

      test('should have valid spacing system', () => {
        expect(theme).toHaveProperty('spacing');
        expect(typeof theme.spacing).toBe('object');

        const requiredSpacing = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'];
        requiredSpacing.forEach(size => {
          expect(theme.spacing).toHaveProperty(size);
          expect(typeof theme.spacing[size]).toBe('number');
          expect(theme.spacing[size]).toBeGreaterThan(0);
        });
      });

      test('should have valid border settings', () => {
        expect(theme).toHaveProperty('borders');
        expect(typeof theme.borders).toBe('object');

        expect(theme.borders).toHaveProperty('radius');
        expect(theme.borders).toHaveProperty('width');

        const requiredRadius = ['none', 'sm', 'md', 'lg', 'full'];
        requiredRadius.forEach(size => {
          expect(theme.borders.radius).toHaveProperty(size);
          expect(typeof theme.borders.radius[size]).toBe('number');
          expect(theme.borders.radius[size]).toBeGreaterThanOrEqual(0);
        });

        const requiredWidths = ['thin', 'normal', 'thick'];
        requiredWidths.forEach(width => {
          expect(theme.borders.width).toHaveProperty(width);
          expect(typeof theme.borders.width[width]).toBe('number');
          expect(theme.borders.width[width]).toBeGreaterThan(0);
        });
      });

      test('should have valid shadow definitions', () => {
        expect(theme).toHaveProperty('shadows');
        expect(typeof theme.shadows).toBe('object');

        const requiredShadows = ['none', 'sm', 'md', 'lg', 'xl'];
        requiredShadows.forEach(shadow => {
          expect(theme.shadows).toHaveProperty(shadow);
          expect(typeof theme.shadows[shadow]).toBe('string');
        });
      });

      test('should have valid effects settings', () => {
        expect(theme).toHaveProperty('effects');
        expect(typeof theme.effects).toBe('object');

        expect(theme.effects).toHaveProperty('opacity');
        expect(theme.effects).toHaveProperty('blur');

        const requiredOpacity = ['disabled', 'muted', 'subtle'];
        requiredOpacity.forEach(opacity => {
          expect(theme.effects.opacity).toHaveProperty(opacity);
          expect(typeof theme.effects.opacity[opacity]).toBe('number');
          expect(theme.effects.opacity[opacity]).toBeGreaterThan(0);
          expect(theme.effects.opacity[opacity]).toBeLessThanOrEqual(1);
        });

        const requiredBlur = ['sm', 'md', 'lg'];
        requiredBlur.forEach(blur => {
          expect(theme.effects.blur).toHaveProperty(blur);
          expect(typeof theme.effects.blur[blur]).toBe('number');
          expect(theme.effects.blur[blur]).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  // Test theme-specific features
  describe('light-professional theme specifics', () => {
    let theme;

    beforeAll(() => {
      const themePath = path.join(__dirname, '..', 'config', 'themes', 'light-professional.json');
      theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
    });

    test('should have corporate branding section', () => {
      expect(theme).toHaveProperty('branding');
      expect(theme.branding).toHaveProperty('description');
      expect(theme.branding).toHaveProperty('useCases');
      expect(theme.branding).toHaveProperty('guidelines');
      expect(Array.isArray(theme.branding.useCases)).toBe(true);
    });

    test('should use professional color palette', () => {
      expect(theme.colors.background).toBe('#ffffff');
      expect(theme.colors.text).toBe('#1e293b');
      expect(theme.colors.custom).toHaveProperty('corporateBlue');
    });
  });

  describe('high-contrast theme specifics', () => {
    let theme;

    beforeAll(() => {
      const themePath = path.join(__dirname, '..', 'config', 'themes', 'high-contrast.json');
      theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
    });

    test('should have accessibility section', () => {
      expect(theme).toHaveProperty('accessibility');
      expect(theme.accessibility).toHaveProperty('description');
      expect(theme.accessibility).toHaveProperty('features');
      expect(theme.accessibility).toHaveProperty('useCases');
      expect(theme.accessibility).toHaveProperty('guidelines');
    });

    test('should use high contrast colors', () => {
      expect(theme.colors.primary).toBe('#000000');
      expect(theme.colors.background).toBe('#ffffff');
      expect(theme.borders.width.thin).toBeGreaterThanOrEqual(2);
    });
  });

  describe('blueprint theme specifics', () => {
    let theme;

    beforeAll(() => {
      const themePath = path.join(__dirname, '..', 'config', 'themes', 'blueprint.json');
      theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
    });

    test('should have technical section', () => {
      expect(theme).toHaveProperty('technical');
      expect(theme.technical).toHaveProperty('description');
      expect(theme.technical).toHaveProperty('features');
      expect(theme.technical).toHaveProperty('guidelines');
    });

    test('should have patterns for technical drawings', () => {
      expect(theme).toHaveProperty('patterns');
      expect(theme.patterns).toHaveProperty('grid');
      expect(theme.patterns).toHaveProperty('hatching');
    });

    test('should use monospace font', () => {
      expect(theme.typography.fontFamily).toMatch(/mono/i);
    });
  });

  describe('neon theme specifics', () => {
    let theme;

    beforeAll(() => {
      const themePath = path.join(__dirname, '..', 'config', 'themes', 'neon.json');
      theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
    });

    test('should have cyberpunk section', () => {
      expect(theme).toHaveProperty('cyberpunk');
      expect(theme.cyberpunk).toHaveProperty('description');
      expect(theme.cyberpunk).toHaveProperty('features');
      expect(theme.cyberpunk).toHaveProperty('colorCombinations');
    });

    test('should have glow effects', () => {
      expect(theme.effects).toHaveProperty('glow');
      expect(theme.effects.glow).toHaveProperty('sm');
      expect(theme.effects.glow).toHaveProperty('md');
      expect(theme.effects.glow).toHaveProperty('lg');
      expect(theme.effects.glow).toHaveProperty('xl');
    });

    test('should have animations', () => {
      expect(theme).toHaveProperty('animations');
      expect(theme.animations).toHaveProperty('pulse');
      expect(theme.animations).toHaveProperty('flicker');
    });

    test('should use neon colors', () => {
      expect(theme.colors.primary).toBe('#ff00ff');
      expect(theme.colors.secondary).toBe('#00ffff');
      expect(theme.colors.background).toBe('#0a0a0a');
    });
  });
});
