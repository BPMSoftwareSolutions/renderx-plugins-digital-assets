#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

let serverProcess = null;

// Function to start the test server
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting test server...');
    
    serverProcess = spawn('node', [path.join(__dirname, 'server.js')], {
      stdio: 'pipe',
      cwd: process.cwd()
    });

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Server: ${output.trim()}`);
      
      if (output.includes('Test server running')) {
        console.log('✅ Test server is ready');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data.toString()}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      reject(new Error('Server startup timeout'));
    }, 10000);
  });
}

// Function to run Cypress tests
function runCypressTests() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Running Cypress tests...');
    
    const cypressProcess = spawn('npx', ['cypress', 'run', '--browser', 'chrome'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    cypressProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Cypress tests completed successfully');
        resolve();
      } else {
        console.error(`❌ Cypress tests failed with code ${code}`);
        reject(new Error(`Cypress tests failed with code ${code}`));
      }
    });

    cypressProcess.on('error', (error) => {
      console.error('Failed to run Cypress:', error);
      reject(error);
    });
  });
}

// Function to stop the server
function stopServer() {
  if (serverProcess) {
    console.log('🛑 Stopping test server...');
    serverProcess.kill('SIGTERM');
    serverProcess = null;
  }
}

// Main test runner
async function runTests() {
  try {
    // Start server
    await startServer();
    
    // Wait a moment for server to be fully ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run Cypress tests
    await runCypressTests();
    
    console.log('🎉 All SVG rendering tests passed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test run failed:', error.message);
    process.exit(1);
  } finally {
    stopServer();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  stopServer();
  process.exit(0);
});

// Run the tests
if (require.main === module) {
  runTests();
}

module.exports = { startServer, runCypressTests, stopServer };
