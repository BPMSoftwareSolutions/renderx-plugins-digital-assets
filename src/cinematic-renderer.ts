// cinematic-renderer.ts
import type { MonoGraph, MonoScene } from './mono-graph-types';

/**
 * Cinematic Renderer for Phase 2
 * 
 * Creates movie-like presentations with scene transitions, timing controls,
 * and full-screen scene views with smooth transitions between scenes.
 */

export interface CinematicScene extends MonoScene {
  // Enhanced cinematic properties
  cinematic: {
    duration: number; // Scene display duration in seconds
    transition: {
      type: 'fade' | 'slide' | 'zoom' | 'custom';
      duration: number; // Transition duration in seconds
      direction?: 'left' | 'right' | 'up' | 'down';
      easing?: string; // CSS easing function
    };
    viewport: {
      width: number;
      height: number;
      scale?: number; // Zoom level for this scene
    };
  };
}

export interface CinematicPresentation {
  id: string;
  title: string;
  canvas: {
    width: number;
    height: number;
  };
  scenes: CinematicScene[];
  globalAnimations: any[]; // Cross-scene animations (like bus travel)
  controls: {
    autoPlay: boolean;
    loop: boolean;
    showProgress: boolean;
    allowManualNavigation: boolean;
  };
}

/**
 * Convert a mono graph to cinematic presentation
 */
export function createCinematicPresentation(monoGraph: MonoGraph): CinematicPresentation {
  const sceneViewport = {
    width: 1200,
    height: 800
  };
  
  const cinematicScenes: CinematicScene[] = monoGraph.scenes.map((scene, index) => ({
    ...scene,
    cinematic: {
      duration: 5, // 5 seconds per scene
      transition: {
        type: index % 2 === 0 ? 'slide' : 'fade',
        duration: 1, // 1 second transition
        direction: index % 2 === 0 ? 'right' : undefined,
        easing: 'ease-in-out'
      },
      viewport: sceneViewport
    }
  }));
  
  return {
    id: `${monoGraph.id}-cinematic`,
    title: `${monoGraph.title} - Cinematic Presentation`,
    canvas: {
      width: sceneViewport.width,
      height: sceneViewport.height
    },
    scenes: cinematicScenes,
    globalAnimations: [], // Will be populated with bus travel animations
    controls: {
      autoPlay: true,
      loop: true,
      showProgress: true,
      allowManualNavigation: true
    }
  };
}

/**
 * Generate CSS animations for scene transitions
 */
function generateTransitionCSS(scenes: CinematicScene[]): string {
  const transitions = scenes.map((scene, index) => {
    const { transition } = scene.cinematic;
    const nextIndex = (index + 1) % scenes.length;
    
    let transformStart = '';
    let transformEnd = '';
    
    switch (transition.type) {
      case 'slide':
        if (transition.direction === 'right') {
          transformStart = 'translateX(100%)';
          transformEnd = 'translateX(0)';
        } else if (transition.direction === 'left') {
          transformStart = 'translateX(-100%)';
          transformEnd = 'translateX(0)';
        } else if (transition.direction === 'up') {
          transformStart = 'translateY(-100%)';
          transformEnd = 'translateY(0)';
        } else if (transition.direction === 'down') {
          transformStart = 'translateY(100%)';
          transformEnd = 'translateY(0)';
        }
        break;
      case 'zoom':
        transformStart = 'scale(0.5)';
        transformEnd = 'scale(1)';
        break;
      case 'fade':
      default:
        // Fade transitions handled via opacity
        break;
    }
    
    return `
      .scene-${index + 1}-enter {
        animation: scene-${index + 1}-enter-animation ${transition.duration}s ${transition.easing || 'ease-in-out'};
      }
      
      .scene-${index + 1}-exit {
        animation: scene-${index + 1}-exit-animation ${transition.duration}s ${transition.easing || 'ease-in-out'};
      }
      
      @keyframes scene-${index + 1}-enter-animation {
        from {
          opacity: ${transition.type === 'fade' ? '0' : '1'};
          transform: ${transformStart};
        }
        to {
          opacity: 1;
          transform: ${transformEnd};
        }
      }
      
      @keyframes scene-${index + 1}-exit-animation {
        from {
          opacity: 1;
          transform: ${transformEnd};
        }
        to {
          opacity: ${transition.type === 'fade' ? '0' : '1'};
          transform: ${transformStart};
        }
      }
    `;
  }).join('\n');
  
  return `
    <style>
      .cinematic-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
        background: #000;
      }
      
      .scene-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transform: translateX(100%);
      }
      
      .scene-container.active {
        opacity: 1;
        transform: translateX(0);
      }
      
      .progress-bar {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        height: 4px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 2px;
        overflow: hidden;
      }
      
      .progress-fill {
        height: 100%;
        background: #4CAF50;
        width: 0%;
        transition: width 0.1s ease;
      }
      
      .controls {
        position: absolute;
        bottom: 40px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
      }
      
      .control-button {
        background: rgba(255, 255, 255, 0.8);
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s ease;
      }
      
      .control-button:hover {
        background: rgba(255, 255, 255, 1);
      }
      
      .scene-title {
        position: absolute;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-family: Arial, sans-serif;
        font-size: 24px;
        font-weight: bold;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
        z-index: 10;
      }
      
      ${transitions}
    </style>
  `;
}

