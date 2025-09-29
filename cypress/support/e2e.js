// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Custom command to check SVG rendering
Cypress.Commands.add('checkSVGRender', (selector, elementName) => {
  cy.get(selector).should('exist').within(() => {
    // Check that SVG element exists
    cy.get('svg').should('exist')
    
    // Check that SVG has proper dimensions
    cy.get('svg').should('have.attr', 'viewBox')
    
    // Check that SVG contains actual content (not just empty)
    cy.get('svg').should('not.be.empty')
    
    // Check for common SVG elements that indicate proper rendering
    cy.get('svg').then($svg => {
      const svgContent = $svg.html()
      expect(svgContent.length).to.be.greaterThan(10, `${elementName} SVG should have substantial content`)

      // Check for common SVG elements
      const hasElements = svgContent.includes('<g') ||
                         svgContent.includes('<rect') ||
                         svgContent.includes('<circle') ||
                         svgContent.includes('<path') ||
                         svgContent.includes('<text')

      expect(hasElements).to.be.true, `${elementName} SVG should contain drawable elements`;

      // Enhanced visual quality checks
      const hasVisualStyling = svgContent.includes('fill=') ||
                              svgContent.includes('stroke=') ||
                              svgContent.includes('style=') ||
                              svgContent.includes('class=')

      expect(hasVisualStyling).to.be.true, `${elementName} SVG should have visual styling (fill, stroke, style, or class attributes)`;

      // Check for excessive duplicate content (more than 3 identical substantial text elements might indicate generation issues)
      const textElements = (svgContent.match(/<text[^>]*>([^<]+)<\/text>/g) || [])
      if (textElements.length > 0) {
        const textCounts = {}
        textElements.forEach(element => {
          const text = element.match(/>([^<]+)</)[1]
          // Only count substantial text (more than 2 characters and not just punctuation/symbols)
          if (text.length > 2 && !/^[,.\[\]{}()]+$/.test(text)) {
            textCounts[text] = (textCounts[text] || 0) + 1
          }
        })

        if (Object.keys(textCounts).length > 0) {
          const maxDuplicates = Math.max(...Object.values(textCounts))
          const duplicateText = Object.keys(textCounts).find(key => textCounts[key] === maxDuplicates)
          expect(maxDuplicates).to.be.lessThan(4, `${elementName} SVG should not have excessive duplicate text elements (found ${maxDuplicates} copies of "${duplicateText}")`)
        }
      }
    })
  })
})

// Custom command to wait for SVG to load
Cypress.Commands.add('waitForSVGLoad', (selector, timeout = 5000) => {
  cy.get(selector, { timeout }).should('exist')
  cy.get(`${selector} svg`, { timeout }).should('exist')
  cy.get(`${selector} svg`, { timeout }).should('be.visible')
})
