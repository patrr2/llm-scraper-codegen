### DOM-simplifier
This package can be used to simplify a DOM (or HTML), for example for LLM usage. You can add custom rules for the simplification/processing pipeline.

For example, this library can transform Reddit's HTML of 1.15M characters to 139K characters which is almost **90% decrease in HTML size** without losing (almost) any relevant information for data scraping!

## Build injectable script
```
npm i
```
```
npm run build
```
then inject the `bundle.js` content to a webpage

## Example
Original html:
```
<body>
  <div>
    <div>
      <h1>Example Domain</h1>
    </div>
    <p>This domain is for use in illustrative examples in documents. You may use this
    domain in literature without prior coordination or asking for permission.</p>
    <p>
      <a class="no-underline" href="https://www.iana.org/domains/example">More information...</a>
    </p>
  </div>
</body>
```

Simplified html:
```
<body>
  <div>
    <h1>Example Domain</h1>
    This domain is for use in illustrative examples in documents. You may use this domain in literature without prior coordination or asking for permission.
    <a href="https://www.iana.org/domains/example">More information...</a>
  </div>
</body>
```

## Features
- a built in DOM tree cloning tool: you can simplify the DOM of a live website virtually, without breaking the website. References to the original nodes are saved!
- rules based on visibility (not offscreen/onscreen, but whether an element can be visible at all on an infinite screen)
- a rule for the removal of most common Tailwind classes
- support for ShadowRoot extraction to HTML (by default, shadowroots are not visibile in HTML output such as body.outerHTML)
