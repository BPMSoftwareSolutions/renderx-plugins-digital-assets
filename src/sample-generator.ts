// sample-generator.ts - Generate interesting graph patterns
import type { Graph } from "./graph";
import { graphToSVG } from "./svg-export";
import * as fs from "fs";
import * as path from "path";

// Microservices Architecture Pattern
export function createMicroservicesGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 200, 
      spacingY: 100 
    },
    nodes: [
      { id: "gateway", label: "API Gateway", w: 140, h: 60 },
      { id: "auth", label: "Auth Service", w: 120, h: 50 },
      { id: "user", label: "User Service", w: 120, h: 50 },
      { id: "order", label: "Order Service", w: 120, h: 50 },
      { id: "payment", label: "Payment Service", w: 130, h: 50 },
      { id: "notification", label: "Notification", w: 120, h: 50 },
      { id: "db-user", label: "User DB", w: 100, h: 40 },
      { id: "db-order", label: "Order DB", w: 100, h: 40 },
      { id: "db-payment", label: "Payment DB", w: 100, h: 40 },
      { id: "cache", label: "Redis Cache", w: 110, h: 40 }
    ],
    edges: [
      { from: "gateway", to: "auth", label: "authenticate" },
      { from: "gateway", to: "user" },
      { from: "gateway", to: "order" },
      { from: "gateway", to: "payment" },
      { from: "auth", to: "cache", dashed: true, label: "session" },
      { from: "user", to: "db-user" },
      { from: "order", to: "db-order" },
      { from: "order", to: "payment", label: "process payment" },
      { from: "payment", to: "db-payment" },
      { from: "payment", to: "notification", label: "notify" },
      { from: "order", to: "notification", label: "status update" }
    ]
  };
}

// Data Pipeline Pattern
export function createDataPipelineGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "dark", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 180, 
      spacingY: 80 
    },
    nodes: [
      { id: "source1", label: "API Source", w: 100, h: 45 },
      { id: "source2", label: "File Source", w: 100, h: 45 },
      { id: "source3", label: "DB Source", w: 100, h: 45 },
      { id: "ingestion", label: "Data Ingestion", w: 130, h: 50 },
      { id: "transform", label: "Transform", w: 110, h: 45 },
      { id: "validate", label: "Validate", w: 100, h: 45 },
      { id: "warehouse", label: "Data Warehouse", w: 140, h: 50 },
      { id: "analytics", label: "Analytics", w: 110, h: 45 },
      { id: "dashboard", label: "Dashboard", w: 110, h: 45 },
      { id: "alerts", label: "Alerts", w: 90, h: 45 }
    ],
    edges: [
      { from: "source1", to: "ingestion" },
      { from: "source2", to: "ingestion" },
      { from: "source3", to: "ingestion" },
      { from: "ingestion", to: "transform" },
      { from: "transform", to: "validate" },
      { from: "validate", to: "warehouse" },
      { from: "warehouse", to: "analytics" },
      { from: "analytics", to: "dashboard" },
      { from: "analytics", to: "alerts", dashed: true, label: "threshold" }
    ]
  };
}

// Neural Network Pattern
export function createNeuralNetworkGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: false, 
      rounded: true, 
      spacingX: 120, 
      spacingY: 60 
    },
    nodes: [
      // Input layer
      { id: "i1", label: "Input 1", w: 80, h: 40 },
      { id: "i2", label: "Input 2", w: 80, h: 40 },
      { id: "i3", label: "Input 3", w: 80, h: 40 },
      // Hidden layer 1
      { id: "h1", label: "Hidden 1", w: 80, h: 40 },
      { id: "h2", label: "Hidden 2", w: 80, h: 40 },
      { id: "h3", label: "Hidden 3", w: 80, h: 40 },
      { id: "h4", label: "Hidden 4", w: 80, h: 40 },
      // Hidden layer 2
      { id: "h5", label: "Hidden 5", w: 80, h: 40 },
      { id: "h6", label: "Hidden 6", w: 80, h: 40 },
      // Output layer
      { id: "o1", label: "Output 1", w: 80, h: 40 },
      { id: "o2", label: "Output 2", w: 80, h: 40 }
    ],
    edges: [
      // Input to hidden layer 1
      { from: "i1", to: "h1" }, { from: "i1", to: "h2" }, { from: "i1", to: "h3" }, { from: "i1", to: "h4" },
      { from: "i2", to: "h1" }, { from: "i2", to: "h2" }, { from: "i2", to: "h3" }, { from: "i2", to: "h4" },
      { from: "i3", to: "h1" }, { from: "i3", to: "h2" }, { from: "i3", to: "h3" }, { from: "i3", to: "h4" },
      // Hidden layer 1 to hidden layer 2
      { from: "h1", to: "h5" }, { from: "h1", to: "h6" },
      { from: "h2", to: "h5" }, { from: "h2", to: "h6" },
      { from: "h3", to: "h5" }, { from: "h3", to: "h6" },
      { from: "h4", to: "h5" }, { from: "h4", to: "h6" },
      // Hidden layer 2 to output
      { from: "h5", to: "o1" }, { from: "h5", to: "o2" },
      { from: "h6", to: "o1" }, { from: "h6", to: "o2" }
    ]
  };
}

