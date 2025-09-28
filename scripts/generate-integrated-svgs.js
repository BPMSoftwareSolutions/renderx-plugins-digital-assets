#!/usr/bin/env node
/* JSON-driven SVG generator (Mode A: injector) */
const fs = require('fs');
const path = require('path');
const { generateForElement } = require('./lib/injector');
const { deepMergeElementFromSpec, normalizeElement } = require('./lib/spec-resolver');

const ROOT = process.cwd();
const JSON_PATH = path.join(ROOT, 'assets', 'plugin-architecture', 'plugin-integration-slides.json');
const ASSETS_ROOT = path.join(ROOT, 'assets', 'plugin-architecture');

function parseArgs(argv) {
  const args = { all: false, slide: null, element: null, dryRun: false, verbose: false, resolveRefs: true, validateOnly: false, specRoot: null, strict: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else if (a === '--slide') args.slide = argv[++i];
    else if (a === '--element') args.element = argv[++i];
    else if (a === '--no-resolve-refs') args.resolveRefs = false;
    else if (a === '--validate-only') args.validateOnly = true;
    else if (a === '--spec-root') args.specRoot = argv[++i];
    else if (a === '--strict') args.strict = true;
  }
  return args;
}

function loadSpec() {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  return JSON.parse(raw);
}

function selectTargets(spec, args) {
  let slides = spec.slides || [];
  if (args.slide) slides = slides.filter(s => s.id === args.slide);
  if (!args.all && !args.slide) {
    // Default to slide-01 if unspecified
    slides = slides.filter(s => s.id === 'slide-01-manifest');
  }
  const elements = [];
  slides.forEach(s => {
    (s.elements || []).forEach(el => {
      if (args.element && el.id !== args.element) return;
      if (el.svg && (((el.sub_elements || []).length > 0) || el.spec)) {
        elements.push({ slideId: s.id, element: el });
      }
    });
  });
  return elements;
}

function ensureFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Parent SVG not found: ${filePath}`);
  }
}

function run() {
  const args = parseArgs(process.argv);
  const spec = loadSpec();
  // Default spec root under assets/plugin-architecture/specs if not provided
  args.specRoot = args.specRoot || path.join(ASSETS_ROOT, 'specs');
  const targets = selectTargets(spec, args);
  if (!targets.length) {
    console.error('No targets found. Use --all, --slide <id>, or ensure sub_elements/spec exist.');
    process.exit(1);
  }

  let changed = 0;
  const summaries = [];
  const issues = [];

  targets.forEach(({ slideId, element }) => {
    const parentRel = element.svg; // e.g., slide-01-manifest/plugin-manifest.svg
    const parentPath = path.join(ASSETS_ROOT, parentRel);
    ensureFile(parentPath);

    // Resolve external spec if requested
    let effective = element;
    if (args.resolveRefs && element.spec) {
      effective = deepMergeElementFromSpec(element, { assetsRoot: ASSETS_ROOT, specRoot: args.specRoot });
    }
    // Normalize for generation/validation
    effective = normalizeElement(effective);

    if (args.validateOnly) {
      (effective.sub_elements || []).forEach(sub => {
        const subPath = path.join(ASSETS_ROOT, sub.svg);
        if (!fs.existsSync(subPath)) {
          issues.push({ slideId, elementId: element.id, type: 'missing-file', subId: sub.id, file: sub.svg });
          return;
        }
        const content = fs.readFileSync(subPath, 'utf8');
        const idRe = new RegExp(`id=["']${sub.id}["']`);
        if (!idRe.test(content)) {
          issues.push({ slideId, elementId: element.id, type: 'missing-anchor', subId: sub.id, file: sub.svg });
        }
      });
    } else {
      const orig = fs.readFileSync(parentPath, 'utf8');
      const next = generateForElement(orig, effective);
      if (orig !== next) {
        changed++;
        if (!args.dryRun) fs.writeFileSync(parentPath, next, 'utf8');
      }
      if (args.verbose) {
        summaries.push({ slideId, elementId: element.id, file: parentRel, updated: orig !== next });
      }
    }
  });

  if (args.validateOnly) {
    if (args.verbose) console.log(JSON.stringify({ processed: targets.length, issues }, null, 2));
    if (issues.length && args.strict) {
      console.error(`Validation failed: ${issues.length} issue(s).`);
      process.exit(1);
    } else {
      console.log(`Validated ${targets.length} elements; ${issues.length} issue(s).`);
    }
    return;
  }

  if (args.verbose) {
    console.log(JSON.stringify({ processed: targets.length, changed, details: summaries }, null, 2));
  } else {
    console.log(`Processed ${targets.length} elements; updated ${changed}.`);
  }
}

if (require.main === module) {
  try {
    run();
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
  }
}

