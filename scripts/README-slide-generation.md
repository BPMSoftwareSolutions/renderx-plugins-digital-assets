# Slide SVG Generation Script

This script generates complete slide-level SVG files by combining individual element SVGs with proper positioning and layout.

## Overview

The `generate-slide-svgs.js` script:

1. **Reads slide definitions** from `plugin-integration-slides.json`
2. **Calculates element layouts** using a grid-based positioning system
3. **Updates JSON coordinates** for each element within slides
4. **Generates slide SVG files** that combine all elements with proper positioning
5. **Creates complete slide visualizations** with titles, backgrounds, and element composition

## Usage

### Basic Usage

```bash
# Generate all slide SVGs
node scripts/generate-slide-svgs.js

# Generate specific slide
node scripts/generate-slide-svgs.js --slide slide-01-manifest

# Update coordinates in JSON and generate SVGs
node scripts/generate-slide-svgs.js --update-coords

# Dry run to see what would be generated
node scripts/generate-slide-svgs.js --dry-run --verbose
```

### Command Line Options

| Option | Description |
|--------|-------------|
| `--slide <id>` | Generate SVG for specific slide (e.g., `slide-01-manifest`) |
| `--update-coords` | Update element compose coordinates in JSON file |
| `--dry-run` | Show what would be generated without writing files |
| `-v, --verbose` | Show detailed output including coordinates |
| `--help` | Show help message |

### Examples

```bash
# Generate slide-01-manifest with coordinate updates
node scripts/generate-slide-svgs.js --slide slide-01-manifest --update-coords -v

# Update all slide coordinates and generate SVGs
node scripts/generate-slide-svgs.js --update-coords --verbose

# Preview what would be generated for all slides
node scripts/generate-slide-svgs.js --dry-run --verbose
```

## How It Works

### 1. Element Layout Calculation

The script uses a **grid-based layout system**:

- **Grid Size**: Automatically calculated based on number of elements (e.g., 3x2 for 5 elements)
- **Slide Dimensions**: 1200x800 pixels with 50px margins
- **Element Size**: 420x140 pixels (standard element dimensions)
- **Positioning**: Elements are centered within their grid cells

### 2. Coordinate System

**Slide Coordinates** (added to main elements):
```json
{
  "id": "plugin-package",
  "compose": {
    "x": 23,
    "y": 155,
    "width": 420,
    "height": 140
  }
}
```

**Sub-element Coordinates** (existing, used for template-exact generation):
```json
{
  "id": "package-box",
  "compose": { "x": 0, "y": 0 }
}
```

### 3. SVG Generation Process

1. **Load slide definition** from JSON
2. **Calculate element positions** using grid layout
3. **Read individual element SVGs** from their file paths
4. **Extract SVG content** (everything between `<svg>` tags)
5. **Wrap in positioned groups** with `transform="translate(x,y)"`
6. **Combine into slide SVG** with title, background, and elements

### 4. Output Structure

Generated slide SVGs have this structure:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <title>Phase 1: Plugin Scaffolding & Manifest</title>
  <desc>Start by scaffolding the plugin package...</desc>
  
  <!-- Slide background -->
  <rect width="100%" height="100%" fill="#FAFAFA"/>
  
  <!-- Slide title -->
  <text x="600" y="40" text-anchor="middle" ...>Phase 1: Plugin Scaffolding & Manifest</text>
  
  <!-- Elements -->
  <g id="plugin-package" transform="translate(23,155)" data-element="Plugin Package">
    <!-- Plugin Package SVG content -->
  </g>
  
  <g id="plugin-manifest" transform="translate(390,155)" data-element="Plugin Manifest">
    <!-- Plugin Manifest SVG content -->
  </g>
  
  <!-- ... more elements ... -->
</svg>
```

## Generated Files

### Slide SVG Files

The script generates these slide-level SVG files:

- `assets/plugin-architecture/slide-01-manifest.svg` ✅ **Complete** (with detailed sub-elements)
- `assets/plugin-architecture/slide-02-discovery.svg` ⏳ **Basic** (simple element SVGs)
- `assets/plugin-architecture/slide-03-events.svg` ⏳ **Basic** (simple element SVGs)
- `assets/plugin-architecture/slide-04-ui.svg` ⏳ **Basic** (simple element SVGs)
- `assets/plugin-architecture/slide-05-quality.svg` ⏳ **Basic** (simple element SVGs)

### Updated JSON Structure

The script updates `plugin-integration-slides.json` to add `compose` coordinates to main elements:

```json
{
  "elements": [
    {
      "id": "plugin-package",
      "label": "Plugin Package",
      "svg": "slide-01-manifest/plugin-package.svg",
      "compose": {
        "x": 23,
        "y": 155,
        "width": 420,
        "height": 140
      },
      "sub_elements": [...]
    }
  ]
}
```

## Integration with Existing Tools

### Template-Exact Generation

The slide generation works alongside the existing element generation:

```bash
# 1. Generate individual element SVGs (with sub-elements)
node scripts/generate-integrated-svgs.js --slide slide-01-manifest --template-exact

# 2. Generate slide-level SVG (combining elements)
node scripts/generate-slide-svgs.js --slide slide-01-manifest --update-coords
```

### Testing Integration

The slide generation includes comprehensive tests:

```bash
# Run slide generation tests
npm test -- tests/slide-generation.test.js
```

## Viewing Results

### Individual Slides

Open any generated slide SVG directly:
- `file:///path/to/assets/plugin-architecture/slide-01-manifest.svg`

### All Slides Overview

Use the generated index page:
- `file:///path/to/assets/plugin-architecture/index.html`

### Browser Test Page

Use the existing element test page:
- `http://localhost:3000/tests/browser-svg-render-test.html`

## Configuration

### Slide Dimensions

```javascript
const SLIDE_WIDTH = 1200;   // Slide width in pixels
const SLIDE_HEIGHT = 800;   // Slide height in pixels
```

### Element Dimensions

```javascript
const ELEMENT_WIDTH = 420;   // Standard element width
const ELEMENT_HEIGHT = 140;  // Standard element height
```

### Layout Margins

```javascript
const availableWidth = SLIDE_WIDTH - 100;   // 50px margin each side
const availableHeight = SLIDE_HEIGHT - 100; // 50px margin top/bottom
```

## Future Enhancements

1. **Custom Layout Templates** - Support different layout patterns beyond grid
2. **Element Scaling** - Automatically scale elements to fit better
3. **Interactive Elements** - Add click handlers for element navigation
4. **Animation Support** - Generate animated slide transitions
5. **Export Formats** - Support PNG, PDF export options

## Troubleshooting

### Missing Element SVGs

If element SVG files don't exist, the script will:
- Log a warning: `Warning: Element SVG not found: path/to/element.svg`
- Skip the missing element
- Continue generating the slide with available elements

### Invalid SVG Content

If an element SVG has invalid format:
- Log a warning: `Warning: Invalid SVG format in path/to/element.svg`
- Skip the problematic element
- Continue with remaining elements

### Coordinate Conflicts

If coordinates aren't updating properly:
- Check file permissions on `plugin-integration-slides.json`
- Verify JSON structure is valid
- Use `--verbose` flag to see detailed coordinate updates
