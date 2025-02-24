# LLM scraper code generation with TS

The purpose of this LLM-powered project is to generate scrapers. This is a tech demo, and not currently intended for out-of-the-box usage.

### Defining a scraper
In this project's context, a scraper is a function such as
```javascript
() => {
    const els = document.queryeSelectorAll(".link")
    return els.map(el => ({
        field1: el.querySelector('text'),
        filed2: el.children.length,
    })
}
```
Generally speaking, a scraper extracts useful data from a website. In this project, a scraper more specifically extracts useful data from a website's DOM tree's snapshot.

### Warning ⚠️🚨
This project is currently in research/exploration stage. The risk of unexpected behavior is higher than in a typical released product.

### Usage
1. Clone the whole repository
2. run `pnpm i` in `server/` and `simplify-dom/`
3. run `npm run build` in `simplify-dom/`
4. in `server/` copy and fill `.env.example` to `.env`
5. run `server/test/testBench.ts` with for example `ts-node` (run from `server/`)

This will use approximately $0.03-$0.20 of OpenRouter credits, depending on how many improvement iterations the script makes.

## See it in action
The file `usage-example.ts` will generate a parser for stackoverflow.com's front page. Here is the output from running the function:

```javascript
(() => {
    const questions = simpleDocument.querySelectorAll('.s-post-summary');
    
    return Array.from(questions).map(question => {
        // Get stats - strip non-numeric characters before parsing
        const stats = {
            votes: parseInt(question.querySelector('.s-post-summary--stats-item__emphasized').textContent.replace(/\D/g, '')) || 0,
            answers: parseInt(question.querySelector('.s-post-summary--stats-item:nth-child(2)').textContent.replace(/\D/g, '')) || 0,
            views: parseInt(question.querySelector('.s-post-summary--stats-item:nth-child(3)').textContent.replace(/\D/g, '')) || 0
        };

        // Get title and link
        const titleElement = question.querySelector('.s-post-summary--content-title a');
        const title = titleElement.textContent;
        const link = titleElement.getAttribute('href');

        // Get tags
        const tags = Array.from(question.querySelectorAll('.s-post-summary--meta-tags .s-tag'))
            .map(tag => tag.textContent);

        // Get user info - handle comma-separated numbers for reputation
        const userCard = question.querySelector('.s-user-card');
        const userInfo = {
            name: userCard.querySelector('.s-user-card--link').textContent,
            reputation: parseInt(userCard.querySelector('.s-user-card--rep')?.textContent.replace(/,/g, '')) || 0,
            timeAgo: userCard.querySelector('.s-user-card--time').textContent
        };

        return {
            title,
            link,
            stats,
            tags,
            userInfo
        };
    });
})();
```
The generated code is intended to be used on the ["simplified dom"](https://github.com/patrr2/simplify-dom) of Stackoverflow, not the actual live page. However, this scraper happens to work on the live page also, with the small fix of changing `simpleDocument` to `document`.

### Generated iterations
1. **First iteration**: ❌ User's reputation doesn't parse correctly (it parses 3,358 -> 3 instead of 3,358 -> 3358)
1. **Second iteration**: ✅ No problems 

### LLM call log:

| Time | Task | Model | Cost |
|----------|----------|----------|----------|
| 03:14:55 AM   | Extract useful HTML segments from the full page | gemini-2.0-flash-001  | $0.00212 |
| 03:15:04 AM   | Generate the first version of the scraper   | claude-3.5-sonnet   | $0.0222   |
| 03:15:09 AM   | Reason whether the execution result of the scraper matches the desired result (no, there is a problem)   | claude-3.5-sonnet   | $0.0237   |
| 03:15:13 AM   | Extract partial statements out of the scraper code for debugging purposes   | claude-3.5-sonnet   | $0.00862   |
| 03:15:22 AM   | Generate the second version of the scraper using the scraper's execution result and partial debug statement-evaluation pairs   | claude-3.5-sonnet   | $0.0316   |
| 03:15:42 AM   | Reason whether the execution result of the scraper matches the desired result (yes, it does)   | claude-3.5-sonnet   | $0.0337   |

Total cost: $0,12194. One goal of this project is to bring the cost down.
