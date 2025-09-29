import { readFileSync } from 'fs';
import { join } from 'path';
import { ElementSelector, TriggerCondition, makeElementDisappear, startElementAnimation, stopElementAnimation } from './svg-animation-utilities';

export interface SceneElementConfig {
  selector: ElementSelector;
}

export interface TrafficLightConfig {
  redAt: number;   // absolute seconds in combined timeline
  greenAt: number; // absolute seconds in combined timeline
}

export interface SceneConfigEntry {
  startDelay?: number; // absolute begin time for the bus movement in seconds
  exitTime?: number;   // absolute time to fade-out the bus group
  elements: {
    bus: SceneElementConfig;
    trafficLight?: TrafficLightConfig;
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

  // Begin bus-related animations at startDelay (if provided)
  if (typeof entry.startDelay === 'number' && entry.startDelay > 0) {
    const beginTrigger: TriggerCondition = { type: 'time', value: entry.startDelay };
    out = startElementAnimation(out, busSelector, beginTrigger);
  }

  // Traffic light coordination (stop at red, resume at green)
  if (entry.elements.trafficLight) {
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

