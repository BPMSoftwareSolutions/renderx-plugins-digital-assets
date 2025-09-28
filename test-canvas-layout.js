/**
 * Unit tests for validating the positions and alignment of components
 * in the event_router_storybook.ui canvas file
 */

const fs = require('fs');
const path = require('path');

// Load the canvas file
const canvasPath = path.join(__dirname, 'assets', 'event-router', 'event_router_storybook.ui');
const canvasData = JSON.parse(fs.readFileSync(canvasPath, 'utf8'));

// Test suite
class CanvasLayoutTests {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, testFn) {
        this.tests.push({ name, testFn });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`${message}: expected ${expected}, got ${actual}`);
        }
    }

    assertRange(value, min, max, message) {
        if (value < min || value > max) {
            throw new Error(`${message}: expected ${value} to be between ${min} and ${max}`);
        }
    }

    run() {
        console.log('Running Canvas Layout Tests...\n');
        
        for (const { name, testFn } of this.tests) {
            try {
                testFn();
                console.log(`✓ ${name}`);
                this.passed++;
            } catch (error) {
                console.log(`✗ ${name}: ${error.message}`);
                this.failed++;
            }
        }

        console.log(`\nResults: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

// Initialize test suite
const tests = new CanvasLayoutTests();

// Test 1: Verify component count
tests.test('Should have 8 components total', () => {
    tests.assertEqual(canvasData.components.length, 8, 'Component count mismatch');
    tests.assertEqual(canvasData.metadata.componentCount, 8, 'Metadata component count mismatch');
});

// Test 2: Verify canvas size is adequate
tests.test('Canvas size should accommodate all components', () => {
    tests.assertEqual(canvasData.metadata.canvasSize.width, 1500, 'Canvas width should be 1500');
    tests.assertEqual(canvasData.metadata.canvasSize.height, 1700, 'Canvas height should be 1700');
});

// Test 3: Verify header component spans the top
tests.test('Header should span the top of the canvas', () => {
    const header = canvasData.components.find(c => c.id === 'rx-node-wju9sv');
    tests.assert(header, 'Header component not found');

    // Header should be at the top
    tests.assertRange(header.layout.y, -360, -340, 'Header Y position');

    // Header should span the full width
    tests.assertEqual(header.layout.width, 1500, 'Header width should span full canvas');
    tests.assertEqual(header.layout.x, 0, 'Header should start at x=0');
});

// Test 4: Verify scenes are arranged in seamless 2x3 grid
tests.test('Scenes should be arranged in seamless 2 columns, 3 rows', () => {
    const scenes = canvasData.components.filter(c => c.id.includes('scene') || c.id.includes('73eke9') || c.id.includes('s1wplc'));
    tests.assertEqual(scenes.length, 6, 'Should have 6 scene components');

    // Sort scenes by Y position to check rows
    scenes.sort((a, b) => a.layout.y - b.layout.y);

    // All scenes should be same size for seamless blending
    scenes.forEach(scene => {
        tests.assertEqual(scene.layout.width, 750, `Scene ${scene.id} width should be 750`);
        tests.assertEqual(scene.layout.height, 400, `Scene ${scene.id} height should be 400`);
    });

    // Row 1: Scenes 1 and 2 - should touch seamlessly
    const row1 = scenes.slice(0, 2);
    tests.assertEqual(row1[0].layout.y, 50, 'Row 1 Scene 1 Y position');
    tests.assertEqual(row1[1].layout.y, 50, 'Row 1 Scene 2 Y position');
    tests.assertEqual(row1[0].layout.x, 0, 'Scene 1 should start at x=0');
    tests.assertEqual(row1[1].layout.x, 750, 'Scene 2 should start at x=750 (touching Scene 1)');

    // Row 2: Scenes 3 and 4 - should touch seamlessly
    const row2 = scenes.slice(2, 4);
    tests.assertEqual(row2[0].layout.y, 450, 'Row 2 Scene 3 Y position');
    tests.assertEqual(row2[1].layout.y, 450, 'Row 2 Scene 4 Y position');
    tests.assertEqual(row2[0].layout.x, 0, 'Scene 3 should start at x=0');
    tests.assertEqual(row2[1].layout.x, 750, 'Scene 4 should start at x=750 (touching Scene 3)');

    // Row 3: Scenes 5 and 6 - should touch seamlessly
    const row3 = scenes.slice(4, 6);
    tests.assertEqual(row3[0].layout.y, 850, 'Row 3 Scene 5 Y position');
    tests.assertEqual(row3[1].layout.y, 850, 'Row 3 Scene 6 Y position');
    tests.assertEqual(row3[0].layout.x, 0, 'Scene 5 should start at x=0');
    tests.assertEqual(row3[1].layout.x, 750, 'Scene 6 should start at x=750 (touching Scene 5)');
});

// Test 5: Verify summary component spans the bottom seamlessly
tests.test('Summary should span the bottom row seamlessly', () => {
    const summary = canvasData.components.find(c => c.id === 'rx-node-summary');
    tests.assert(summary, 'Summary component not found');

    // Summary should be positioned right after row 3
    tests.assertEqual(summary.layout.y, 1250, 'Summary Y position should be at 1250');
    tests.assertEqual(summary.layout.x, 0, 'Summary should start at x=0');

    // Summary should span the full canvas width
    tests.assertEqual(summary.layout.width, 1500, 'Summary width should span full canvas');
    tests.assertEqual(summary.layout.height, 400, 'Summary height should be 400');
});

// Test 6: Verify seamless touching (no gaps, no overlaps)
tests.test('Components should touch seamlessly without overlaps', () => {
    const scenes = canvasData.components.filter(c => c.id.includes('scene') || c.id.includes('73eke9') || c.id.includes('s1wplc'));
    scenes.sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);

    // Check horizontal touching within rows
    for (let i = 0; i < scenes.length; i += 2) {
        const leftScene = scenes[i];
        const rightScene = scenes[i + 1];

        if (rightScene) {
            // Right scene should start exactly where left scene ends
            const leftEnd = leftScene.layout.x + leftScene.layout.width;
            tests.assertEqual(rightScene.layout.x, leftEnd,
                `Scene ${rightScene.id} should start exactly where ${leftScene.id} ends (seamless horizontal touch)`);
        }
    }

    // Verify no overlaps between non-adjacent components
    const allComponents = canvasData.components;
    for (let i = 0; i < allComponents.length; i++) {
        for (let j = i + 1; j < allComponents.length; j++) {
            const comp1 = allComponents[i];
            const comp2 = allComponents[j];

            // Skip adjacent scenes that should touch
            const isAdjacentHorizontal = (
                (comp1.layout.y === comp2.layout.y) &&
                (Math.abs(comp1.layout.x - comp2.layout.x) === 750)
            );

            if (!isAdjacentHorizontal) {
                // Check if rectangles overlap
                const overlap = !(
                    comp1.layout.x + comp1.layout.width <= comp2.layout.x ||
                    comp2.layout.x + comp2.layout.width <= comp1.layout.x ||
                    comp1.layout.y + comp1.layout.height <= comp2.layout.y ||
                    comp2.layout.y + comp2.layout.height <= comp1.layout.y
                );

                tests.assert(!overlap, `Components ${comp1.id} and ${comp2.id} should not overlap`);
            }
        }
    }
});

// Test 7: Verify consistent row spacing
tests.test('Rows should have consistent spacing', () => {
    const scenes = canvasData.components.filter(c => c.id.includes('scene') || c.id.includes('73eke9') || c.id.includes('s1wplc'));
    scenes.sort((a, b) => a.layout.y - b.layout.y);

    // Calculate spacing between rows
    const row1Y = scenes[0].layout.y; // 50
    const row2Y = scenes[2].layout.y; // 450
    const row3Y = scenes[4].layout.y; // 850

    const spacing1to2 = row2Y - (row1Y + scenes[0].layout.height); // 450 - (50 + 400) = 0
    const spacing2to3 = row3Y - (row2Y + scenes[2].layout.height); // 850 - (450 + 400) = 0

    // Rows should touch vertically (no spacing)
    tests.assertEqual(spacing1to2, 0, 'No spacing between row 1 and 2 - should touch');
    tests.assertEqual(spacing2to3, 0, 'No spacing between row 2 and 3 - should touch');
});

// Run all tests
const success = tests.run();
process.exit(success ? 0 : 1);
