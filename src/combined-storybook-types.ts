// combined-storybook-types.ts
import type { Scene, SceneTimingConfig } from './scene';

/**
 * Enhanced scene information for combined storybook with animation coordination
 */
export interface EnhancedSceneInfo {
  sceneNumber: number;
  title: string;
  configFile: string;
  svgFile: string;
  timing: SceneTimingConfig;
  position: {
    x: number;
    y: number;
  };
  busTravel: {
    entryPoint: { x: number; y: number };
    exitPoint: { x: number; y: number };
    path?: string; // Optional custom SVG path for bus travel
  };
}

/**
 * Combined storybook configuration with coordinated animations
 */
export interface CombinedStorybookConfig {
  id: string;
  title: string;
  canvas: {
    width: number;
    height: number;
  };
  layout: {
    cols: number;
    rows: number;
    sceneWidth: number;
    sceneHeight: number;
    padding: number;
    headerHeight: number;
  };
  timing: {
    totalDuration: number; // Total journey duration in seconds
    sceneDuration: number; // Default duration per scene
    transitionDuration: number; // Default transition duration between scenes
    loop: boolean;
    autoPlay: boolean;
  };
  scenes: EnhancedSceneInfo[];
  bus: {
    sprite: string; // SVG markup for the unified bus
    size: { width: number; height: number };
    speed: number; // pixels per second
    enabled: boolean;
  };
  controls?: {
    showProgress: boolean;
    allowPlayPause: boolean;
    allowSceneNavigation: boolean;
    showSceneHighlighting: boolean;
  };
}

/**
 * Animation keyframe for coordinated scene transitions
 */
export interface AnimationKeyframe {
  time: number; // seconds
  sceneId: string;
  action: 'enter' | 'exit' | 'highlight' | 'dim' | 'bus-enter' | 'bus-exit';
  properties?: Record<string, any>;
}

/**
 * Bus animation keyframe for seamless travel
 */
export interface BusAnimationKeyframe {
  time: number; // seconds
  position: { x: number; y: number };
  sceneId: string;
  action: 'arrive' | 'depart' | 'stop' | 'continue';
  rotation?: number; // degrees for bus orientation
}

/**
 * Complete animation timeline for the combined storybook
 */
export interface CombinedStorybookTimeline {
  totalDuration: number;
  sceneKeyframes: AnimationKeyframe[];
  busKeyframes: BusAnimationKeyframe[];
  connectionPaths?: Array<{
    fromScene: number;
    toScene: number;
    path: string; // SVG path for visual connection
    duration: number;
  }>;
}
