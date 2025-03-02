
interface DOMRectList {
    closestToUpperLeftCorner(): number | null;
}

interface DOMRect {
    centerPoint(): { x: number, y: number };
    centerDistanceTo(other: DOMRect): number;
    minimumEdgeDistanceTo(otherRect: DOMRect): number;
    visualize(color: string, innerText ?: string, innerTextAlignment ?: 0 | 1 | 2 | 3): void;
    ensureVisualizationStyles() : void;
}

interface Document {
    visualizationStylesAdded ?: boolean;
}

interface Array<T> {
    closestToUpperLeftCorner(this: Array<DOMRect>): number | null;
}

interface DOMRect {
    getNominalPositionTo(other: DOMRect): 'right' | 'left' | 'up' | 'down';
    isInViewport(): boolean;
    isInPage() : boolean;
}

Array.prototype.closestToUpperLeftCorner = function () : (number | null) {
    let closestIndex = -1;
    let closestDistance = Infinity;

    for (let i = 0; i < this.length; i++) {
        const rect = this[i];
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;

        const distance = Math.sqrt(centerX ** 2 + centerY ** 2);

        if (distance < closestDistance) {
            closestIndex = i;
            closestDistance = distance;
        }
    }

    return closestIndex === -1 ? null : closestIndex;
};

const visualizedDomRules = `display: flex;
all:initial;
position: absolute;
background: transparent;
pointer-events: none;
z-index: 99999999;
font-size: 10px;` 

DOMRect.prototype.ensureVisualizationStyles = function () : void {
    if (document.visualizationStylesAdded) return // already added

    const styleElement = document.createElement('style');
    styleElement.setAttribute('nonce', '<?= $nonce ?>'); // ?? and learn csp
    styleElement.id = 'dom-rect-visualization-styles';
    document.head.appendChild(styleElement);

    // Get a reference to the stylesheet
    const styleSheet = styleElement.sheet;

    // Add a new style rule
    const newRule = `.visualized-dom-rect {
        ${visualizedDomRules}
    }`
    const ruleIndex = styleSheet!.insertRule(newRule);
    console.log(`Added rule at index ${ruleIndex}: ${newRule}`);

    document.visualizationStylesAdded = true
}

DOMRect.prototype.centerPoint = function() {
    return {
        x: this.left + (this.width / 2),
        y: this.top + (this.height / 2)
    };
};

DOMRect.prototype.centerDistanceTo = function(other) {
    const thisCenter = this.centerPoint();
    const otherCenter = other.centerPoint();

    return Math.sqrt(
        (thisCenter.x - otherCenter.x) ** 2 +
        (thisCenter.y - otherCenter.y) ** 2
    );
};

DOMRect.prototype.minimumEdgeDistanceTo = function(otherRect: DOMRect): number {
    let horizontalDistance: number, verticalDistance: number;

    // Calculate horizontal distance
    if (this.right < otherRect.left) {
        // this rectangle is to the left of otherRect
        horizontalDistance = otherRect.left - this.right;
    } else if (this.left > otherRect.right) {
        // this rectangle is to the right of otherRect
        horizontalDistance = this.left - otherRect.right;
    } else {
        // Overlap exists in the horizontal dimension
        horizontalDistance = 0;
    }

    // Calculate vertical distance
    if (this.bottom < otherRect.top) {
        // this rectangle is above otherRect
        verticalDistance = otherRect.top - this.bottom;
    } else if (this.top > otherRect.bottom) {
        // this rectangle is below otherRect
        verticalDistance = this.top - otherRect.bottom;
    } else {
        // Overlap exists in the vertical dimension
        verticalDistance = 0;
    }

    // Return the minimum of the horizontal and vertical distances
    return Math.sqrt(horizontalDistance*horizontalDistance + verticalDistance*verticalDistance);
};
  
DOMRect.prototype.getNominalPositionTo = function (other: DOMRect): 'right' | 'left' | 'up' | 'down' {
    if (this.right < other.left) {
        return 'left';
    } else if (this.left > other.right) {
        return 'right';
    } else if (this.bottom < other.top) {
        return 'up';
    } else if (this.top > other.bottom) {
        return 'down';
    } else {
        throw new Error('Rectangles are intersecting along the X-axis.');
    }
}

