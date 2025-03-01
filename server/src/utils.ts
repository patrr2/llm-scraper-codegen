export const truncate = (str : string, max_visible_len : number) => str.length > max_visible_len ? str.substr(0, max_visible_len - 1) + '...' : str

// LLMs give embedded javascript code blocks encapsualted with ```javascript\n...\n```
// This function extracts the code blocks from the LLM response
export const extractJSBlocks = (input : string, expect_n : null | number = null) : string[] => {
    const regex = /```javascript\n([\s\S]*?)\n```/g;
    let matches : any;
    const codeBlocks : any[] = [];
  
    while ((matches = regex.exec(input)) !== null) {
        codeBlocks.push(matches[1]);
    }
  
    if (expect_n !== null && codeBlocks.length !== expect_n) {
        console.error(`Expected exactly one block of code from LLM API, got ${codeBlocks.length}`)
        console.error(`Full LLM output text: ----------------\n${input}\n----------------`)
        throw new Error(`Expected exactly one block of code from LLM API, got ${codeBlocks.length}`)
    }

    return codeBlocks;
}

export type Js_StatementStr = string // a string representing a javascript statement, e.g. `document.querySelector('h1')`
export type Js_FnStatementStr = string // a string representing a javascript function statement, e.g. `() => document.querySelector('h1')`
export type JS_IIFEStr = string // a string representing an Immediately Invoked Function Expression, e.g. `(() => document.querySelector('h1'))()`

// This function evaluates a statement and gets a string representation of the result
// it is used for debugging
export const evalAndGetResult = (script : Js_StatementStr) => {
    const inner = (elOrAny) => {
      if (elOrAny === null) {
        return "null"
      }
    
      if (elOrAny === undefined) {
        return "undefined"
      }
    
      if (elOrAny instanceof Element) {
          const tagName = elOrAny.tagName.toLowerCase();
          const attributes = Array.from(elOrAny.attributes)
              .map(attr => `${attr.name}="${attr.value}"`)
              .join(" ");
          const childrenCount = elOrAny.children.length;
          return `<${tagName}${attributes ? " " + attributes : ""}>[child element count: ${childrenCount}]</${tagName}>`;
      }
      return JSON.stringify(elOrAny);
    }
  
    try {
      console.log('Evaluating string: ', script)
      let elOrAny = eval(script)
      console.log('Got resp: ', elOrAny)
  
      if (elOrAny instanceof NodeList) {
        let arr : any[] = Array.from(elOrAny)
        if (arr.length > 5) {
          arr = arr.slice(0, 5)
          arr.push('...')
        }
        return `[${arr.map(inner).join(", ")}]`;
      }
    
      if (Array.isArray(elOrAny)) {
        if (elOrAny.length > 5) {
          elOrAny = elOrAny.slice(0, 5)
          elOrAny.push('...')
        }
        return `[${elOrAny.map(inner).join(", ")}]`;
      }
    
      return inner(elOrAny);
  
    } catch(e : any) {
      return e.toString()
    } 
  };
  