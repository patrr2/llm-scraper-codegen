import {truncate} from './utils'
import 'dotenv/config'

export type OpenRouterMessage = {
    role: string,
    content: string
}

const openRouterRequest = async (messages: any[], messages_to_push_to : OpenRouterMessage[] = [], model = "google/gemini-2.0-flash-001") => {
    if (messages.length === 0) {
        throw new Error('Got empty messages array to send to LLM API')
    }

    const apikey = process.env.OPENROUTER_API_KEY

    model = model + ":floor" // route model by cheapest price
    console.log(`Calling LLM API with messages list of length ${messages.length} and model ${model}. The latest message is of length ${messages.at(-1).content.length}: "${truncate(messages.at(-1).content, 50)}"`)
  
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apikey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages
      }),
    })
  
    const respJson = await resp.json();
    const respText = respJson.choices[0].message.content

    messages_to_push_to.push({role: "assistant", content: respText})
  
    console.log(`Got response from LLM API of length ${respText.length}: "${truncate(respText, 5000)}"`)
  
    return respText;
}

export default openRouterRequest