DOMRect.prototype.visualize = function (color: string, innerText : string = '', innerTextAlignment : 0 | 1 | 2 | 3 = 0): void {
    let failed = false
    try {
        this.ensureVisualizationStyles()
    } catch(e) {
        failed = true
    }

    const rectElement = document.createElement('div');
    rectElement.classList.add('visualized-dom-rect');
    if (failed) {
        rectElement.style.cssText = visualizedDomRules
    }
    rectElement.style.display = 'flex';
    rectElement.style.left = this.x + 'px';
    rectElement.style.top = this.y + 'px';
    rectElement.style.width = this.width + 'px';
    rectElement.style.height = this.height + 'px';
    rectElement.style.border = '1px solid ' + color;
    rectElement.style.color = color;

    switch (innerTextAlignment) {
        case 0:
            rectElement.style.textAlign = 'left'
            rectElement.style.justifyContent = 'flex-start'
            break;
        case 1:
            rectElement.style.textAlign = 'right'
            rectElement.style.justifyContent = 'flex-end'
            break;
        case 2:
            rectElement.style.textAlign = 'left'
            rectElement.style.justifyContent = 'flex-end'
            break;
        case 3:
            rectElement.style.textAlign = 'right'
            rectElement.style.justifyContent = 'flex-start'
            break;

    }


    rectElement.innerHTML = innerText
  
    document.body.appendChild(rectElement);
};

DOMRect.prototype.isInViewport = function (): boolean {
    // Get the viewport dimensions
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;

    // Check if any part of the DOMRect's horizontal is within the viewport's horizontal
    const isInHorizontal = (this.left >= 0 && this.left < viewportWidth) || 
                           (this.right > 0 && this.right <= viewportWidth) || 
                           (this.left <= 0 && this.right >= viewportWidth);

    // Check if any part of the DOMRect's vertical is within the viewport's vertical
    const isInVertical = (this.top >= 0 && this.top < viewportHeight) || 
                         (this.bottom > 0 && this.bottom <= viewportHeight) || 
                         (this.top <= 0 && this.bottom >= viewportHeight);

    // Return true if both checks pass
    return isInHorizontal && isInVertical;
}

DOMRect.prototype.isInPage = function (): boolean {
    // Get the viewport dimensions
    const pageWidth = document.body.offsetWidth;
    const pageHeight = document.body.offsetHeight;

    // Check if any part of the DOMRect's horizontal is within the viewport's horizontal
    const isInHorizontal = (this.left >= 0 && this.left < pageWidth) || 
                           (this.right > 0 && this.right <= pageWidth) || 
                           (this.left <= 0 && this.right >= pageWidth);

    // Check if any part of the DOMRect's vertical is within the viewport's vertical
    const isInVertical = (this.top >= 0 && this.top < pageHeight) || 
                         (this.bottom > 0 && this.bottom <= pageHeight) || 
                         (this.top <= 0 && this.bottom >= pageHeight);

    // Return true if both checks pass
    return isInHorizontal && isInVertical;
}

interface Element {
    getMaxDistanceToCommonAncestor(otherElement: Element): number;
    computedStyle?: CSSStyleDeclaration;
    getCachedComputedStyle(): CSSStyleDeclaration;
    updateCachedComputedStyle(): void;
    getUpperCaseTagName(): string;
    checkParentsCssVisibility(maxDepth ?: number): boolean;
    filterOutTailwindClasses(): void;
}

interface Node {
    isClickable(ignoreCache ?: boolean): boolean;
    isCssClickable(ignoreCache ?: boolean): boolean;
    isElementClickable(): boolean;
    isVisibleOnScreen(): boolean;
    boundingClientRect?: DOMRect;
    getCachedBoundingClientRect(ignoreCache ?: boolean): DOMRect;
    updateCachedBoundingClientRect(): void;
    upperCaseTagName() : string;
    getLowerCaseTagName() : string;
    canHaveVisibleChildren() : boolean;
    moveUp() : void;
}

