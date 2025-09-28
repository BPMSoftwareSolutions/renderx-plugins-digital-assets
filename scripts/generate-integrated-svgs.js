#!/usr/bin/env node
/* JSON-driven SVG generator (Mode A: injector) */
const fs = require('fs');
const path = require('path');
const { generateForElement } = require('./lib/injector');

const ROOT = process.cwd();
const JSON_PATH = path.join(ROOT, 'assets', 'plugin-architecture', 'plugin-integration-slides.json');
const ASSETS_ROOT = path.join(ROOT, 'assets', 'plugin-architecture');

function parseArgs(argv) {
  const args = { all: false, slide: null, element: null, dryRun: false, verbose: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--verbose' || a === '-v') args.verbose = true;
    else if (a === '--slide') args.slide = argv[++i];
    else if (a === '--element') args.element = argv[++i];
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
      if (el.svg && el.sub_elements && el.sub_elements.length) {
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
  const targets = selectTargets(spec, args);
  if (!targets.length) {
    console.error('No targets found. Use --all, --slide <id>, or ensure sub_elements exist.');
    process.exit(1);
  }

  let changed = 0;
  const summaries = [];

  targets.forEach(({ slideId, element }) => {
    const parentRel = element.svg; // e.g., slide-01-manifest/plugin-manifest.svg
    const parentPath = path.join(ASSETS_ROOT, parentRel);
    ensureFile(parentPath);

    const orig = fs.readFileSync(parentPath, 'utf8');
    const next = generateForElement(orig, element);

    if (orig !== next) {
      changed++;
      if (!args.dryRun) fs.writeFileSync(parentPath, next, 'utf8');
    }

    if (args.verbose) {
      summaries.push({ slideId, elementId: element.id, file: parentRel, updated: orig !== next });
    }
  });

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

