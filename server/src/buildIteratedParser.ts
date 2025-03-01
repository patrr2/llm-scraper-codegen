const contextPrompt = `You task is to create a parser from a website's HTML sample that is given to you. A parser can target data structures like listings, nav buttons etc. Use the variable simpleDocument instead of document for accessing the dom root! For each parser, give a following style code block (immediately executing function) in javascript:

\`\`\`javascript
// Parser
;(() => {
    // example, doesn't have to be this format:
    const els = simpleDocument.queryeSelectorAll(".link")
    return els.map(el => ({
        field1: el.querySelector('text'),
        filed2: el.children.length,
    })
})();
\`\`\`

Wait for the next message to get the HTML sample. Only output one parser per message!`

import { Page } from 'puppeteer'
import { extractJSBlocks, JS_IIFEStr, Js_StatementStr } from './utils'
import llmApi, { OpenRouterMessage } from './llmApi'
import { HTMLSegment } from './extractHTMLSegments'
import { doesParserNeedImprovement, doesParserNeedImprovementAuto, improveParserAuto } from './parserImprover'

export interface Parser {
    explanation: string,
    buildingMessages: OpenRouterMessage[],
    parser: JS_IIFEStr
}

export const buildInitialParserFromHTMLSegment = async (htmlSegment : HTMLSegment) : Promise<Parser> => {
    console.log(`Building parser for HTML segment (html segments explanation: '${htmlSegment.explanation}')`)

    const messagesToSend = [
        { role: "developer", content: contextPrompt },
        { role: "user", content: htmlSegment.htmlString }
    ]

    const resultText = await llmApi(messagesToSend, messagesToSend, 'anthropic/claude-3.5-sonnet')

    const resultBlocks = extractJSBlocks(resultText)

    const jsStringResult = resultBlocks[0]

    console.log(`Got parser code: "${jsStringResult}"`)

    return {
        explanation: htmlSegment.explanation,
        buildingMessages: messagesToSend,
        parser: jsStringResult
    }
}

export const getDataUsingParser = async (page : Page, parser : Parser) : Promise<any> => {
    console.log(`Running parser on page (with explanation ${parser.explanation})`)

    let result : any = null
    try {
        result = await page.evaluate(parser.parser)
    } catch(e : any) {
        result = `[Error: ${e.toString()}]`
    }

    console.log('Got parser result:', result)

    return result // output e.g. [{...}, {...}, ...], {...} etc. depending on the parser
}

export const buildIteratedParser = async (htmlSegment : HTMLSegment, page : Page, max_iterations = 10) : Promise<Parser> => {
    console.log(`Building iterated parser for HTML segment (html segments explanation: '${htmlSegment.explanation}')`)

    const parser = await buildInitialParserFromHTMLSegment(htmlSegment)

    for (let i = 0; i < max_iterations; i++) {
        const needsImprovement = await doesParserNeedImprovementAuto(parser, page)

        if (!needsImprovement) {
            console.log(`Parser does not need improvement (iterations: ${i})`)
            break
        }

        await improveParserAuto(parser, page)
    }

    // console.log('Final parser from iteration process: ', parser)

    return parser
}