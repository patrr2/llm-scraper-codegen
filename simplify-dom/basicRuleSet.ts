import {ElementUnfoldRule, NodeRemoveRule, ElementRemovePreChildrenRule, PreChildrenAction} from "./simplifyDom";

const elementUnfoldRules : ElementUnfoldRule[] = [
    {
        name: 'Unfold div containers with only one child',
        shouldUnfold: (element : Element) : boolean | undefined => {
            if (element.childNodes.length === 1 && element.isNonSemanticContainer()) {
                return true
            }
        },
        propagateAttributes: true
    }
]

const elementRemovePreChildrenRules  : ElementRemovePreChildrenRule[] = [
    {
        name: 'Remove SVGs',
        shouldRemove: (element : Element) : boolean | undefined => {
            if (element.getLowerCaseTagName() === 'svg') {
                return true
            }
        }
    },
    {
        name: 'Remove inherently non-visible elements',
        shouldRemove: (element : Element) : boolean | undefined => {
            if (['script', 'object', 'noscript', 'meta', 'style', 'source'].includes(element.getLowerCaseTagName())) {
                return true
            }
        }
    },
    {
        name: 'Remove iframe',
        shouldRemove: (element : Element) : boolean | undefined => {
            if (element.getLowerCaseTagName() === 'iframe') {
                return true
            }
        }
    },
    {
        name: 'Remove non-visible elements',
        shouldRemove: (element : Element) : boolean | undefined => {
            if (element.getOriginalElement().isNotVisibleAndCantHaveVisibleChildren()) {
                return true
            }
        }
    }
]

const nodeRemoveRules : NodeRemoveRule[] = [
    {
        name: 'Remove non-text non-element',
        shouldRemove: (node : Node) : boolean | undefined => {
            if (!(node instanceof Text) && !(node instanceof Element)) {
                return true
            }
        },
        log: false
    },
    {
        name: 'Remove empty text',
        shouldRemove: (node : Node) : boolean | undefined => {
            if (node instanceof Text && node.textContent?.trim() === '') {
                return true
            }
        },
        log: false
    },
    {
        name: 'Remove non-visible childrenless elements',
        shouldRemove: (element : Node) : boolean | undefined => {
            if (element.childNodes.length === 0 && !element.hasIndependentMeaning() && !element.hasPseudoElement() && !element.getOriginalNode().isVisibleOnScreen()) {
                return true
            }
        },
        log: false
    }
]

const preChildrenActions : PreChildrenAction[] = [
    {
        name: 'Remove tailwind classes',
        action: (element : Element) => {
            element.filterOutTailwindClasses()
        }
    },
    {
        name: 'Extract shadowroot',
        action: (element : Element) => {
            if (element.shadowRoot && element.shadowRoot.hasChildNodes()) {
                // console.log('extracting shadowroot for element', element.getOriginalElement())
                let i = 0
                for (let child of Array.from(element.shadowRoot.childNodes)) {
                    i++;
                    element.appendChild(child) // todo: prepend instead of append to keep order
                }
                // console.log('extracted', i, 'nodes')
            }
        }
    },
    {
        name: 'Remove unnecessary attributes',
        action: (element : Element) => {
            const simpleAttributes = new Set(['class', 'id', 'src', 'value', 'placeholder', 'title', 'aria-label', 'href'])

            for (let attr of Array.from(element.attributes)) {
                if (!(simpleAttributes.has(attr.name.toLowerCase()))) {
                    element.removeAttribute(attr.name)
                }
            }
        }
    },
    {
        name: 'Synthetic background-image style',
        action: (element : Element) => {
            if (element instanceof HTMLElement) {
                if (element.getCachedComputedStyle().backgroundImage !== 'none' && element.getCachedComputedStyle().backgroundColor !== '') {
                    let backgroundImage = element.getCachedComputedStyle().backgroundImage
                    let url = backgroundImage.match(/url\((.*)\)/)?.[1]
                    let newCssText;
                    if (url) {
                        newCssText = `background-image: url(${url.getFileName()})`
                    } else {
                        newCssText = `background-color: $backgroundImage}`
                    }
                    element.setAttribute('style', newCssText)
                }
            }
        }
    },
    {
        name: 'Simplify src path',
        action: (element : Element) => {
            let src = element.getAttribute('src')

            if (src) {
                element.setAttribute('src', src.getFileName())
            }
        }
    },
    {
        name: 'Replace clickable div with button',
        action: (element : Element) => {
            if (element.isClickable() && !element.isElementClickable() && !(element.parentElement?.isClickable() ?? false)) {
                element.replaceWithButton()
            }
        }
    },
    {
        name: 'add gpt-identifier',
        action: (element : Element) => {
            if (element instanceof Element) {
                const newAttribute = document.createAttribute('gpt-id');
                newAttribute.value = "el_" + Math.random().toString(36).substring(2)
                // element.attributes.setNamedItem(newAttribute)

                // @ts-ignore
                window[newAttribute.value] = element.getOriginalElement()
            }
        }
    },
    {
        name: 'Remove newlines from classnames',
        action: (element: Element) => {
            // replace new lines in classlist with spaces
            if (typeof element.className.replace === 'function') {
                element.className = element.className.replace(/\n/g, ' ')
            }
        }
    },
    {
        name: 'Remove empty class attribute',
        action: (element : Element) => {
            if (element.className === '') {
                element.removeAttribute('class')
            }
        }
    },
    {
        name: 'Strip href from query params',
        action: (element : Element) => {
            if (element.hasAttribute('href')) {
                element.setAttribute('href', element.getAttribute('href')!.split('?')[0])
            }
        }
    }
]

const basicRuleSet = {
    elementUnfoldRules,
    elementRemovePreChildrenRules,
    nodeRemoveRules,
    preChildrenActions
} as const

export default basicRuleSet