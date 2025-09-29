import { readFileSync } from 'fs';
import { join } from 'path';
import { ElementSelector, TriggerCondition, makeElementDisappear, makeElementAppear, startElementAnimation, stopElementAnimation } from './svg-animation-utilities';

export interface SceneElementConfig {
  selector: ElementSelector;
}

export interface StopAtConfig {
  selector: ElementSelector;
  offset?: number; // pixels to stop before the target's x (front bumper clearance)
}

export interface TrafficLightConfig {
  redAt: number;   // absolute seconds in combined timeline
  greenAt: number; // absolute seconds in combined timeline
}

export interface SceneConfigEntry {
  startDelay?: number; // absolute begin time for the bus movement in seconds
  exitTime?: number;   // absolute time to fade-out the bus group
  initiallyHidden?: boolean;
  appearDuration?: number; // seconds
  movement?: { dur: number; arriveAt: number; departAt: number; }; // seconds within cycle
  elements: {
    bus: SceneElementConfig;
    trafficLight?: TrafficLightConfig;
    stopAt?: StopAtConfig; // stop bus aligned to this element's x - offset
  };
}

export interface SceneAnimationConfig {
  scenes: Record<string, SceneConfigEntry>;
}

const DATA_DIR = join(__dirname, '..', 'data');
const DEFAULT_CONFIG_FILE = 'scene-animation-config.json';

export function loadAnimationConfig(file: string = DEFAULT_CONFIG_FILE): SceneAnimationConfig {
  const filePath = join(DATA_DIR, file);
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as SceneAnimationConfig;
}

export function applySceneAnimationFromConfig(svgContent: string, sceneNumber: number, config: SceneAnimationConfig): string {
  const entry = config.scenes[String(sceneNumber)];
  if (!entry) return svgContent;

  let out = svgContent;
  const busSelector = entry.elements.bus.selector;

  // If config specifies a physical stop location, align the bus translate path to it
  if (entry.elements.stopAt) {
    const stopX = resolveTargetX(out, entry.elements.stopAt.selector, entry.elements.stopAt.offset ?? 110);
    if (stopX != null) {
      out = alignBusTranslatePath(out, busSelector, stopX);
    }
  }

  // If initiallyHidden, fade-in at startDelay (default 0.3s)
  if (entry.initiallyHidden) {
    const beginAt = typeof entry.startDelay === 'number' ? entry.startDelay : 0;
    out = makeElementAppear(out, busSelector, { type: 'time', value: beginAt, duration: entry.appearDuration ?? 0.3 });
  }

  // Begin bus-related animations at startDelay (if provided)
  if (typeof entry.startDelay === 'number' && entry.startDelay > 0) {
    const beginTrigger: TriggerCondition = { type: 'time', value: entry.startDelay };
    out = startElementAnimation(out, busSelector, beginTrigger);
  }

  // Traffic light coordination: prefer keyTimes normalization over begin/end
  if (entry.elements.trafficLight && entry.movement) {
    const { dur, arriveAt, departAt } = entry.movement;
    const fractions = [0, arriveAt / dur, departAt / dur, 1];
    out = normalizeBusMovementWithKeyTimes(out, busSelector, {
      dur,
      keyTimes: fractions,
      begin: typeof entry.startDelay === 'number' ? `${entry.startDelay}s` : undefined,
    });

    // Wheel spin segments relative to scene timeline, offset by startDelay for combined
    const beginOffset = typeof entry.startDelay === 'number' ? entry.startDelay : 0;
    out = normalizeWheelSpinSegments(out, busSelector, {
      firstBegin: `${0 + beginOffset}s`,
      firstEnd: `${arriveAt + beginOffset}s`,
      secondBegin: `${departAt + beginOffset}s`,
    });
  } else if (entry.elements.trafficLight) {
    // Fallback to old behavior if movement not provided
    const { redAt, greenAt } = entry.elements.trafficLight;
    out = stopElementAnimation(out, busSelector, { type: 'time', value: redAt });
    out = startElementAnimation(out, busSelector, { type: 'time', value: greenAt });
  }

  // Fade out entire bus group at exit time (if provided)
  if (typeof entry.exitTime === 'number') {
    out = makeElementDisappear(out, busSelector, { type: 'time', value: entry.exitTime, duration: 0.5 });
  }

  return out;
}

