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

  it('should have exactly one unified bus (no flying bus bug)', () => {
    // Should have exactly one unified bus element
    cy.get('#unified-coordinated-bus').should('have.length', 1)
    
    // Should NOT have multiple school-bus elements (they should be removed from scenes)
    cy.get('#school-bus').should('have.length', 0)
    
    // Verify the unified bus has proper animation
    cy.get('#unified-coordinated-bus animateTransform').should('exist')
    cy.get('#unified-coordinated-bus animateTransform').should('have.attr', 'type', 'translate')
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

  it('should have proper bus animation timing', () => {
    // Get the unified bus animation
    cy.get('#unified-coordinated-bus animateTransform').then($anim => {
      const values = $anim.attr('values')
      const dur = $anim.attr('dur')
      
      // Verify animation has multiple coordinate pairs (scene-by-scene movement)
      expect(values).to.include(';')
      expect(values.split(';').length).to.be.greaterThan(6) // Should have coordinates for each scene
      
      // Verify reasonable duration
      expect(parseInt(dur)).to.be.greaterThan(30) // Should be longer than 30 seconds
    })
  })

  it('should not have conflicting bus animations', () => {
    // Should not have individual bus animations in scenes
    cy.get('g[id="school-bus"] animateTransform[type="translate"]').should('have.length', 0)

    // Should only have the unified bus animation (more specific check)
    cy.get('#unified-coordinated-bus animateTransform[type="translate"]').should('have.length', 1)

    // Verify the unified bus animation has proper scene-by-scene coordinates
    cy.get('#unified-coordinated-bus animateTransform[type="translate"]').then($anim => {
      const values = $anim.attr('values')
      const coordinates = values.split(';')

      // Should have coordinates for all 6 scenes (multiple coordinates per scene for smooth transitions)
      expect(coordinates.length).to.be.greaterThan(6)
      expect(coordinates.length).to.be.lessThan(20) // Reasonable upper bound
    })
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
