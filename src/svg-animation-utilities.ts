/**
 * SVG Animation Utilities for Element Visibility and Animation Control
 * 
 * Provides systematic utilities for controlling SVG element visibility and animations
 * with proper SVG syntax and browser compatibility.
 */

export interface TriggerCondition {
  type: 'time' | 'event';
  value: string | number; // time in seconds or event name
  duration?: number; // duration for the animation in seconds
}

export interface ElementSelector {
  type: 'id' | 'class' | 'tag' | 'attribute';
  value: string;
  attribute?: string; // for attribute-based selection
}

/**
 * Make an element disappear from SVG based on a trigger condition
 * Uses proper SVG animate elements with opacity animation
 */
export function makeElementDisappear(
  svgContent: string, 
  selector: ElementSelector, 
  trigger: TriggerCondition
): string {
  const elementPattern = createElementPattern(selector);
  const animationId = `disappear-${generateId()}`;
  
  // Create the disappear animation
  const disappearAnimation = createOpacityAnimation({
    id: animationId,
    from: '1',
    to: '0',
    begin: formatTrigger(trigger),
    dur: `${trigger.duration || 0.5}s`,
    fill: 'freeze' // Keep the element hidden after animation
  });

  return svgContent.replace(elementPattern, (match) => {
    // Check if element already has animations to avoid duplicates
    if (match.includes(`disappear-`) && match.includes('attributeName="opacity"')) {
      return match;
    }

    let result = match;

    // First, stop all animateTransform animations within this element
    const endValue = formatTrigger(trigger);
    result = stopElementAnimationInContent(result, endValue);

    // Add opacity animation to the main element (not nested elements)
    // This ensures the entire element and all its children fade out together

    // Handle self-closing elements
    if (result.endsWith('/>')) {
      // Convert self-closing to regular element with animation
      const tagMatch = result.match(/^<([^>\s]+)([^>]*)\/>/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const attributes = tagMatch[2];
        return `<${tagName}${attributes}>${disappearAnimation}</${tagName}>`;
      }
    }

    // Handle regular elements - insert animation right after the opening tag
    // This way the animation applies to the entire element group
    const openingTagMatch = result.match(/^(<[^>]+>)/);
    if (openingTagMatch) {
      const openingTag = openingTagMatch[1];
      const restOfContent = result.substring(openingTag.length);
      return `${openingTag}${disappearAnimation}${restOfContent}`;
    }

    return result;
  });
}

/**
 * Make an element appear in SVG based on a trigger condition
 * Uses proper SVG animate elements with opacity animation
 */
export function makeElementAppear(
  svgContent: string, 
  selector: ElementSelector, 
  trigger: TriggerCondition
): string {
  const elementPattern = createElementPattern(selector);
  const animationId = `appear-${generateId()}`;
  
  // Create the appear animation
  const appearAnimation = createOpacityAnimation({
    id: animationId,
    from: '0',
    to: '1',
    begin: formatTrigger(trigger),
    dur: `${trigger.duration || 0.5}s`,
    fill: 'freeze' // Keep the element visible after animation
  });

  return svgContent.replace(elementPattern, (match) => {
    // Check if element already has animations to avoid duplicates
    if (match.includes(`appear-`) && match.includes('attributeName="opacity"')) {
      return match;
    }

    // Set initial opacity to 0 if not already set
    let modifiedMatch = match;
    if (!match.includes('opacity=')) {
      if (match.endsWith('/>')) {
        modifiedMatch = match.replace('/>', ' opacity="0"/>');
      } else {
        modifiedMatch = match.replace(/(<[^>]+)>/, '$1 opacity="0">');
      }
    }

    // Handle self-closing elements
    if (modifiedMatch.endsWith('/>')) {
      // Convert self-closing to regular element with animation
      const tagMatch = modifiedMatch.match(/^<([^>\s]+)([^>]*)\/>/);
      if (tagMatch) {
        const tagName = tagMatch[1];
        const attributes = tagMatch[2];
        return `<${tagName}${attributes}>${appearAnimation}</${tagName}>`;
      }
    }

    // Handle regular elements - insert animation before the last closing tag
    const lastClosingTagIndex = modifiedMatch.lastIndexOf('</');
    if (lastClosingTagIndex !== -1) {
      const beforeClosing = modifiedMatch.substring(0, lastClosingTagIndex);
      const closingTag = modifiedMatch.substring(lastClosingTagIndex);
      return `${beforeClosing}${appearAnimation}${closingTag}`;
    }

    return modifiedMatch;
  });
}

/**
 * Stop animation of an element based on a trigger condition
 * Modifies existing animateTransform elements to include end conditions
 */
