# SVG Rendering Tests

This directory contains automated tests to verify that all plugin architecture SVG elements render properly in Chrome using Cypress.

## Test Structure

### Files
- `browser-svg-render-test.html` - Test page that loads and displays all SVG elements
- `server.js` - Express server to serve test files and assets
- `run-svg-tests.js` - Test runner script that manages server lifecycle
- `svg-rendering.cy.js` - Cypress test specifications

### Test Coverage
- **SVG Loading**: Verifies all SVG files load without errors
- **Rendering Validation**: Checks that SVGs contain proper content and dimensions
- **Accessibility**: Validates SVG accessibility attributes (title, ARIA labels)
- **Visual Regression**: Takes screenshots for visual comparison
- **Responsive Design**: Tests rendering across different viewport sizes
- **Error Handling**: Verifies graceful handling of missing SVG files

## Running Tests

### Prerequisites
```bash
npm install
```

### Quick Test Run
```bash
npm run test:svg
```

### Manual Testing Steps

1. **Start the test server:**
   ```bash
   npm run test:server
   ```

2. **Open Cypress (in another terminal):**
   ```bash
   npm run test:cypress:open
   ```

3. **Run headless tests:**
   ```bash
   npm run test:cypress
   ```

### Individual Commands

- `npm run test:server` - Start the Express server on port 3000
- `npm run test:cypress` - Run Cypress tests headlessly
- `npm run test:cypress:open` - Open Cypress interactive test runner

## Test Results

### Screenshots
Cypress automatically captures screenshots of:
- Individual SVG elements
- Complete slide sections
- Different viewport sizes
- Any test failures

Screenshots are saved to `cypress/screenshots/`

### Videos
Test run videos are saved to `cypress/videos/`

### Reports
Cypress generates detailed test reports showing:
- Pass/fail status for each test
- Performance metrics
- Error details and stack traces

## Current Test Coverage

### Slide 01: Plugin Manifest Creation
- ✅ Plugin Package - Isometric package with sub-elements
- ✅ Plugin Manifest - Document card with JSON structure
- ✅ Handlers Export - Elegant connectors and ports
- ✅ Build Publish - Conveyor system with version tags
- ✅ Host SDK - Console with rails and modules

### Future Slides (Specifications Ready)
- 🔄 Slide 02: Host Registration & Discovery
- 🔄 Slide 03: Events and Topics Integration  
- 🔄 Slide 04: UI Integration
- 🔄 Slide 05: Validation and Testing

## Test Configuration

### Cypress Config (`cypress.config.js`)
- Base URL: `http://localhost:3000`
- Viewport: 1280x720
- Screenshots and videos enabled
- 10 second timeout for commands

### Browser Support
- Primary: Chrome (headless and headed)
- Secondary: Firefox, Edge (can be configured)

## Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

2. **Server won't start:**
   - Check if Node.js is installed
   - Verify all dependencies are installed: `npm install`

3. **SVG files not loading:**
   - Verify SVG files exist in `assets/plugin-architecture/`
   - Check file paths in test configuration

4. **Tests failing:**
   - Check browser console for errors
   - Review Cypress screenshots and videos
   - Verify SVG content is valid

### Debug Mode
Run tests with debug output:
```bash
DEBUG=cypress:* npm run test:cypress
```

## Adding New Tests

### For New SVG Elements
1. Add element definition to `slides` array in `svg-rendering.cy.js`
2. Update test page HTML if needed
3. Run tests to verify new element renders correctly

### For New Test Cases
1. Add new `it()` blocks to `cypress/e2e/svg-rendering.cy.js`
2. Use custom commands from `cypress/support/commands.js`
3. Follow existing patterns for consistency

## Integration with CI/CD

The tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions step
- name: Run SVG Rendering Tests
  run: |
    npm install
    npm run test:svg
```

This ensures SVG rendering is validated on every commit and pull request.
