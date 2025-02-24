const extractionPrompt = `Your task is to find out which elments on an website could be relavant for a parser. You should output explanations and selectors. If the data structure on the website is repeated multiple times, make sure that the selector matches to all of the elements on the page. Use the variable  \`simpleDocument\` instead of \`document\` for accessing the dom root!

Example input:
[HTML sample]

Example output:
\`\`\`javascript
[
{
  selectorFn: () => simpleDocument.querySelectorAll('.listing'),
  explanation: "All product listings on the page"
},
{
  selectorFn: () => simpleDocument.querySelector('#footer'),
  explanation "The footer of the page"
}
]
\`\`\`
`

import llmApi from '../src/llmApi'
import { extractJSBlocks, truncate } from '../src/utils'
import { Page } from 'puppeteer'

type HtmlSegmentSelectorFn = () => NodeListOf<Element> | (Element | null)[] | Element | null

interface HTMLSegmentSelector {
    selectorFn: HtmlSegmentSelectorFn,
    explanation: string,
}

const getHTMLSegmentSelectors = async (html : string) : Promise<HTMLSegmentSelector[]> => {
    console.log('Building selectors for extracting segments from HTML')

    const resultText = await llmApi([{
        role: "developer",
        content: extractionPrompt
    }, {
        role: "user",
        content: html
    }], [], 'google/gemini-2.0-flash-001')

    const resultBlocks = extractJSBlocks(resultText, 1)

    const jsStringResult = resultBlocks[0]
    const jsArrayResult = eval(jsStringResult)

    console.log('Done building selectors for extracting segments from HTML')

    return jsArrayResult
}

export interface HTMLSegment {
    htmlString: string,
    selectorFn: HtmlSegmentSelectorFn,
    explanation: string,
}

const getHTMLSegments = async (page : Page, selectors : HTMLSegmentSelector[]) : Promise<HTMLSegment[]> => {
    const htmlStrings : HTMLSegment[] = []

    for (const selector of selectors) {
        const htmlSegmentString = await page.evaluate((selectorFnString) => {
            let selectorFn : any = undefined
            let elements : any = undefined

            try {
                selectorFn = eval(selectorFnString)
                elements = selectorFn()
            } catch(e) {
                console.error('Error evaluating selector function:', e)
                return `[Error: e.toString()]`
            }

            if (elements instanceof NodeList) {
                let list : string[] = Array.from(elements).map((el) => 'outerHTML' in el ? el.outerHTML : el.textContent) as string[]

                // get first 5 if total length of first three is more than 10000
                if (list.slice(0, 5).reduce((acc, el) => acc + el.length, 0) > 10000) {
                    list = list.slice(0, 5)
                    list.push('...')
                }

                return list.join('\n')

            } else if (elements instanceof Array) {
                return elements.map(el => el?.outerHTML).join('\n')
            } else if (elements instanceof Element) {
                return elements.outerHTML
            } else {
                return elements.textContent
            }

        }, selector.selectorFn.toString())


        htmlStrings.push({
            htmlString: htmlSegmentString,
            explanation: selector.explanation,
            selectorFn: selector.selectorFn,
        })
    }

    console.log(`Populated ${htmlStrings.length} HTML segments from page. Example: "${truncate(htmlStrings[0].htmlString, 50)}"`)

    return htmlStrings
}


export default async (page : Page, html : string) : Promise<HTMLSegment[]> => {
    const selectors = await getHTMLSegmentSelectors(html)
    const segments = await getHTMLSegments(page, selectors)

    return segments
}