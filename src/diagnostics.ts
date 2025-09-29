// diagnostics.ts
import type { Scene, Node } from './scene';
import type { Diagnostic, EnforcementResult } from './boundary-enforcement';
import { enforceBoundaries } from './boundary-enforcement';

export type DiagnosticReport = {
  sceneId: string;
  timestamp: string;
  summary: {
    errors: number;
    warnings: number;
    totalNodes: number;
    boundariesProcessed: number;
  };
  diagnostics: Diagnostic[];
  suggestions: AutoFixSuggestion[];
};

export type AutoFixSuggestion = {
  type: "MOVE_NODE" | "RESIZE_NODE" | "ADJUST_BOUNDARY" | "ADD_POLICY";
  nodeId: string;
  description: string;
  changes: Record<string, any>;
  confidence: "high" | "medium" | "low";
};

// Generate comprehensive diagnostic report
export function generateDiagnosticReport(scene: Scene): DiagnosticReport {
  const enforcementResult = enforceBoundaries(scene);
  const suggestions = generateAutoFixSuggestions(enforcementResult);
  
  // Count nodes and boundaries
  let totalNodes = 0;
  let boundariesProcessed = 0;
  
  function countNodes(nodes: Node[]): void {
    for (const node of nodes) {
      totalNodes++;
      if (node.kind === "boundary") {
        boundariesProcessed++;
      }
      if ('children' in node && node.children) {
        countNodes(node.children);
      }
    }
  }
  
  countNodes(scene.nodes);
  
  return {
    sceneId: scene.id,
    timestamp: new Date().toISOString(),
    summary: {
      errors: enforcementResult.summary.errors,
      warnings: enforcementResult.summary.warnings,
      totalNodes,
      boundariesProcessed
    },
    diagnostics: enforcementResult.diagnostics,
    suggestions
  };
}

// Generate automatic fix suggestions based on diagnostics
export function generateAutoFixSuggestions(enforcementResult: EnforcementResult): AutoFixSuggestion[] {
  const suggestions: AutoFixSuggestion[] = [];
  
  for (const diagnostic of enforcementResult.diagnostics) {
    switch (diagnostic.code) {
      case "OUT_OF_BOUNDS":
        if (diagnostic.suggestedFix?.at) {
          suggestions.push({
            type: "MOVE_NODE",
            nodeId: diagnostic.nodeId,
            description: `Move node '${diagnostic.nodeId}' to stay within boundary '${diagnostic.boundaryId}'`,
            changes: {
              at: diagnostic.suggestedFix.at
            },
            confidence: "high"
          });
        }
        break;
        
      case "PORT_OUTSIDE":
        suggestions.push({
          type: "MOVE_NODE",
          nodeId: diagnostic.nodeId,
          description: `Adjust node '${diagnostic.nodeId}' position so port stays within boundary '${diagnostic.boundaryId}'`,
          changes: {
            // Calculate suggested position based on port requirements
            at: calculatePortAdjustment(diagnostic)
          },
          confidence: "medium"
        });
        break;
        
      case "NEG_SIZE":
        suggestions.push({
          type: "RESIZE_NODE",
          nodeId: diagnostic.nodeId,
          description: `Fix negative size for node '${diagnostic.nodeId}'`,
          changes: {
            size: { width: Math.max(10, diagnostic.actual?.width || 10), height: Math.max(10, diagnostic.actual?.height || 10) }
          },
          confidence: "high"
        });
        break;
        
      case "CONNECTOR_LEAK":
        suggestions.push({
          type: "ADD_POLICY",
          nodeId: diagnostic.boundaryId,
          description: `Add stricter boundary policy to '${diagnostic.boundaryId}' to prevent connector leaks`,
          changes: {
            policy: {
              mode: "strict",
              overflow: "clip",
              tolerance: 0
            }
          },
          confidence: "medium"
        });
        break;
    }
  }
  
  return suggestions;
}

