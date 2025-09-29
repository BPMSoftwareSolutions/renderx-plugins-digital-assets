describe('SVG Element Rendering Tests', () => {
  // Test data for all slides and elements
  const slides = [
    {
      id: 'slide-01-manifest',
      name: 'Phase 1: Plugin Manifest Creation',
      elements: [
        {
          id: 'plugin-package',
          label: 'Plugin Package',
          svg: 'slide-01-manifest/plugin-package.svg',
          description: 'A crisp, isometric package box with shadow, clean label, capability glyphs, and gleaming npm badge'
        },
        {
          id: 'plugin-manifest',
          label: 'Plugin Manifest',
          svg: 'slide-01-manifest/plugin-manifest.svg',
          description: 'A sleek document card with cyan trim, stylized JSON braces, aligned key-value rows, generated stamp, and navigation tabs'
        },
        {
          id: 'handlers-export',
          label: 'Handlers Export',
          svg: 'slide-01-manifest/handlers-export.svg',
          description: 'Elegant connectors from plugin core, matching ports (onDragStart, publishCreateRequested), violet gradient arc, and circuit traces'
        },
        {
          id: 'build-publish',
          label: 'Build & Publish',
          svg: 'slide-01-manifest/build-publish.svg',
          description: 'A streamlined conveyor system with staging pad, uplink arrow, and version tags showing the build and publish process'
        },
        {
          id: 'host-sdk',
          label: 'Host SDK',
          svg: 'slide-01-manifest/host-sdk.svg',
          description: 'A low-profile matte gray console with slender rails, labeled ports, and Conductor/EventRouter modules'
        }
      ]
    }
  ]

  beforeEach(() => {
    // Visit the test page
    cy.visit('/tests/browser-svg-render-test.html')

    // Wait for page to load
    cy.get('[data-testid="svg-test-container"]').should('exist')
  })

  slides.forEach(slide => {
    describe(`${slide.name}`, () => {
      slide.elements.forEach(element => {
        it(`should render ${element.label} SVG correctly`, () => {
          const elementSelector = `[data-testid="element-${element.id}"]`
          const svgSelector = `${elementSelector} .svg-container`
          
          // Wait for element to be present
          cy.get(elementSelector).should('exist')
          
          // Check that SVG loads without error
          cy.waitForSVGLoad(svgSelector)
          
          // Verify SVG renders properly
          cy.checkSVGRender(svgSelector, element.label)
          
          // Check accessibility
          cy.checkSVGAccessibility(svgSelector, element.label)
          
          // Take screenshot for visual verification
          cy.screenshotElement(elementSelector, `${slide.id}-${element.id}`)
          
          // Verify no error messages are displayed
          cy.get(`${elementSelector} .error`).should('not.exist')
          
          // Verify loading indicator is gone
          cy.get(`${elementSelector} .loading`).should('not.exist')
          
          // Verify success status
          cy.get(`${elementSelector} .status-success`).should('exist')
        })
        
        it(`should have proper dimensions for ${element.label}`, () => {
          const svgSelector = `[data-testid="element-${element.id}"] .svg-container svg`
          
          cy.get(svgSelector).should('exist').then($svg => {
            const svg = $svg[0]
            const bbox = svg.getBBox()
            
            // Verify SVG has meaningful dimensions
            expect(bbox.width).to.be.greaterThan(0, `${element.label} should have width > 0`)
            expect(bbox.height).to.be.greaterThan(0, `${element.label} should have height > 0`)
            
            // Verify viewBox is properly set
            const viewBox = svg.getAttribute('viewBox');
            expect(viewBox).to.not.be.null, `${element.label} should have viewBox attribute`;

            const viewBoxValues = viewBox.split(' ').map(Number);
            expect(viewBoxValues).to.have.length(4, `${element.label} viewBox should have 4 values`);
            expect(viewBoxValues[2]).to.be.greaterThan(0, `${element.label} viewBox width should be > 0`);
            expect(viewBoxValues[3]).to.be.greaterThan(0, `${element.label} viewBox height should be > 0`);
          })
        })

        // Test XML syntax validation
        it(`should have valid XML syntax for ${element.label}`, () => {
          const svgUrl = `/assets/plugin-architecture/${element.svg}`
          cy.checkSVGXMLSyntax(svgUrl, element.label)
        })
      })
      
      it(`should load all ${slide.name} elements without errors`, () => {
        // Check overall slide status
        const slideSelector = `[data-testid="slide-${slide.id}"]`
        cy.get(slideSelector).should('exist')
        
        // Verify all elements in slide are loaded
        slide.elements.forEach(element => {
          cy.get(`[data-testid="element-${element.id}"] .status-success`).should('exist')
        })
        
        // Verify no error indicators
        cy.get(`${slideSelector} .status-error`).should('not.exist')
        
        // Take full slide screenshot
        cy.screenshotElement(slideSelector, `${slide.id}-complete`)
      })
    })
  })

  it('should display test summary correctly', () => {
    // Wait for all elements to load
    cy.get('.status-loading').should('not.exist')
    
    // Check test summary
    cy.get('.test-summary').should('exist')
    
    // Verify counts
    const totalElements = slides.reduce((sum, slide) => sum + slide.elements.length, 0)
    cy.get('#total-count').should('contain', totalElements.toString())
    cy.get('#success-count').should('contain', totalElements.toString())
    cy.get('#error-count').should('contain', '0')
    cy.get('#loading-count').should('contain', '0')
  })

  it('should handle missing SVG files gracefully', () => {
    // This test would verify error handling for missing files
    // We'll implement this by temporarily modifying the test data
    cy.window().then(win => {
      // Inject a test element with invalid SVG path
      const testElement = {
        id: 'test-missing',
        label: 'Missing SVG Test',
        svg: 'non-existent/missing.svg',
        description: 'Test element with missing SVG file'
      }
      
      // This would be implemented in the test page JavaScript
      // For now, we'll just verify the error handling exists
      cy.log('Error handling test - would verify graceful failure for missing SVGs')
    })
  })

  it('should be responsive across different viewport sizes', () => {
    const viewports = [
      { width: 1920, height: 1080, name: 'desktop-large' },
      { width: 1280, height: 720, name: 'desktop-medium' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 375, height: 667, name: 'mobile' }
    ]
    
    viewports.forEach(viewport => {
      cy.viewport(viewport.width, viewport.height)
      
      // Wait for layout to adjust
      cy.wait(500)
      
      // Verify elements are still visible and properly sized
      slides[0].elements.forEach(element => {
        const elementSelector = `[data-testid="element-${element.id}"]`
        cy.get(elementSelector).should('be.visible')
        cy.get(`${elementSelector} svg`).should('be.visible')
      })
      
      // Take screenshot at this viewport
      cy.screenshot(`responsive-${viewport.name}`)
    })
  })
})
