// mono-graph-types.ts
import type { Scene, Node, Connector, Flow, Port } from './scene';

/**
 * Mono scene timing configuration (different from SceneTimingConfig)
 */
export interface MonoSceneTiming {
  sceneStart: number; // when this scene becomes active (seconds)
  sceneDuration: number; // how long scene stays active
  busArrival: number; // when bus arrives in this scene
  busDeparture: number; // when bus leaves this scene
}

/**
 * Extended scene type for mono graph with seamless bus travel
 */
export interface MonoScene extends Omit<Scene, 'timing'> {
  // Scene positioning within the mono graph
  position: {
    x: number;
    y: number;
  };

  // Bus travel configuration for this scene
  busTravel: {
    entryPoint: { x: number; y: number };
    exitPoint: { x: number; y: number };
    duration: number; // seconds
    path?: string; // SVG path for custom routing
  };

  // Scene-specific timing (different from SceneTimingConfig)
  timing: MonoSceneTiming;
}

/**
 * Mono graph configuration that combines multiple scenes
 */
export interface MonoGraph {
  id: string;
  title: string;
  canvas: {
    width: number;
    height: number;
  };
  bg?: string;
  
  // Global definitions shared across all scenes
  defs?: {
    symbols?: Array<{ id: string; svg: string }>;
    filters?: string[];
    gradients?: string[];
    rawSvg?: string[];
  };
  
  // Individual scenes with positioning and timing
  scenes: MonoScene[];
  
  // Global bus configuration
  bus: {
    id: string;
    sprite: string; // SVG markup for the bus
    totalJourneyDuration: number; // total animation duration
    speed: number; // pixels per second
    size: { width: number; height: number };
    enabled: boolean; // whether to show the unified bus
  };
  
  // Connection paths between scenes
  connections: Array<{
    id: string;
    fromScene: string;
    toScene: string;
    path: string; // SVG path connecting scenes
    duration: number; // travel time between scenes
  }>;
  
  // Global timeline configuration
  timeline: {
    totalDuration: number;
    loop: boolean;
    autoPlay: boolean;
  };
  
  // Optional cinematic configuration for Phase 2
  cinematic?: {
    enabled: boolean;
    transitions: Array<{
      type: 'fade' | 'slide' | 'zoom' | 'custom';
      duration: number;
      easing?: string;
      direction?: 'left' | 'right' | 'up' | 'down';
    }>;
    sceneViewport: {
      width: number;
      height: number;
      scale?: number;
    };
    controls: {
      showProgress: boolean;
      allowManualNavigation: boolean;
      pauseResume: boolean;
    };
  };
}

/**
 * Bus state at any point in time
 */
export interface BusState {
  position: { x: number; y: number };
  currentScene: string | null;
  isTransitioning: boolean;
  progress: number; // 0-1 through total journey
  direction: number; // rotation in degrees
}

/**
 * Scene layout configuration for different arrangements
 */
export interface SceneLayout {
  type: 'linear' | 'grid' | 'circular' | 'custom';
  
  // For linear layout
  direction?: 'horizontal' | 'vertical';
  spacing?: number;
  
  // For grid layout
  cols?: number;
  rows?: number;
  gutterX?: number;
  gutterY?: number;
  
  // For circular layout
  radius?: number;
  startAngle?: number;
  
  // For custom layout
  positions?: Array<{ x: number; y: number }>;
}

/**
 * Animation timeline for coordinating all scene animations
 */
export interface AnimationTimeline {
  keyframes: Array<{
    time: number; // seconds
    sceneId: string;
    action: 'enter' | 'exit' | 'highlight' | 'custom';
    properties?: Record<string, any>;
  }>;
  
  busKeyframes: Array<{
    time: number;
    position: { x: number; y: number };
    sceneId: string;
    action?: 'arrive' | 'depart' | 'stop' | 'continue';
  }>;
}
