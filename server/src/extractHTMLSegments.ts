const getExtractionPrompt = (wishes : string = "") => `Your task is to find out which elements or element groups on an website could be relavant for a parser. You should output names, explanations and selectors. If the desired element on the website is repeated multiple times, make sure that the selector matches to all of the elements on the page. Use the variable  \`simpleDocument\` instead of \`document\` for accessing the dom root!

${ wishes ? `Wishes from user for elements to create an entry for: ${wishes}` : ''}

Example input:
[HTML sample]

Example output:
\`\`\`javascript
[
{
  name: "Product listings",
  selector: "simpleDocument.querySelectorAll('.listing')",
  explanation: "All product listings on the page"
},
{
  name: "Footer",
  selector: "simpleDocument.querySelector('#footer')",
  explanation "The footer of the page"
}
]
\`\`\`
`

import llmApi, { OpenRouterMessage } from '../src/llmApi'
import { extractJSBlocks, Js_StatementStr, truncate } from '../src/utils'
import { Page } from 'puppeteer'

interface HTMLSegmentSelector {
    name: string,
    selector: Js_StatementStr,
    explanation: string,
}

const getHTMLSegmentSelectors = async (html : string, wishes : string = "") : Promise<{
    result: HTMLSegmentSelector[],
    logs: {
        messages: OpenRouterMessage[],
        extractedJSBlocks: string[]
    }
}> => {
    console.log('Building selectors for extracting segments from HTML')

    const messages = [{
        role: "developer",
        content: getExtractionPrompt(wishes)
    }, {
        role: "user",
        content: html
    }]

    const resultText = await llmApi(messages, messages, 'google/gemini-2.0-flash-001')

    const resultBlocks = extractJSBlocks(resultText, 1)

    const jsStringResult = resultBlocks[0]
    const jsArrayResult = eval(jsStringResult)

    console.log('Done building selectors for extracting segments from HTML')

    return {
        result: jsArrayResult,
        logs: {
            messages: messages,
            extractedJSBlocks: resultBlocks
        }
    }
}

export interface HTMLSegment {
    name: string,
    htmlString: string,
    selector: Js_StatementStr,
    explanation: string,
}

const getHTMLSegments = async (page : Page, selectors : HTMLSegmentSelector[]) : Promise<HTMLSegment[]> => {
    const htmlStrings : HTMLSegment[] = []

    for (const selector of selectors) {
        const htmlSegmentString = await page.evaluate((selectorJsString) => {
            let elements : any = undefined

            try {
                console.log('Evaluating selector function:', selectorJsString)
                elements = eval(selectorJsString)
                console.log('got res', elements)
            } catch(e : any) {
                console.error('Error evaluating selector function:', e)
                return `[Error: ${e.toString()}]`
            }

            if (elements === null) {
                return 'null'
            }

            if (elements === undefined) {
                return 'undefined'
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

        }, selector.selector)


        htmlStrings.push({
            name: selector.name,
            htmlString: htmlSegmentString,
            explanation: selector.explanation,
            selector: selector.selector,
        })
    }

    console.log(`Populated ${htmlStrings.length} HTML segments from page. Example: "${truncate(htmlStrings[0].htmlString, 50)}"`)

    return htmlStrings
}


export default async (page : Page, html : string, wishes : string = "") : Promise<{
    result: HTMLSegment[],
    logs: Awaited<ReturnType<typeof getHTMLSegmentSelectors>>['logs']
}> => {
    const {result: selectors, logs: segmentLogs} = await getHTMLSegmentSelectors(html, wishes)
    const segments = await getHTMLSegments(page, selectors)

    return {
        result: segments,
        logs: segmentLogs
    }
}