export function stopElementAnimation(
  svgContent: string, 
  selector: ElementSelector, 
  trigger: TriggerCondition
): string {
  const elementPattern = createElementPattern(selector);
  
  return svgContent.replace(elementPattern, (match) => {
    const endValue = formatTrigger(trigger);
    return stopElementAnimationInContent(match, endValue);
  });
}

/**
 * Start animation of an element based on a trigger condition
 * Modifies existing animateTransform elements to include begin conditions
 */
export function startElementAnimation(
  svgContent: string, 
  selector: ElementSelector, 
  trigger: TriggerCondition
): string {
  const elementPattern = createElementPattern(selector);
  
  return svgContent.replace(elementPattern, (match) => {
    const beginValue = formatTrigger(trigger);
    return startElementAnimationInContent(match, beginValue);
  });
}

// Helper functions

/**
 * Stop all animateTransform animations in content by adding end attributes
 */
function stopElementAnimationInContent(content: string, endValue: string): string {
  // Handle both single-line and multi-line animateTransform elements
  // This regex matches the complete animateTransform element including attributes across multiple lines
  const animatePattern = /<animateTransform\s+([^>]*?)(\s*\/?)>/gs;

  return content.replace(animatePattern, (match, attributesContent, selfClosing) => {
    // Clean up the attributes content (remove extra whitespace and newlines)
    const cleanAttributes = attributesContent.replace(/\s+/g, ' ').trim();

    // Check if end attribute already exists
    if (cleanAttributes.includes('end=')) {
      return match; // Don't modify if end already exists
    }

    // Add end attribute to stop the animation
    if (selfClosing.trim() === '/') {
      return `<animateTransform ${cleanAttributes} end="${endValue}"/>`;
    } else {
      return `<animateTransform ${cleanAttributes} end="${endValue}">`;
    }
  });
}

/**
 * Start all animateTransform animations in content by adding/updating begin attributes
 */
function startElementAnimationInContent(content: string, beginValue: string): string {
  // Handle both single-line and multi-line animateTransform elements
  const animatePattern = /<animateTransform\s+([^>]*?)(\s*\/?)>/gs;

  return content.replace(animatePattern, (match, attributesContent, selfClosing) => {
    // Clean up the attributes content (remove extra whitespace and newlines)
    const cleanAttributes = attributesContent.replace(/\s+/g, ' ').trim();

    let updatedAttributes;
    // Check if begin attribute already exists
    if (cleanAttributes.includes('begin=')) {
      // Replace existing begin value
      updatedAttributes = cleanAttributes.replace(/begin="[^"]*"/, `begin="${beginValue}"`);
    } else {
      // Add begin attribute
      updatedAttributes = `${cleanAttributes} begin="${beginValue}"`;
    }

    // Return properly formatted element
    if (selfClosing.trim() === '/') {
      return `<animateTransform ${updatedAttributes}/>`;
    } else {
      return `<animateTransform ${updatedAttributes}>`;
    }
  });
}

function createElementPattern(selector: ElementSelector): RegExp {
  switch (selector.type) {
    case 'id':
      // Match self-closing elements first, then regular elements
      return new RegExp(`<[^>]*id="${escapeRegex(selector.value)}"[^>]*/>|<([^>\\s]+)[^>]*id="${escapeRegex(selector.value)}"[^>]*>.*?</\\1>`, 'gs');
    case 'class':
      return new RegExp(`<[^>]*class="[^"]*${escapeRegex(selector.value)}[^"]*"[^>]*/>|<([^>\\s]+)[^>]*class="[^"]*${escapeRegex(selector.value)}[^"]*"[^>]*>.*?</\\1>`, 'gs');
    case 'tag':
      // Handle both self-closing and regular tags
      return new RegExp(`<${escapeRegex(selector.value)}[^>]*/>|<${escapeRegex(selector.value)}[^>]*>.*?</${escapeRegex(selector.value)}>`, 'gs');
    case 'attribute':
      if (!selector.attribute) throw new Error('Attribute name required for attribute selector');
      return new RegExp(`<[^>]*${escapeRegex(selector.attribute)}="${escapeRegex(selector.value)}"[^>]*/>|<([^>\\s]+)[^>]*${escapeRegex(selector.attribute)}="${escapeRegex(selector.value)}"[^>]*>.*?</\\1>`, 'gs');
    default:
      throw new Error(`Unsupported selector type: ${selector.type}`);
  }
}

function createOpacityAnimation(options: {
  id: string;
  from: string;
  to: string;
  begin: string;
  dur: string;
  fill: string;
}): string {
  return `<animate id="${options.id}" attributeName="opacity" from="${options.from}" to="${options.to}" begin="${options.begin}" dur="${options.dur}" fill="${options.fill}"/>`;
}

function formatTrigger(trigger: TriggerCondition): string {
  if (trigger.type === 'time') {
    return `${trigger.value}s`;
  } else {
    return trigger.value.toString();
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}
