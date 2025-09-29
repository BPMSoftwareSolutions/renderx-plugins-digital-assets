describe('Enhanced Combined Storybook Animation Tests', () => {
  beforeEach(() => {
    // Visit the enhanced storybook test page
    cy.visit('/tests/enhanced-storybook-test.html')
    
    // Wait for page to load
    cy.get('[data-testid="enhanced-storybook-container"]').should('exist')
  })

  it('should load the enhanced storybook SVG without errors', () => {
    // Check that SVG loads
    cy.get('#enhanced-storybook-svg').should('exist')
    
    // Verify SVG has proper dimensions
    cy.get('#enhanced-storybook-svg').should('have.attr', 'width', '1750')
    cy.get('#enhanced-storybook-svg').should('have.attr', 'height', '1500')
    
    // Verify viewBox is set correctly
    cy.get('#enhanced-storybook-svg').should('have.attr', 'viewBox', '0 0 1750 1500')
  })

  it('should preserve original graph content (no unified bus)', () => {
    // Should NOT have unified bus (graph content is preserved)
    cy.get('#unified-coordinated-bus').should('have.length', 0)

    // Should have individual school-bus elements from graphs (preserved content)
    cy.get('#school-bus').should('have.length.greaterThan', 0)

    // Verify individual buses have their original animations from graphs
    cy.get('#school-bus animateTransform').should('exist')
  })

  it('should have proper scene coordination', () => {
    // Verify all 6 scenes are present
    for (let i = 1; i <= 6; i++) {
      cy.get(`.scene-${i}`).should('exist')
    }
    
    // Verify scenes have proper positioning
    cy.get('.scene-1').should('have.attr', 'transform').and('include', 'translate(50, 150)')
    cy.get('.scene-2').should('have.attr', 'transform').and('include', 'translate(900, 150)')
    cy.get('.scene-3').should('have.attr', 'transform').and('include', 'translate(50, 600)')
    cy.get('.scene-4').should('have.attr', 'transform').and('include', 'translate(900, 600)')
    cy.get('.scene-5').should('have.attr', 'transform').and('include', 'translate(50, 1050)')
    cy.get('.scene-6').should('have.attr', 'transform').and('include', 'translate(900, 1050)')
  })

  it('should have connection paths between scenes', () => {
    // Verify connection paths exist
    cy.get('.connection-path').should('have.length.greaterThan', 0)
    
    // Verify connection paths have proper styling
    cy.get('.connection-path').should('have.css', 'stroke')
    cy.get('.connection-path').should('have.css', 'stroke-dasharray')
  })

  it('should have progress indicator', () => {
    // Verify progress indicator exists
    cy.get('#progress-indicator').should('exist')
    
    // Verify progress bar animation
    cy.get('#progress-indicator rect[fill="#4CAF50"]').should('exist')
    cy.get('#progress-indicator animate').should('exist')
  })

  it('should have play/pause controls', () => {
    // Verify playback controls exist
    cy.get('#playback-controls').should('exist')
    cy.get('#playback-controls text').should('contain', 'Click to Play/Pause')
  })

  it('should have scene timing indicators', () => {
    // Each scene should have a timing indicator
    for (let i = 1; i <= 6; i++) {
      cy.get(`.scene-${i} .scene-progress`).should('exist')
      cy.get(`.scene-${i} .scene-progress animate`).should('exist')
    }
  })

  it('should show only one bus at a time (true single bus illusion)', () => {
    // Wait for initial state
    cy.wait(1000)

    // At start: only Scene 1 bus should be visible
    cy.get('.scene-1 #school-bus').should('be.visible')
    cy.get('.scene-2 #school-bus').should('not.be.visible')
    cy.get('.scene-3 #school-bus').should('not.be.visible')
    cy.get('.scene-4 #school-bus').should('not.be.visible')
    cy.get('.scene-5 #school-bus').should('not.be.visible')
    cy.get('.scene-6 #school-bus').should('not.be.visible')

    // After 7 seconds: only Scene 2 bus should be visible
    cy.wait(7000)

    // Debug: Log which buses are visible
    cy.get('#school-bus').each(($bus, index) => {
      const isVisible = $bus.is(':visible')
      const opacity = $bus.css('opacity')
      cy.log(`Bus ${index + 1}: visible=${isVisible}, opacity=${opacity}`)
    })

    cy.get('.scene-1 #school-bus').should('not.be.visible')
    cy.get('.scene-2 #school-bus').should('be.visible')
    cy.get('.scene-3 #school-bus').should('not.be.visible')
    cy.get('.scene-4 #school-bus').should('not.be.visible')
    cy.get('.scene-5 #school-bus').should('not.be.visible')
    cy.get('.scene-6 #school-bus').should('not.be.visible')
  })

  it('should maintain graph integrity with coordinated timing', () => {
    // Should have individual bus animations from graphs (not removed)
    cy.get('g[id="school-bus"] animateTransform[type="translate"]').should('have.length.greaterThan', 4)

    // Should NOT have unified bus (content not modified)
    cy.get('#unified-coordinated-bus').should('have.length', 0)

    // Verify original graph content is preserved
    cy.get('#school-bus').should('exist')
    cy.get('#depot').should('exist') // Should have depot from graph
    cy.get('#traffic-light').should('exist') // Should have traffic light from graph

    // Verify coordination timing is applied without corrupting content
    cy.get('#school-bus animateTransform[begin]').should('have.length.greaterThan', 3)
  })

  it('should be visually correct (screenshot test)', () => {
    // Wait for animations to start
    cy.wait(2000)
    
    // Take screenshot for visual verification
    cy.screenshot('enhanced-storybook-initial-state')
    
    // Wait for some animation progress
    cy.wait(5000)
    cy.screenshot('enhanced-storybook-animation-progress')
  })

  it('should handle different viewport sizes', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1280, height: 720, name: 'desktop-medium' },
      { width: 768, height: 1024, name: 'tablet' }
    ]
    
    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height)
      cy.wait(500)
      
      // Verify SVG is still visible and properly scaled
      cy.get('#enhanced-storybook-svg').should('be.visible')
      
      // Take screenshot at this viewport
      cy.screenshot(`enhanced-storybook-${viewport.name}`)
    })
  })
})
