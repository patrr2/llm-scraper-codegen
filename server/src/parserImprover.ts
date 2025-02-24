import { Page } from "puppeteer";
import { extractJSBlocks, Js_StatementStr, truncate } from "../src/utils";
import { getDataUsingParser, Parser } from "../src/buildIteratedParser";
import llmApi from "../src/llmApi";

const getParserStatusPrompt = (parserResult: any) => `
I used the parser and it returned the following result: ${JSON.stringify(parserResult)}.
Go through each field and think whether the output is expected or not, and why not.
In the end, if no problems were found, say "[PARSER COMPLETED]". Otherwise, say "[NEEDS A FIX]". Only say "[NEEDS A FIX]" if you can explicitly point out a field that is not correctly valued. Do not output fixed parser code yet.
I will give you useful debug information, which you can then use to give me the modified parser code.
`

const getParserDebugPrompt = (debugResult: string) => `
You said that the parser needs improvement, so here is the debug information that might help you fix the parser:
${debugResult}
Now, output the modified parser code.
`

const debugPrompt = `Your task it to extract statements from a script that might be helpful for debugging. Your output should be a javascript array contianing evaluteable strings. Each string should be executeable from the console, and should make sense as a standalone evaluation (don't just take stuff from a nested map without thinking). Only give one javascript block output. That block should be an immediately executing function. Use the variable simpleDocument instead of document for accessing the dom root!

Example input:
;(() => {
    const popularCommunitiesList = simpleDocument.getElementById("popular-communities-list");
    if (!popularCommunitiesList) {
        return [];
    }

    const subredditLinks = Array.from(popularCommunitiesList.querySelectorAll("li > ul > li > a"));
    
    const recommendedSubreddits = subredditLinks.map(link => {
        const iconElement = link.querySelector(".shreddit-subreddit-icon__icon")?.querySelector("img");
        const nameElement = link.querySelector(".shrink:nth-child(2)");

        return {
            href: link.href,
            iconSrc: iconElement ? iconElement.src : "",
            name: nameElement ? nameElement.textContent : "",
        };
    });

    return recommendedSubreddits;
})();

Example output:
\`\`\`javascript
[
"simpleDocument.getElementById('popular-communities-list')",
"popularCommunitiesList.querySelectorAll('li > ul > li > a')",
"Array.from(popularCommunitiesList.querySelectorAll('li > ul > li > a'))[0]?.querySelector('.shreddit-subreddit-icon__icon')?.querySelector('img')",
"Array.from(popularCommunitiesList.querySelectorAll('li > ul > li > a'))[0]?.querySelector('.shrink:nth-child(2)')"
]
\`\`\`
`

export const doesParserNeedImprovementAuto = async (parser: Parser, page : Page) : Promise<boolean> => {
    const result = await getDataUsingParser(page, parser)

    return doesParserNeedImprovement(parser, result)
}

export const doesParserNeedImprovement = async (parser: Parser, result : any) : Promise<boolean> => {
    console.log(`Checkign if parser needs improvement for parser with explanation: ${parser.explanation}`)

    const prompt = getParserStatusPrompt(result)

    parser.buildingMessages = [
        ...parser.buildingMessages,
        { role: "user", content: prompt }
    ]

    const debugResult = await llmApi(parser.buildingMessages, parser.buildingMessages, 'anthropic/claude-3.5-sonnet:floor')

    if (debugResult.includes('[NEEDS A FIX]')) {
        return true
    }

    if (debugResult.includes('[PARSER COMPLETED]')) {
        return false
    }

    // Error handling
    console.error('Got unexpected response from LLM API when checking if parser needs improvement:', debugResult)
    console.error(`Prompt was: ${prompt}`)
    console.error(`Parser was: ${parser.parser}`)

    throw new Error('Unexpected response from LLM API when checking if parser needs improvement')
}

export const getDebugPartialStatements = async (parser: Parser) : Promise<Js_StatementStr[]> => {
    console.log(`Getting debug info for parser with explanation: ${parser.explanation}`)

    const prompt = debugPrompt

    const respText = await llmApi([
        { role: "system", content: prompt },
        { role: "assistant", content: parser.parser }
    ], [], 'anthropic/claude-3.5-sonnet:floor')

    const resultBlocks = extractJSBlocks(respText, 1)

    const jsStringResult = resultBlocks[0]

    const jsArray = eval(jsStringResult)

    return jsArray /* Array of statements */
}

export const getDebugInfoString = async (parser: Parser, page : Page, partialStatements : Js_StatementStr[]) : Promise<string> => {
    console.log(`Getting debug info string for parser with explanation: ${parser.explanation}`)

    let debugInfo : string[] = []

    for (let evalStr of partialStatements) {
        const actualEval = `evalAndGetResult(${'`'}${evalStr}${'`'})`
        console.log('evaluating:', actualEval)
        let evaluationResult = await page.evaluate(actualEval)
        debugInfo.push(`Evaluation of ${evalStr}: ${evaluationResult}`)
    }

    console.log('Got debug info:', debugInfo)

    return debugInfo.join('\n')
}

export const getImprovedParser = async (parser: Parser, debugInfoString : string) : Promise<Parser> => {
    console.log(`Getting improved parser for parser with explanation: ${parser.explanation}`)

    const prompt = getParserDebugPrompt(debugInfoString)

    parser.buildingMessages = [
        ...parser.buildingMessages,
        { role: "user", content: prompt }
    ]

    const respText = await llmApi(parser.buildingMessages, parser.buildingMessages, 'anthropic/claude-3.5-sonnet:floor')

    const resultBlocks = extractJSBlocks(respText, 1)

    const jsStringResult = resultBlocks[0]

    parser.parser = jsStringResult

    return parser
}

// NOTE: this function assumes that the parser result is already in the message log to the llm
// it is usually adde from doesParserNeedImprovement() call
export const improveParserAuto = async (parser: Parser, page : Page) : Promise<Parser> => {
    console.log(`Improving parser for HTML segment (html segments explanation: '${parser.explanation}')`)

    const partials = await getDebugPartialStatements(parser)
    const debugInfoString = await getDebugInfoString(parser, page, partials)
    const improvedParser = await getImprovedParser(parser, debugInfoString)

    return improvedParser
}
