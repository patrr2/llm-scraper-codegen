import extractHTMLSegments from '../src/extractHTMLSegments'
import infiniteBrowserSession from '../src/infiniteBrowserSession'
import { buildIteratedParser } from '../src/buildIteratedParser';

(async () => {
    const { page, browser } = await infiniteBrowserSession('https://stackoverflow.com/')

    const html = await page.evaluate("simpleDocument.outerHTML")! as string

    const segments = await extractHTMLSegments(page, html)
    const firstSegment = segments[0]

    console.log(`First segment: ${firstSegment.explanation}`)

    const parser = await buildIteratedParser(firstSegment, page)

    console.log('Total output:')
    console.log(parser.parser)
})()