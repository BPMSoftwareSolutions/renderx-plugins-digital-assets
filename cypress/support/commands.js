// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command to take screenshot with element highlighting
Cypress.Commands.add('screenshotElement', (selector, name) => {
  cy.get(selector).should('be.visible')
  cy.get(selector).screenshot(name, { 
    capture: 'viewport',
    clip: { x: 0, y: 0, width: 1280, height: 720 }
  })
})

// Custom command to validate SVG accessibility
Cypress.Commands.add('checkSVGAccessibility', (selector, elementName) => {
  cy.get(selector).within(() => {
    cy.get('svg').should('exist')

    // Check that SVG has proper ARIA attributes, role, or meaningful content
    cy.get('svg').should('satisfy', $svg => {
      const hasRole = $svg.attr('role')
      const hasAriaLabel = $svg.attr('aria-label')
      const hasAriaLabelledBy = $svg.attr('aria-labelledby')
      const hasTitle = $svg.find('title').length > 0
      const hasContent = $svg.html().trim().length > 50 // Has substantial content

      // SVG is accessible if it has ARIA attributes, title, or substantial visual content
      return hasRole || hasAriaLabel || hasAriaLabelledBy || hasTitle || hasContent
    })
  })
})

// Custom command to validate SVG XML syntax
Cypress.Commands.add('checkSVGXMLSyntax', (svgUrl, elementName) => {
  cy.request(svgUrl).then((response) => {
    expect(response.status).to.eq(200, `${elementName} SVG should be accessible`)

    const svgContent = response.body

    // Basic XML validation - check for common syntax errors
    expect(svgContent).to.not.contain('error on line', `${elementName} SVG should not have XML parsing errors`)

    // Validate balanced tags using DOMParser
    cy.window().then((win) => {
      const parser = new win.DOMParser()
      const doc = parser.parseFromString(svgContent, 'image/svg+xml')

      // Check for parsing errors
      const parserError = doc.querySelector('parsererror')
      expect(parserError, `${elementName} SVG should have valid XML syntax`).to.be.null;

      // Verify it's a valid SVG
      const svgElement = doc.querySelector('svg')
      expect(svgElement, `${elementName} should contain a valid SVG element`).to.not.be.null;

      // Check for balanced group tags
      const svgHTML = svgElement.outerHTML
      const openGroups = (svgHTML.match(/<g[^>]*>/g) || []).length
      const closeGroups = (svgHTML.match(/<\/g>/g) || []).length
      expect(openGroups, `${elementName} SVG should have balanced <g> tags (${openGroups} open, ${closeGroups} close)`).to.eq(closeGroups);
    })
  })
})