/**
 * Generate JavaScript for presentation control
 */
function generatePresentationJS(presentation: CinematicPresentation): string {
  const totalDuration = presentation.scenes.reduce((sum, scene) => sum + scene.cinematic.duration + scene.cinematic.transition.duration, 0);
  
  return `
    <script>
      class CinematicPresentation {
        constructor() {
          this.currentScene = 0;
          this.totalScenes = ${presentation.scenes.length};
          this.isPlaying = ${presentation.controls.autoPlay};
          this.totalDuration = ${totalDuration};
          this.startTime = Date.now();
          
          this.initializeControls();
          this.startPresentation();
        }
        
        initializeControls() {
          const playPauseBtn = document.getElementById('play-pause-btn');
          const prevBtn = document.getElementById('prev-btn');
          const nextBtn = document.getElementById('next-btn');
          const restartBtn = document.getElementById('restart-btn');
          
          if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayPause());
          }
          
          if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousScene());
          }
          
          if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextScene());
          }
          
          if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
          }
          
          // Keyboard controls
          document.addEventListener('keydown', (e) => {
            switch(e.key) {
              case ' ':
                e.preventDefault();
                this.togglePlayPause();
                break;
              case 'ArrowLeft':
                this.previousScene();
                break;
              case 'ArrowRight':
                this.nextScene();
                break;
              case 'r':
                this.restart();
                break;
            }
          });
        }
        
        startPresentation() {
          if (this.isPlaying) {
            this.showScene(0);
            this.scheduleNextScene();
          }
        }
        
        showScene(sceneIndex) {
          const scenes = document.querySelectorAll('.scene-container');
          const titles = document.querySelectorAll('.scene-title');
          
          // Hide all scenes
          scenes.forEach((scene, index) => {
            scene.classList.remove('active');
            if (index === sceneIndex) {
              setTimeout(() => {
                scene.classList.add('active');
              }, 100);
            }
          });
          
          // Update title
          titles.forEach((title, index) => {
            title.style.display = index === sceneIndex ? 'block' : 'none';
          });
          
          this.currentScene = sceneIndex;
          this.updateProgress();
        }
        
        scheduleNextScene() {
          if (!this.isPlaying) return;
          
          const currentSceneData = ${JSON.stringify(presentation.scenes)};
          const sceneDuration = currentSceneData[this.currentScene].cinematic.duration * 1000;
          
          setTimeout(() => {
            if (this.isPlaying) {
              this.nextScene();
            }
          }, sceneDuration);
        }
        
        nextScene() {
          const nextIndex = (this.currentScene + 1) % this.totalScenes;
          this.showScene(nextIndex);
          
          if (this.isPlaying && (nextIndex !== 0 || ${presentation.controls.loop})) {
            this.scheduleNextScene();
          } else if (nextIndex === 0 && !${presentation.controls.loop}) {
            this.isPlaying = false;
            this.updatePlayPauseButton();
          }
        }
        
        previousScene() {
          const prevIndex = this.currentScene === 0 ? this.totalScenes - 1 : this.currentScene - 1;
          this.showScene(prevIndex);
        }
        
        togglePlayPause() {
          this.isPlaying = !this.isPlaying;
          this.updatePlayPauseButton();
          
          if (this.isPlaying) {
            this.scheduleNextScene();
          }
        }
        
        updatePlayPauseButton() {
          const btn = document.getElementById('play-pause-btn');
          if (btn) {
            btn.textContent = this.isPlaying ? 'Pause' : 'Play';
          }
        }
        
        restart() {
          this.currentScene = 0;
          this.startTime = Date.now();
          this.showScene(0);
          
          if (this.isPlaying) {
            this.scheduleNextScene();
          }
        }
        
        updateProgress() {
          const progressFill = document.querySelector('.progress-fill');
          if (progressFill) {
            const progress = ((this.currentScene + 1) / this.totalScenes) * 100;
            progressFill.style.width = progress + '%';
          }
        }
      }
      
      // Initialize presentation when DOM is loaded
      document.addEventListener('DOMContentLoaded', () => {
        new CinematicPresentation();
      });
    </script>
  `;
}

