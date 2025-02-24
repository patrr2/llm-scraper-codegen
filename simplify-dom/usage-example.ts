import simplifyDom from './simplifyDom'
import prettifyXml from './prettifyXmlString'
import basicRuleSet from './basicRuleSet'

// @ts-ignore
window.simplifyDom = () => {
    const body = document.body.deepCloneWithReferencesAndShadows()
    const simplified = simplifyDom(body, basicRuleSet)
    return simplified
}

/*
const body = document.body.deepCloneWithReferencesAndShadows() // deep clone body, including references to original elements
const prettifiedOriginal = prettifyXml(body.outerHTML)

const bodySimplified = simplifyDom(body, basicRuleSet) // simplify the cloned body
//const prettifiedSimplified = prettifyXml(bodySimplified.outerHTML) // prettify the simplified body html string // todo: the html formatted sometimes fails (e.g. on reddit!)


console.log('DONE! Results: ')
console.log('Original html', prettifiedOriginal)
console.log('Simplified html', bodySimplified.outerHTML)
console.log('Simplified dom:', bodySimplified)

// @ts-ignore
window.simplifiedDom = bodySimplified

*/