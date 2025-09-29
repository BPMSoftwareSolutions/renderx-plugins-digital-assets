// animation-coordinator.ts
import type { 
  CombinedStorybookConfig, 
  EnhancedSceneInfo, 
  AnimationKeyframe, 
  BusAnimationKeyframe,
  CombinedStorybookTimeline 
} from './combined-storybook-types';

/**
 * Animation Coordinator for Combined Storybook
 * 
 * Manages scene-by-scene animation triggers and bus travel coordination
 */

/**
 * Calculate timing configuration for all scenes based on total duration
 */
export function calculateSceneTiming(
  scenes: EnhancedSceneInfo[], 
  totalDuration: number, 
  transitionDuration: number = 2
): EnhancedSceneInfo[] {
  const sceneCount = scenes.length;
  const sceneDuration = (totalDuration - (transitionDuration * (sceneCount - 1))) / sceneCount;
  
  return scenes.map((scene, index) => {
    const startTime = index * (sceneDuration + transitionDuration);
    const busEnterTime = startTime + 0.5; // Bus enters 0.5s after scene starts
    const busExitTime = startTime + sceneDuration - 0.5; // Bus exits 0.5s before scene ends
    
    return {
      ...scene,
      timing: {
        startTime,
        duration: sceneDuration,
        busEnterTime,
        busExitTime,
        transitionDuration
      }
    };
  });
}

/**
 * Generate scene animation keyframes for coordinated transitions
 */
export function generateSceneKeyframes(scenes: EnhancedSceneInfo[]): AnimationKeyframe[] {
  const keyframes: AnimationKeyframe[] = [];
  
  scenes.forEach((scene, index) => {
    const { timing } = scene;
    
    // Scene enter keyframe
    keyframes.push({
      time: timing.startTime,
      sceneId: scene.configFile,
      action: 'enter',
      properties: { opacity: 1, highlight: true }
    });
    
    // Scene highlight keyframe (when bus arrives)
    keyframes.push({
      time: timing.busEnterTime,
      sceneId: scene.configFile,
      action: 'highlight',
      properties: { borderColor: '#8b5cf6', borderWidth: 3 }
    });
    
    // Scene dim keyframe (when bus leaves)
    keyframes.push({
      time: timing.busExitTime,
      sceneId: scene.configFile,
      action: 'dim',
      properties: { opacity: 0.7, highlight: false }
    });
    
    // Scene exit keyframe
    if (index < scenes.length - 1) { // Don't exit the last scene
      keyframes.push({
        time: timing.startTime + timing.duration,
        sceneId: scene.configFile,
        action: 'exit',
        properties: { opacity: 0.5 }
      });
    }
  });
  
  return keyframes.sort((a, b) => a.time - b.time);
}

/**
 * Generate bus animation keyframes for seamless travel
 */
export function generateBusKeyframes(scenes: EnhancedSceneInfo[]): BusAnimationKeyframe[] {
  const keyframes: BusAnimationKeyframe[] = [];
  
  scenes.forEach((scene, index) => {
    const { timing, busTravel, position } = scene;
    
    // Bus arrival keyframe
    keyframes.push({
      time: timing.busEnterTime,
      position: {
        x: position.x + busTravel.entryPoint.x,
        y: position.y + busTravel.entryPoint.y
      },
      sceneId: scene.configFile,
      action: 'arrive'
    });
    
    // Bus departure keyframe
    keyframes.push({
      time: timing.busExitTime,
      position: {
        x: position.x + busTravel.exitPoint.x,
        y: position.y + busTravel.exitPoint.y
      },
      sceneId: scene.configFile,
      action: 'depart'
    });
    
    // Add transition keyframe to next scene if not the last scene
    if (index < scenes.length - 1) {
      const nextScene = scenes[index + 1];
      const transitionTime = timing.busExitTime + (timing.transitionDuration / 2);
      
      keyframes.push({
        time: transitionTime,
        position: {
          x: nextScene.position.x + nextScene.busTravel.entryPoint.x,
          y: nextScene.position.y + nextScene.busTravel.entryPoint.y
        },
        sceneId: nextScene.configFile,
        action: 'continue'
      });
    }
  });
  
  return keyframes.sort((a, b) => a.time - b.time);
}

/**
 * Create complete animation timeline for the combined storybook
 */
export function createAnimationTimeline(config: CombinedStorybookConfig): CombinedStorybookTimeline {
  const scenesWithTiming = calculateSceneTiming(
    config.scenes, 
    config.timing.totalDuration, 
    config.timing.transitionDuration
  );
  
  const sceneKeyframes = generateSceneKeyframes(scenesWithTiming);
  const busKeyframes = generateBusKeyframes(scenesWithTiming);
  
  return {
    totalDuration: config.timing.totalDuration,
    sceneKeyframes,
    busKeyframes,
    connectionPaths: generateConnectionPaths(scenesWithTiming)
  };
}

/**
 * Generate connection paths between scenes for visual continuity
 */
function generateConnectionPaths(scenes: EnhancedSceneInfo[]) {
  const paths = [];
  
  for (let i = 0; i < scenes.length - 1; i++) {
    const currentScene = scenes[i];
    const nextScene = scenes[i + 1];
    
    const startX = currentScene.position.x + currentScene.busTravel.exitPoint.x;
    const startY = currentScene.position.y + currentScene.busTravel.exitPoint.y;
    const endX = nextScene.position.x + nextScene.busTravel.entryPoint.x;
    const endY = nextScene.position.y + nextScene.busTravel.entryPoint.y;
    
    // Create a smooth curve between scenes
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const controlOffset = 50; // Curve control point offset
    
    const path = `M ${startX},${startY} Q ${midX},${midY - controlOffset} ${endX},${endY}`;
    
    paths.push({
      fromScene: i + 1,
      toScene: i + 2,
      path,
      duration: currentScene.timing.transitionDuration
    });
  }
  
  return paths;
}

/**
 * Generate SVG animation values string for bus travel
 */
export function generateBusAnimationValues(keyframes: BusAnimationKeyframe[]): string {
  return keyframes
    .map(kf => `${kf.position.x},${kf.position.y}`)
    .join(';');
}

/**
 * Generate CSS keyframes for scene transitions
 */
export function generateSceneTransitionCSS(keyframes: AnimationKeyframe[], totalDuration: number): string {
  const css: string[] = [];

  // Group keyframes by scene
  const sceneKeyframes = keyframes.reduce((acc, kf) => {
    if (!acc[kf.sceneId]) acc[kf.sceneId] = [];
    acc[kf.sceneId].push(kf);
    return acc;
  }, {} as Record<string, AnimationKeyframe[]>);

  Object.entries(sceneKeyframes).forEach(([sceneId, kfs]) => {
    const sceneNumber = sceneId.match(/scene-(\d+)/)?.[1] || '1';

    css.push(`
      .scene-${sceneNumber} {
        transition: all 0.5s ease-in-out;
      }

      .scene-${sceneNumber}.active {
        opacity: 1;
        border: 3px solid #8b5cf6;
        box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
      }

      .scene-${sceneNumber}.dimmed {
        opacity: 0.7;
        border: 2px solid #e0e0e0;
      }

      .scene-${sceneNumber}.inactive {
        opacity: 0.5;
        border: 1px solid #e0e0e0;
      }
    `);
  });

  return css.join('\n');
}
