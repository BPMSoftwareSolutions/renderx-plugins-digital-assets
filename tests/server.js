const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the project root
app.use(express.static(path.join(__dirname, '..')));

// Serve the test page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'browser-svg-render-test.html'));
});

// Serve the test page explicitly
app.get('/tests/browser-svg-render-test.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'browser-svg-render-test.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log(`SVG test page: http://localhost:${PORT}/tests/browser-svg-render-test.html`);
});

module.exports = app;