interface Element {
    replaceWithButton(): void;
    removeClassesThatDontPassFilter(filter: (className: string) => boolean): void;
}

Element.prototype.removeClassesThatDontPassFilter = function(filter : (className : string) => boolean) : void {
    let classes = Array.from(this.classList)
    for (let className of classes) {
        if (!filter(className)) {
            this.classList.remove(className)
        }
    }
}

  
  // Implement the replaceWithButton() method
  Element.prototype.replaceWithButton = function () {
    // Ensure the element is an HTMLElement
    if (!(this instanceof HTMLElement)) {
      console.error("Element is not an HTMLElement.");
      return;
    }
  
    // Create a new button element
    const buttonElement = document.createElement("button");
  
    // Copy attributes from the current element to the button
    for (const attr of Array.from(this.attributes)) {
      buttonElement.setAttribute(attr.name, attr.value);
    }
  
    // Copy children from the current element to the button
    while (this.firstChild) {
      buttonElement.appendChild(this.firstChild);
    }
  
    // Replace the current element with the button in the DOM
    this.parentNode?.replaceChild(buttonElement, this);
};


// Implement the moveUp() method
Node.prototype.moveUp = function () {
    if (this.parentNode) {
      this.parentNode.parentNode?.insertBefore(this, this.parentNode);
    }
}

Element.prototype.checkParentsCssVisibility = function (maxDepth : number = 10) : boolean {
    let currentElement : Element | null = this
    let depth = 0
    while (currentElement !== null && depth < maxDepth) {
        if (currentElement.getCachedComputedStyle().visibility === 'hidden' || currentElement.getCachedComputedStyle().display === 'none' || currentElement.getCachedComputedStyle().opacity === '0') {
            return false
        }

        currentElement = currentElement.parentElement
        depth++
    }

    return true
}

Element.prototype.getCachedComputedStyle = function (): CSSStyleDeclaration {
    if (this.computedStyle !== undefined) {
        return this.computedStyle
    }

    this.computedStyle = window.getComputedStyle(this);
    return this.computedStyle
}

Element.prototype.updateCachedComputedStyle = function (): void {
    this.computedStyle = window.getComputedStyle(this);
}

Node.prototype.getCachedBoundingClientRect = function (ignoreCache : boolean = false): DOMRect {
    if (this.boundingClientRect !== undefined && !ignoreCache) {
        return this.boundingClientRect
    }

    if (this instanceof Element) {
        this.boundingClientRect = this.getBoundingClientRect();
        return this.boundingClientRect
    } else if (this instanceof Text) {
        const range = document.createRange();
        range.selectNode(this);
        this.boundingClientRect = range.getBoundingClientRect();
        return this.boundingClientRect
    }

    console.dir(this)
    throw new Error('Unknown node type')
}

Element.prototype.getUpperCaseTagName = function () : string {
    return this.tagName.toUpperCase()
}

Element.prototype.getLowerCaseTagName = function () : string {
    return this.tagName.toLowerCase()
}


Node.prototype.updateCachedBoundingClientRect = function (): void {
    this.boundingClientRect = this.getCachedBoundingClientRect(true);
}

Node.prototype.isCssClickable = function (ignoreCache = false): boolean {
    if (!(this instanceof Element)) return false
    if (ignoreCache) this.updateCachedComputedStyle()

    return this.getCachedComputedStyle().cursor === 'pointer'
}

Node.prototype.isElementClickable = function (): boolean {
    if (!(this instanceof Element)) return false

    let isButtonEl = this.getUpperCaseTagName() === 'BUTTON' || this.getUpperCaseTagName() === 'A'
    let isSubmitButton = this.getUpperCaseTagName() === 'INPUT' && (this as HTMLInputElement).type === 'submit'

    return isButtonEl || isSubmitButton
}

Node.prototype.isClickable = function (ignoreCache = false): boolean {
    return this.isCssClickable(ignoreCache) || this.isElementClickable()
}