// Social Network Pattern
export function createSocialNetworkGraph(): Graph {
  return {
    meta: { 
      layout: "radial", 
      theme: "light", 
      arrowHeads: false, 
      rounded: true 
    },
    nodes: [
      { id: "alice", label: "Alice", w: 80, h: 40 },
      { id: "bob", label: "Bob", w: 80, h: 40 },
      { id: "charlie", label: "Charlie", w: 80, h: 40 },
      { id: "diana", label: "Diana", w: 80, h: 40 },
      { id: "eve", label: "Eve", w: 80, h: 40 },
      { id: "frank", label: "Frank", w: 80, h: 40 },
      { id: "grace", label: "Grace", w: 80, h: 40 },
      { id: "henry", label: "Henry", w: 80, h: 40 }
    ],
    edges: [
      { from: "alice", to: "bob" },
      { from: "alice", to: "charlie" },
      { from: "alice", to: "diana" },
      { from: "bob", to: "eve" },
      { from: "bob", to: "frank" },
      { from: "charlie", to: "grace" },
      { from: "diana", to: "henry" },
      { from: "eve", to: "frank" },
      { from: "grace", to: "henry" },
      { from: "frank", to: "grace", dashed: true }
    ]
  };
}

// CI/CD Pipeline Pattern
export function createCICDGraph(): Graph {
  return {
    meta: { 
      layout: "layered", 
      theme: "light", 
      arrowHeads: true, 
      rounded: true, 
      spacingX: 160, 
      spacingY: 80 
    },
    nodes: [
      { id: "commit", label: "Git Commit", w: 100, h: 45 },
      { id: "build", label: "Build", w: 80, h: 45 },
      { id: "test", label: "Unit Tests", w: 90, h: 45 },
      { id: "lint", label: "Lint & Format", w: 100, h: 45 },
      { id: "security", label: "Security Scan", w: 110, h: 45 },
      { id: "integration", label: "Integration Tests", w: 130, h: 45 },
      { id: "staging", label: "Deploy Staging", w: 120, h: 45 },
      { id: "e2e", label: "E2E Tests", w: 90, h: 45 },
      { id: "approval", label: "Manual Approval", w: 120, h: 45 },
      { id: "production", label: "Deploy Production", w: 140, h: 45 },
      { id: "monitor", label: "Monitor", w: 90, h: 45 }
    ],
    edges: [
      { from: "commit", to: "build" },
      { from: "build", to: "test" },
      { from: "build", to: "lint" },
      { from: "test", to: "security" },
      { from: "lint", to: "security" },
      { from: "security", to: "integration" },
      { from: "integration", to: "staging" },
      { from: "staging", to: "e2e" },
      { from: "e2e", to: "approval" },
      { from: "approval", to: "production" },
      { from: "production", to: "monitor" },
      { from: "monitor", to: "staging", dashed: true, label: "rollback" }
    ]
  };
}

// Generate all samples
export function generateAllSamples() {
  const samplesDir = path.join(process.cwd(), "samples");
  
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir);
  }

  const patterns = [
    { name: "microservices-architecture", graph: createMicroservicesGraph() },
    { name: "data-pipeline", graph: createDataPipelineGraph() },
    { name: "neural-network", graph: createNeuralNetworkGraph() },
    { name: "social-network", graph: createSocialNetworkGraph() },
    { name: "cicd-pipeline", graph: createCICDGraph() }
  ];

  patterns.forEach(({ name, graph }) => {
    const svg = graphToSVG(graph);
    const jsonPath = path.join(samplesDir, `${name}.json`);
    const svgPath = path.join(samplesDir, `${name}.svg`);
    
    fs.writeFileSync(jsonPath, JSON.stringify(graph, null, 2));
    fs.writeFileSync(svgPath, svg);
    
    console.log(`Generated ${name}: ${jsonPath} and ${svgPath}`);
  });
}

// CLI usage
if (require.main === module) {
  generateAllSamples();
}
