import puppeteer, { Browser, Page } from 'puppeteer'
import fs from 'fs'
import { evalAndGetResult } from './utils'

export default async (url : string = 'https://www.reddit.com/') : Promise<{ page : Page, browser : Browser}> => {
  console.log(`Creating new browser session to url ${url}`)

  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({ headless: false, devtools: true });
  const page = await browser.newPage();

  // Navigate the page to a URL
  await page.goto(url);

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  // Inject simplify-dom script
  await page.evaluate(fs.readFileSync('../simplify-dom/build/bundle.js', 'utf8'));

  // Inject functions
  await page.evaluate("evalAndGetResult = " + evalAndGetResult.toString())

  console.log(`Waiting for page to be fully ready (5s static timeout)`)

  // wait for page to be fully ready
  await new Promise((resolve) => setTimeout(resolve, 5000))

  console.log(`Simplifying dom using simplify-dom script`)

  // Simplify dom:
  await page.evaluate("window.simpleDocument = window.simplifyDom();")
  
  await new Promise((resolve) => setTimeout(resolve, 5000))

  console.log(`New browser session complete (with simplified dom) to url ${url}`)

  return {
    page,
    browser
  }
}