/**
 * Render cinematic presentation to HTML/SVG
 */
/**
 * Save cinematic presentation to HTML file
 */
export function saveCinematicPresentation(presentation: CinematicPresentation, filename: string): void {
  const { writeFileSync } = require('fs');
  const { join } = require('path');

  const html = renderCinematicPresentation(presentation);
  const samplesDir = join(__dirname, '..', 'samples');
  const filePath = join(samplesDir, filename);

  writeFileSync(filePath, html);
}

/**
 * Render cinematic presentation to HTML/SVG
 */
export function renderCinematicPresentation(presentation: CinematicPresentation): string {
  const css = generateTransitionCSS(presentation.scenes);
  const js = generatePresentationJS(presentation);
  
  const scenesHTML = presentation.scenes.map((scene, index) => {
    // Render each scene as a full-screen SVG
    const sceneContent = scene.defs?.rawSvg?.join('\n') || '';
    
    return `
      <div class="scene-container" id="scene-${index + 1}">
        <div class="scene-title">
          Scene ${index + 1}: ${scene.id.replace('event-router-scene-', '').replace('-', ' ').toUpperCase()}
        </div>
        <svg width="100%" height="100%" viewBox="0 0 ${scene.canvas.width} ${scene.canvas.height}" preserveAspectRatio="xMidYMid meet">
          <defs>
            ${scene.defs?.filters?.join('\n') || ''}
            ${scene.defs?.gradients?.join('\n') || ''}
          </defs>
          <rect width="100%" height="100%" fill="${scene.bg || '#87CEEB'}"/>
          ${sceneContent}
        </svg>
      </div>
    `;
  }).join('\n');
  
  const controlsHTML = presentation.controls.allowManualNavigation ? `
    <div class="controls">
      <button class="control-button" id="restart-btn">Restart</button>
      <button class="control-button" id="prev-btn">Previous</button>
      <button class="control-button" id="play-pause-btn">${presentation.controls.autoPlay ? 'Pause' : 'Play'}</button>
      <button class="control-button" id="next-btn">Next</button>
    </div>
  ` : '';
  
  const progressHTML = presentation.controls.showProgress ? `
    <div class="progress-bar">
      <div class="progress-fill"></div>
    </div>
  ` : '';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${presentation.title}</title>
  ${css}
</head>
<body>
  <div class="cinematic-container">
    ${scenesHTML}
    ${progressHTML}
    ${controlsHTML}
  </div>
  ${js}
</body>
</html>`;
}
