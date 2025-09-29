const fs = require('fs');
const path = require('path');

describe('Template Exactness Validation', () => {
  test('build-publish generated SVG should contain exact visual elements from template', () => {
    const templatePath = path.join(__dirname, '../assets/plugin-architecture/slide-01-manifest/build-publish - template.svg');
    const generatedPath = path.join(__dirname, '../assets/plugin-architecture/slide-01-manifest/build-publish.svg');
    
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const generatedContent = fs.readFileSync(generatedPath, 'utf8');
    
    // Extract visual elements from template (excluding SVG wrapper and comments)
    const templateElements = templateContent
      .split('\n')
      .filter(line => line.trim())
      .filter(line => !line.includes('<svg') && !line.includes('</svg>') && !line.includes('<!--'))
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    // Verify each template element exists in generated content
    templateElements.forEach(element => {
      expect(generatedContent).toContain(element.trim());
    });
    
    // Verify specific key elements are present
    expect(generatedContent).toContain('Build &amp; Publish');
    expect(generatedContent).toContain('rect x="40" y="88" width="340" height="22"'); // Conveyor belt
    expect(generatedContent).toContain('rect x="80" y="62" width="36" height="22"'); // Module 1
    expect(generatedContent).toContain('text x="168" y="54"'); // Version 1.0.0
    expect(generatedContent).toContain('text x="238" y="54"'); // Version 1.1.0
    expect(generatedContent).toContain('path d="M330,86 L330,42"'); // Uplink arrow
    expect(generatedContent).toContain('polygon points="330,32 324,44 336,44"'); // Arrow head
    
    // Verify data-driven structure is present
    expect(generatedContent).toContain('data-sub-id="conveyor"');
    expect(generatedContent).toContain('data-sub-id="staging-pad"');
    expect(generatedContent).toContain('data-sub-id="version-tags"');
    expect(generatedContent).toContain('data-sub-id="uplink-arrow"');
  });
});
