/* Spec resolver for external element JSON files */
const fs = require('fs');
const path = require('path');

function byId(arr = []) {
  const map = new Map();
  arr.forEach(x => { if (x && x.id) map.set(x.id, x); });
  return map;
}

function mergeCompose(base = {}, override = {}) {
  const out = { ...base };
  if (override && typeof override === 'object') {
    if (typeof override.x === 'number') out.x = override.x;
    if (typeof override.y === 'number') out.y = override.y;
  }
  return out;
}

function mergeSubElements(specSubs = [], inlineSubs = []) {
  const specMap = byId(specSubs);
  const inlineMap = byId(inlineSubs);
  const ids = new Set([...specMap.keys(), ...inlineMap.keys()]);
  const result = [];
  ids.forEach(id => {
    const specItem = specMap.get(id) || {};
    const inlineItem = inlineMap.get(id) || {};
    const merged = {
      ...specItem,
      ...inlineItem,
      compose: mergeCompose(specItem.compose, inlineItem.compose),
    };
    result.push(merged);
  });
  return result;
}

function loadSpecFile(specPathAbs) {
  const raw = fs.readFileSync(specPathAbs, 'utf8');
  return JSON.parse(raw);
}

function deepMergeElementFromSpec(element, options) {
  const { assetsRoot, specRoot } = options;
  const specRel = element.spec;
  if (!specRel) return element;
  const specAbs = path.isAbsolute(specRel) ? specRel : path.join(assetsRoot, specRel);
  const specObj = loadSpecFile(specAbs);

  const merged = { ...specObj, ...element };
  merged.sub_elements = mergeSubElements(specObj.sub_elements || [], element.sub_elements || []);
  return merged;
}

function normalizeElement(element) {
  // Ensure shape has sub_elements array and compose defaults, preserving transform fields
  const subs = (element.sub_elements || []).map(s => {
    const c = { ...(s.compose || {}) };
    if (typeof c.x !== 'number') c.x = 0;
    if (typeof c.y !== 'number') c.y = 0;
    return { ...s, compose: c };
  });
  return { ...element, sub_elements: subs };
}

module.exports = {
  deepMergeElementFromSpec,
  normalizeElement,
};