Node.prototype.canHaveVisibleChildren = function (): boolean {
    if (!(this instanceof Element)) {
        return false
    }

    if (this.getCachedComputedStyle().visibility === 'hidden' || this.getCachedComputedStyle().display === 'none' || this.getCachedComputedStyle().opacity === '0') {
        return false
    }

    if (this.getCachedBoundingClientRect().width === 0 || this.getCachedBoundingClientRect().height === 0) {
        if (this.getCachedComputedStyle().overflow === 'hidden') {
            return false
        }
    }

    return true
}


interface Node {
    hasIndependentMeaning(): boolean;
    hasPseudoElement(): boolean;
}

Node.prototype.hasPseudoElement = function (): boolean {
    if (this instanceof Element) {
        return ['::before', '::after'].some(pseudoElement => this.getCachedComputedStyle().content.includes(pseudoElement))
    } else {
        return false
    }
}

interface Element {
    isNotVisibleAndCantHaveVisibleChildren(): boolean;
    hasDependentMeaning(): boolean;
    isNonSemanticContainer(): boolean;
    isSemanticContainer(): boolean;
}




Element.prototype.isNotVisibleAndCantHaveVisibleChildren = function (parentIsVisible : true = true): boolean {
    if (!parentIsVisible) throw new Error("parentIsVisible must be true")

    if (this.getCachedComputedStyle().visibility === 'hidden' || this.getCachedComputedStyle().display === 'none' || this.getCachedComputedStyle().opacity === '0') {
        return true
    }

    if (this.getCachedBoundingClientRect().width === 0 || this.getCachedBoundingClientRect().height === 0) {
        if (this.getCachedComputedStyle().overflow === 'hidden') {
            return true
        }
    }

    return false
}

// Three categories of nodes with "Inherint Meaning" or "Independent Meanign" or "Meaning independent of children":
// Media (e.g. img src, video), Interactive (e.g. button, input), Text (non-whitespace text nodes), Informative (e.g. progress bar)
// these should not be removed when simplifying the dom

// One category of nodes is "containers", or nodes with "Dependent Meaning" or "Meaning only with 'children with inherit meaning'":
// subcategory is SemanticContainers, which can exist with one child, and another is DivContainers, which can only exist with >= 2 children

Node.prototype.hasIndependentMeaning = function (): boolean {
    if (this instanceof Text) {
        return this.textContent !== null && this.textContent.trim() !== ''
    }

    if (this instanceof Element) {
        let tagName = this.getUpperCaseTagName()

        if (['IMG', 'SVG', 'INPUT', 'BUTTON', 'A', 'SELECT', 'OPTION', 'VIDEO'].includes(tagName)) {
            return true
        }

        if (this instanceof HTMLDivElement){
            if (this.isImage()) {
                return true
            }
        }
    }

    return false
}

