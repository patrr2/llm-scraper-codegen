import './domUtils'

export interface Rule {}

export interface ElementUnfoldRule extends Rule { // Rule for unfolding elements (moving children one level up and removing the element)
    name?: string
    shouldUnfold: (element : Element) => boolean | undefined 
    propagateAttributes?: boolean
    log?: boolean
}

export interface ElementRemovePreChildrenRule extends Rule { // Rule for removing elements before their children are processed
    name?: string
    shouldRemove: (element : Element) => boolean | undefined
    log?: boolean
}

export interface ElementRemoveRule extends Rule { // Rule for removing elements after their children are processed
    name?: string
    shouldRemove: (el : Element) => boolean | undefined
    log?: boolean
}

export interface NodeRemoveRule extends Rule { // Rule for removing nodes
    name?: string
    shouldRemove: (el : Node) => boolean | undefined
    log?: boolean
}

export interface PreChildrenAction { // Action to be performed on an element before its children are processed
    name?: string
    action: (element : Element) => void
}

export interface RuleSet {
    elementUnfoldRules: ElementUnfoldRule[]
    elementRemovePreChildrenRules: ElementRemovePreChildrenRule[]
    nodeRemoveRules: NodeRemoveRule[]
    preChildrenActions: PreChildrenAction[]
}

// apply ruleset rules, simplifying the provided dom (inplace!)
const simplifyDom = (dom : Element, ruleSet: RuleSet, verbose = false) : Element => {
    
    const recursiveProcess = (node : Node) : boolean => {
        
        if (node instanceof Element) {
            let element : Element = node
            
            for (let rule of ruleSet.elementRemovePreChildrenRules) {
                if (rule.shouldRemove(element)) {
                    if (rule.log !== false && verbose) console.log('removing', element.getOriginalNode(), 'on basis of', rule.name)

                    element.remove()
                    return false
                }
            }

            for (let preChildrenAction of ruleSet.preChildrenActions) {
                preChildrenAction.action(node)
            }
        }  

        for (let child of Array.from(node.childNodes)) {
            recursiveProcess(child)
        }

        for (let rule of ruleSet.nodeRemoveRules) {
            if (rule.shouldRemove(node)) {
                if (rule.log !== false && verbose) console.log('removing', node, 'on basis of', rule.name)

                // remove node from parent
                node.parentNode?.removeChild(node)

                return false
            }
        }

        if (node instanceof Element) {
            let element : Element = node

            for (let rule of ruleSet.elementUnfoldRules) {
                if (rule.shouldUnfold(element)) {
                    if (rule.log !== false && verbose) console.log('unfolding', element.getOriginalNode(), 'on basis of', rule.name)

                    const children = element.unfold((child : Node) => {
                        if (child instanceof Element) {
                            // copy properties before the parent is removed
                            child.concatPropertiesFrom(element, 'ALL')
                        }
                    })

                    for (let child of children) {
                        // process nodes now with the new parent and properties
                        recursiveProcess(child) 
                    }
                }
            }
        }


        return true
    }

    recursiveProcess(dom)

    return dom
}

export default simplifyDom