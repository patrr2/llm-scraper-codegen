

/*
.env configurable things:
1. Enter openrouter api key
1. select bug protection price limit


1. Select website
    - user input: website url
1. Wishes for the parser creator about html segmentation
1. select html segment / target element group
    - user sees the website (puppeteer) with neon-rected elements and their titles
    - user selects the target element group in interactive console multicheckbox form
1. Wishes for the parser creator about data extraction (looped for each element)
1. run!
1. Users wishes for amendments
1. run improvement on wishes
1. ready!

*/


import { checkbox, Separator } from '@inquirer/prompts';
import { input } from '@inquirer/prompts';

import extractHTMLSegments from './src/extractHTMLSegments';
import infiniteBrowserSession from './src/infiniteBrowserSession';
import { buildIteratedParser } from './src/buildIteratedParser';
import fs from 'fs'
import jsyaml from 'js-yaml'

const getTimestampFileName = () => new Date().toISOString().replaceAll(':', '.')
const timeout = async (ms: number) => new Promise(res => setTimeout(res, ms))

;(async () => {
    console.log('This tool will generate a javascript-based content scraper/parser for a website.')
    console.log('This tool only works for websites that require no authentication and require no user interaction to display the relevant content.')
    const targetURL = await input({ message: 'Target URL to create parser(s)', default: 'https://reddit.com'});
    await timeout(1000)

    console.log('Which segments of the page do you want to scrape? Describe the largest containers that you want to scrape (e.g. product listings). Do not yet describe the individual values inside the segments (e.g. price and product name). Leave this empty for LLM to auto detect the best segments. After the LLM has analysed the HTML, you can still do a final confirmation of the desired segments.')
    const wishesForHTMLSegmentation = await input({ message: 'Wishes for target elements/segments (natural language input, leave empty for auto)'})
    //console.log('This tool will now analyse the target page. Please wait. You will be shortly prompted for details.')

    // create a directory for this session
    const sessionDir = `./savedParsers/${getTimestampFileName()}`
    fs.mkdirSync(sessionDir)


    console.log('Loading the target page...')
    const { page, browser } = await infiniteBrowserSession(targetURL)
    const html = await page.evaluate("simpleDocument.outerHTML")! as string
    console.log('Analysing the target page using LLM...')
    const {
        result: segments,
        logs: segmentLogs
    } = await extractHTMLSegments(page, html, wishesForHTMLSegmentation)

    fs.writeFileSync(`${sessionDir}/logs-segments.yaml`, jsyaml.dump({ extractedSegments: segments, generationLogs: segmentLogs}), 'utf8')

    console.log(`Found ${segments.length} segments on the page.`)
    const selectedSegments = await checkbox({
        message: 'Select target segments to create parsers for',
        choices: segments.map(x => ({name: x.name, value: x.explanation})),
        theme: {
          helpMode: 'always'
        }
    });

    const segmentsFiltered = segments.filter(x => selectedSegments.includes(x.explanation))


    for (const segment of segmentsFiltered) {
        console.log(`Generating parser for segment: ${segment}`)

        const parser = await buildIteratedParser(segment, page)
        
        console.log('Final parser:')
        console.log(parser.parser)

        console.log('Writing to disk')
        fs.writeFileSync(`${sessionDir}/logs-parser-${segment.name}.yaml`, jsyaml.dump(parser.buildingMessages), 'utf8')
        fs.writeFileSync(`${sessionDir}/parser-${segment.name}.js`, parser.parser, 'utf8')
    }

    console.log('All parsers generated')
    console.log(`Data was written to ${sessionDir}`)


})()

/*

finish this with demo outputs

*/