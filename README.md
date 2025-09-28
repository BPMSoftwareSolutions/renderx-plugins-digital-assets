# renderx-plugins-digital-assets
Digital assets (SVGs, images, movies) for RenderX


## JSON-driven SVG Generator
Automates composition of integrated SVG elements from the JSON spec at `assets/plugin-architecture/plugin-integration-slides.json`.

- Generate all slide element SVGs:
  - `node scripts/generate-integrated-svgs.js --all`
- Generate for a specific slide:
  - `node scripts/generate-integrated-svgs.js --slide slide-01-manifest`
- Filter to a specific element within a slide:
  - `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --element plugin-manifest`
- Dry run and verbose:
  - `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --dry-run --verbose`

Notes
- Non-destructive: manages only the `<g id="sub-elements">` group in parent SVGs and ensures root namespaces.
- Idempotent: running repeatedly yields no diff.
- Added npm script: `npm run build:svgs`.

Related tests
- `tests/generator.injector.test.js` verifies href composition, injection, namespaces, and idempotency.