// Apply automatic fixes to a scene
export function applyAutoFixes(scene: Scene, suggestions: AutoFixSuggestion[]): Scene {
  const fixedScene = JSON.parse(JSON.stringify(scene)); // Deep clone
  
  for (const suggestion of suggestions) {
    if (suggestion.confidence === "high") {
      applyFixToScene(fixedScene, suggestion);
    }
  }
  
  return fixedScene;
}

// Apply a single fix to the scene
function applyFixToScene(scene: Scene, suggestion: AutoFixSuggestion): void {
  const node = findNodeById(suggestion.nodeId, scene);
  if (!node) return;
  
  switch (suggestion.type) {
    case "MOVE_NODE":
      if (suggestion.changes.at && 'at' in node) {
        (node as any).at = suggestion.changes.at;
      }
      break;
      
    case "RESIZE_NODE":
      if (suggestion.changes.size && 'size' in node) {
        (node as any).size = { ...(node as any).size, ...suggestion.changes.size };
      }
      break;
      
    case "ADJUST_BOUNDARY":
      if (node.kind === "boundary" && suggestion.changes.size) {
        node.size = { ...node.size, ...suggestion.changes.size };
      }
      break;
      
    case "ADD_POLICY":
      if (node.kind === "boundary" && suggestion.changes.policy) {
        (node as any).policy = { ...(node as any).policy, ...suggestion.changes.policy };
      }
      break;
  }
}

// Helper functions
function calculatePortAdjustment(diagnostic: Diagnostic): { x: number; y: number } {
  // This would calculate the optimal position adjustment based on port constraints
  // For now, return a simple adjustment
  const actual = diagnostic.actual;
  if (actual?.hostRect && actual?.boundaryRect) {
    const hostRect = actual.hostRect;
    const boundaryRect = actual.boundaryRect;
    
    // Move the host node to be fully within the boundary
    const x = Math.max(boundaryRect.x, Math.min(hostRect.x, boundaryRect.x + boundaryRect.w - hostRect.w));
    const y = Math.max(boundaryRect.y, Math.min(hostRect.y, boundaryRect.y + boundaryRect.h - hostRect.h));
    
    return { x, y };
  }
  
  return { x: 0, y: 0 };
}

function findNodeById(nodeId: string, scene: Scene): Node | null {
  function searchInNode(node: Node): Node | null {
    if (node.id === nodeId) return node;
    if ('children' in node && node.children) {
      for (const child of node.children) {
        const found = searchInNode(child);
        if (found) return found;
      }
    }
    return null;
  }
  
  for (const node of scene.nodes) {
    const found = searchInNode(node);
    if (found) return found;
  }
  return null;
}

// Export diagnostic report as JSON
export function exportDiagnosticReport(report: DiagnosticReport): string {
  return JSON.stringify(report, null, 2);
}

// Create a summary for console output
export function createDiagnosticSummary(report: DiagnosticReport): string {
  const { summary, diagnostics, suggestions } = report;
  
  let output = `\n🔍 Boundary Enforcement Report for '${report.sceneId}'\n`;
  output += `📊 Summary: ${summary.errors} errors, ${summary.warnings} warnings\n`;
  output += `📈 Processed: ${summary.totalNodes} nodes, ${summary.boundariesProcessed} boundaries\n`;
  
  if (diagnostics.length > 0) {
    output += `\n⚠️  Issues Found:\n`;
    diagnostics.forEach((diag, i) => {
      output += `  ${i + 1}. [${diag.severity.toUpperCase()}] ${diag.message}\n`;
    });
  }
  
  if (suggestions.length > 0) {
    output += `\n💡 Auto-fix Suggestions:\n`;
    suggestions.forEach((suggestion, i) => {
      output += `  ${i + 1}. [${suggestion.confidence.toUpperCase()}] ${suggestion.description}\n`;
    });
  }
  
  if (diagnostics.length === 0) {
    output += `\n✅ No boundary violations detected!\n`;
  }
  
  return output;
}
