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

Externalized element specs
- Elements can reference external JSON via `spec`, e.g. `"spec": "specs/slide-01-manifest/plugin-manifest.json"`.
- External specs are deep-merged with inline element data; inline values override spec values when keys overlap (e.g., compose overrides).
- Default spec root: `assets/plugin-architecture/specs` (override with `--spec-root`).

Validation and resolver flags
- `--validate-only`: resolve refs and validate files/anchors without writing SVGs
- `--strict`: with validate-only, exit non-zero if any issues are found
- `--no-resolve-refs`: disable spec resolution (on by default)
- `--spec-root <dir>`: set alternate spec root

Examples
- Validate slide 01 only: `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --validate-only --strict -v`
- Generate with refs resolved for a single element: `node scripts/generate-integrated-svgs.js --slide slide-01-manifest --element plugin-manifest`


Related tests
- `tests/generator.injector.test.js` verifies href composition, injection, namespaces, and idempotency.