Element.prototype.isNonSemanticContainer = function (): boolean {
    return (!(this instanceof HTMLDivElement) || !this.isImage()) && (!this.isClickable() || (this.parentElement?.isClickable() ?? false)) && !['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'tfoot', 'dl', 'dt', 'dd', 'blockquote', 'address', 'article', 'aside', 'details', 'dialog', 'summary', 'fieldset', 'figure', 'figcaption', 'footer', 'header', 'main', 'mark', 'nav', 'section', 'summary', 'time'].includes(this.getLowerCaseTagName())
}

Node.prototype.isVisibleOnScreen = function (minArea = 5): boolean {
    if (!(this instanceof Element)) {
        return this.parentElement?.isVisibleOnScreen() ?? false
    }

    let target : Element = this


    let computedStyle = target.getCachedComputedStyle()
    let offsetWidth = 'offsetWidth' in target && target.offsetWidth !== null && target.offsetWidth !== 0
    let offsetHeight = 'offsetHeight' in target && target.offsetHeight !== null && target.offsetHeight !== 0
    let isInViewport = target.getCachedBoundingClientRect().isInViewport()
    let isInPage = target.getCachedBoundingClientRect().isInPage()
    let isMinArea = target.getCachedBoundingClientRect().width * target.getCachedBoundingClientRect().height >= minArea
    let isVisible = computedStyle.visibility !== 'hidden' && computedStyle.display !== 'none' && computedStyle.opacity !== '0'
    let isSvg = target.getUpperCaseTagName() === 'SVG'
    let doesnHaveClip = true
    if (computedStyle.clip !== 'auto' && computedStyle.clip !== 'initial' && computedStyle.clip !== 'inherit' && computedStyle.clip !== 'none') {
        // calculate area
        let clip = computedStyle.clip
        let clipRect = clip.substring(5, clip.length - 1).split(',').map(x => parseFloat(x))
        let clipArea = (clipRect[2] - clipRect[0]) * (clipRect[3] - clipRect[1])
        if (clipArea < minArea) {
            doesnHaveClip = false
        }
    }

    // limitation : if parent boundingclientrectarea is 0, then it will not be visible but this will return true

    // console.log('checking', target, offsetWidth, offsetHeight, isInViewport, isVisible)
    if (isMinArea && isInPage && isVisible && doesnHaveClip) { 
        if (isSvg || (offsetWidth && offsetHeight)) {
            if (!(this instanceof HTMLDivElement) || this.isImage()) {
                return true
            }
        }
    }

    return false
};

Element.prototype.getMaxDistanceToCommonAncestor = function (otherElement: Element): number {
    const ancestors1: Element[] = [];
    let currentElement: Element | null = this;

    while (currentElement) {
        ancestors1.push(currentElement);
        currentElement = currentElement.parentElement;
    }

    currentElement = otherElement;
    let maxDistance = 0;
    let distance = 0;

    while (currentElement) {
        const index = ancestors1.indexOf(currentElement);
        if (index !== -1) {
            maxDistance = Math.max(maxDistance, distance + index);
        }
        currentElement = currentElement.parentElement;
        distance++;
    }

    return maxDistance;
};


interface String {
    getFileName(): string;
}

String.prototype.getFileName = function () : string {
    return this.split('/').pop()!.split('#')[0].split('?')[0];
}

interface HTMLDivElement {
    isImage(): boolean;
}

// div has background image and the image filename does not contain 'bg' or 'background'
HTMLDivElement.prototype.isImage = function () : boolean {
    if (this.getCachedComputedStyle().backgroundImage !== 'none') {
        let backgroundImage = this.getCachedComputedStyle().backgroundImage
        let url = backgroundImage.match(/url\((.*)\)/)?.[1]
        if (url) {
            let fileName = url.getFileName()
            if (!fileName.includes('bg') && !fileName.includes('background')) {
                return true
            }
        }
    }

    return false
}

interface Element {
    deepCloneWithReferences(): Element;
    deepCloneWithReferencesAndShadows(): Element;
    getOriginalElement: () => Element;
}

interface Node {
    originalNode?: Node;
    getOriginalNode: () => Node
}

Element.prototype.getOriginalElement = function() : Element {
    if (this.originalNode === undefined) {
        return this // this is the original node
    }

    return this.originalNode as Element
}


Node.prototype.getOriginalNode = function() : Node {
    if (this.originalNode === undefined) {
        return this // this is the original node
    }

    return this.originalNode
}

Element.prototype.deepCloneWithReferences = function() {
    let clone = this.cloneNode(true) as Element;

    const addReferences = () => {
        const getOrderedNodeList = (element : Node) => {
            let allNodes = [element];
            for (let child of Array.from(element.childNodes)) {
                allNodes.push(...getOrderedNodeList(child));
            }
            return allNodes;
        }

        let originalNodes = getOrderedNodeList(this);
        let clonedNodes = getOrderedNodeList(clone);

        if (originalNodes.length !== clonedNodes.length) {
            throw new Error('originalNodes.length !== clonedNodes.length');
        }

        for (let i = 0; i < originalNodes.length; i++) {
            let originalNode = originalNodes[i]; 
            let clonedNode = clonedNodes[i];

            // console.log('adding reference', originalNode, clonedNode);
            clonedNode.originalNode = originalNode;
        }
    }

    addReferences()

    return clone;
}

Element.prototype.deepCloneWithReferencesAndShadows = function() {
    let clone = this.cloneNode(true) as Element;

    // Function to recursively clone shadow roots with stack safety
    const cloneShadowRoots = (originalNode: Node, clonedNode: Node) => {
        // Use a stack-based approach instead of recursion
        const nodePairs = [{original: originalNode, clone: clonedNode}];
        
        while (nodePairs.length > 0) {
            const {original, clone} = nodePairs.pop()!;
            
            if (original instanceof Element && clone instanceof Element) {
                const originalShadowRoot = original.shadowRoot;
                if (originalShadowRoot) {
                    if (!clone.shadowRoot) {
                        // Create a new shadow root on the cloned element with the same mode
                        const clonedShadowRoot = clone.attachShadow({ mode: originalShadowRoot.mode });
                        
                        // Clone all child nodes from the original shadow root
                        Array.from(originalShadowRoot.childNodes).forEach(ogChild => {
                            const cloned = ogChild.cloneNode(true);
                            clonedShadowRoot.appendChild(cloned);
                        });
                        
                        // Queue up shadow root children for processing
                        Array.from(originalShadowRoot.children).forEach((child, i) => {
                            if (clonedShadowRoot.children[i]) {
                                nodePairs.push({
                                    original: child, 
                                    clone: clonedShadowRoot.children[i]
                                });
                            }
                        });
                    } else {
                        console.log('warning, shadow root already exists in clone unexpectedly');
                    }
                }
            }
            
            // Queue up regular children for processing
            if (original.childNodes.length > 0) {
                Array.from(original.childNodes).forEach((child, i) => {
                    if (clone.childNodes[i]) {
                        nodePairs.push({
                            original: child,
                            clone: clone.childNodes[i]
                        });
                    }
                });
            }
        }
    };

    // Clone shadow roots starting from the root elements
    cloneShadowRoots(this, clone);
    
    // Add references using a non-recursive approach
    const addReferences = () => {
        const originalNodes: Node[] = [];
        const clonedNodes: Node[] = [];
        
        // Traverse the original tree non-recursively
        const traverseTree = (rootOriginal: Node, rootClone: Node) => {
            const stack = [{original: rootOriginal, clone: rootClone}];
            
            while (stack.length > 0) {
                const {original, clone} = stack.pop()!;
                
                originalNodes.push(original);
                clonedNodes.push(clone);
                
                // If the node is an element with a shadow root, process the shadow root
                if (original instanceof Element && clone instanceof Element) {
                    if (original.shadowRoot && clone.shadowRoot) {
                        stack.push({
                            original: original.shadowRoot,
                            clone: clone.shadowRoot
                        });
                    }
                }
                
                // Process children in reverse order (since we're using a stack)
                const originalChildren = Array.from(original.childNodes).reverse();
                const clonedChildren = Array.from(clone.childNodes).reverse();
                
                for (let i = 0; i < originalChildren.length; i++) {
                    stack.push({
                        original: originalChildren[i],
                        clone: clonedChildren[i]
                    });
                }
            }
        };
        
        traverseTree(this, clone);
        
        // Assign original references to cloned nodes
        for (let i = 0; i < originalNodes.length; i++) {
            (clonedNodes[i] as any).originalNode = originalNodes[i];
        }
    };
    
    addReferences();
    
    return clone;
};

interface Element {
    unfold(processChild : (el : Node) => void): Node[]
    concatPropertiesFrom(element : Element, properties : Set<string> | 'ALL') : void
}

Element.prototype.concatPropertiesFrom = function(element : Element, properties : Set<string> | 'ALL') : void {

    for (let attr of Array.from(element.attributes)) {
        if (properties === 'ALL' || properties.has(attr.name.toLowerCase())) {
            if (this.hasAttribute(attr.name)) {
                this.setAttribute(attr.name, this.getAttribute(attr.name) + ' ' + attr.value) // todo: add trimming
            } else {
                this.setAttribute(attr.name, attr.value)
            }
        }
    }
}

// move all children one level up and remove this element. Return moved children
Element.prototype.unfold = function(processChild : (el : Node) => void = (el : Node) => null) : Node[] {
    let children = Array.from(this.childNodes)
    let parent = this.parentElement
    if (parent) {
        for (let child of children) {
            parent.insertBefore(child, this)
            processChild(child)
        }
        parent.removeChild(this)
    }

    return children
}

Element.prototype.filterOutTailwindClasses = function() : void {
    // Define a list of Tailwind prefixes to filter out
    const tailwindClassStarts = ['sm:', 'md:', 'lg:', 'xl:', '2xl:', 'xs:', 'nd:', 'hover:', 'focus:', 'active:', 'disabled:', 'checked:', 'group-hover:', 'group-focus:', 'focus-within:', 'focus-visible:', 'dark:', 'light:', 'motion-safe:', 'motion-reduce:', 'portrait:', 'landscape:', 'first:', 'last:', 'odd:', 'even:', 'only:', 'target:', 'default:', 'indeterminate:', 'required:', 'valid:', 'invalid:', 'placeholder-shown:', 'autofill:', 'read-only:', 'empty:', 'before:', 'after:', 'first-line:', 'first-letter:', 'marker:', 'selection:', 'file:', 'backdrop:', 'container', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid', 'inline-grid', 'table', 'hidden', 'static', 'fixed', 'absolute', 'relative', 'sticky', 'inset-', 'top-', 'right-', 'bottom-', 'left-', 'z-', 'float-', 'clear-', 'm-', 'mt-', 'mr-', 'mb-', 'ml-', 'mx-', 'my-', 'p-', 'pt-', 'pr-', 'pb-', 'pl-', 'px-', 'py-', 'gap-', 'space-x-', 'space-y-', 'w-', 'min-w-', 'max-w-', 'h-', 'min-h-', 'max-h-', 'aspect-', 'font-', 'text-', 'align-', 'leading-', 'tracking-', 'underline', 'line-through', 'no-underline', 'uppercase', 'lowercase', 'capitalize', 'truncate', 'text-ellipsis', 'text-clip', 'list-', 'bg-', 'bg-gradient-to-', 'from-', 'via-', 'to-', 'bg-opacity-', 'border-', 'border-t-', 'border-dashed', 'border-dotted', 'rounded-', 'rounded-t-', 'rounded-b-', 'divide-x-', 'divide-y-', 'divide-', 'ring-', 'ring-offset-', 'shadow-', 'opacity-', 'mix-blend-', 'bg-blend-', 'transition-', 'duration-', 'ease-', 'delay-', 'animate-', 'transform', 'scale-', 'rotate-', 'translate-x-', 'skew-x-', 'origin-', 'cursor-', 'resize-', 'scroll-', 'snap-', 'overscroll-', 'select-', 'fill-', 'stroke-', 'stroke-w-', 'sr-only', 'not-sr-only', 'table-', 'border-collapse', 'border-spacing-', 'flex-', 'flex-row', 'flex-col', 'flex-wrap', 'order-', 'grow-', 'shrink-', 'grid-cols-', 'grid-rows-', 'col-', 'row-', 'auto-cols-', 'auto-rows-', 'columns-', 'filter', 'blur-', 'brightness-', 'contrast-', 'backdrop-filter', 'backdrop-blur-', 'no-visited', 'visible', 'invisible', 'prose', 'form-', 'line-clamp-', 'enabled:', 'embed-s:', 'items-center', 'pointer-events', 'justify-center', 'overflow-', '-', '[', 'whitespace-', 'justify-', 's:', 'm:', 'l:', 'outline-', 'placeholder:', 'subgrid',];

    // Split the className into individual classes
    const classes = this.className.split(' ');

    // Filter out classes that match any Tailwind prefix
    const filteredClasses = classes.filter(cls => {
        return !tailwindClassStarts.some(prefix => cls.startsWith(prefix));
    });

    // Join the remaining classes back into a single string
    this.className = filteredClasses.filter(x => x).join(' ');
}