// --- Helpers: movement normalization ---
function normalizeBusMovementWithKeyTimes(svg: string, busSelector: ElementSelector, opts: { dur: number; keyTimes: number[]; begin?: string; }): string {
  const pattern = createElementRegex(busSelector);
  // Precompute replacement tag
  const fmt = (v: number) => (v === 0 || v === 1 ? String(v) : (Math.round(v * 1000) / 1000).toFixed(3));
  const keyTimesStr = opts.keyTimes.map(fmt).join('; ');
  const beginAttr = opts.begin ? ` begin="${opts.begin}"` : '';
  const replacement = `<animateTransform attributeName="transform" type="translate" values="50,250; 350,250; 350,250; 900,250" keyTimes="${keyTimesStr}" dur="${opts.dur}s" repeatCount="indefinite"${beginAttr}/>`;

  return svg.replace(pattern, (busMatch) => {
    // replace any translate animateTransform (self-closing or paired) with our canonical replacement
    const translateRegex = /<animateTransform[^>]*type="translate"[^>]*\/>|<animateTransform[^>]*type="translate"[^>]*>[\s\S]*?<\/animateTransform>/gi;
    let result = busMatch.replace(translateRegex, replacement);
    // If none existed, insert at top of the bus group
    if (result === busMatch) {
      result = busMatch.replace(/(<[^>]+>)/, `$1${replacement}`);
    }
    return result;
  });
}

function normalizeWheelSpinSegments(svg: string, busSelector: ElementSelector, seg: { firstBegin: string; firstEnd: string; secondBegin: string; }): string {
  const pattern = createElementRegex(busSelector);
  return svg.replace(pattern, (busMatch) => {
    // Find rotate animateTransform inside bus and split into two segments
    return busMatch.replace(/(<animateTransform[^>]*type="rotate"[^>]*)(\/>|>\s*<\/animateTransform>)/gis, (_unused, head) => {
      // remove existing begin/end to avoid conflicts
      let base = head
        .replace(/\sbegin="[^"]*"/ig, '')
        .replace(/\send="[^"]*"/ig, '')
        .replace(/\srepeatCount="[^"]*"/ig, '')
        .replace(/\sdur="[^"]*"/ig, '')
        + ' dur="1s" repeatCount="indefinite"';
      const first = `${base} begin="${seg.firstBegin}" end="${seg.firstEnd}"/>`;
      const second = `${base} begin="${seg.secondBegin}"/>`;
      return first + second;
    });
  });
}

// --- Helpers: positional alignment ---
function resolveTargetX(svgContent: string, selector: ElementSelector, offset: number): number | null {
  // Currently supports id selector for target groups with transform="translate(x,y)"
  if (selector.type === 'id') {
    const id = selector.value.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const re = new RegExp(`<[^>]*id="${id}"[^>]*transform="translate\(([-0-9.]+)\s*,\s*([-0-9.]+)\)"`, 'i');
    const m = svgContent.match(re);
    if (m) {
      const targetX = parseFloat(m[1]);
      if (!isNaN(targetX)) return targetX - offset;
    }
  }
  return null;
}

function alignBusTranslatePath(svgContent: string, busSelector: ElementSelector, stopX: number): string {
  // Find the bus element first
  const busPattern = createElementRegex(busSelector);
  return svgContent.replace(busPattern, (busMatch) => {
    // Inside the bus group, find the translate animateTransform values
    const valuesRe = /<animateTransform[^>]*type="translate"[^>]*values="([^"]+)"/i;
    const vm = busMatch.match(valuesRe);
    if (!vm) return busMatch;

    const original = vm[1];
    const points = original.split(';').map(s => s.trim()).filter(Boolean);
    // Expect at least 4 points: approach; stop; hold; exit
    if (points.length < 2) return busMatch;

    const parsed = points.map(p => p.split(',').map(n => parseFloat(n.trim())) as [number, number]);

    // Build new sequence: keep start, set middle one/two stop segments to stopX, keep exit
    const newPoints = parsed.slice();
    if (newPoints.length >= 4) {
      newPoints[1][0] = stopX; // approach to stop
      newPoints[2][0] = stopX; // hold at stop
    } else if (newPoints.length >= 2) {
      newPoints[1][0] = stopX; // minimal correction
    }

    const newValues = newPoints.map(([xv, yv]) => `${xv},${yv}`).join('; ');
    return busMatch.replace(valuesRe, (m0) => m0.replace(original, newValues));
  });
}

function createElementRegex(selector: ElementSelector): RegExp {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  switch (selector.type) {
    case 'id': {
      const id = esc(selector.value);
      return new RegExp(`<[^>]*id="${id}"[^>]*/>|<[^>]*id="${id}"[^>]*>[\\s\\S]*?<\\/[^>]+>`, 'is');
    }
    case 'class': {
      const cls = esc(selector.value);
      return new RegExp(`<[^>]*class="[^"]*${cls}[^"]*"[^>]*/>|<[^>]*class="[^"]*${cls}[^"]*"[^>]*>[\\s\\S]*?<\\/[^>]+>`, 'is');
    }
    case 'tag':
      return new RegExp(`<${esc(selector.value)}[^>]*/>|<${esc(selector.value)}[^>]*>[\\s\\S]*?<\\/${esc(selector.value)}>`, 'is');
    default:
      return /$^/;
  }
}

