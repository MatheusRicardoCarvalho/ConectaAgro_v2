import { Message, Whatsapp, create } from "venom-bot"
import { createMessage, executeRun, getThread, openai } from "./lib/openai"
import { conectaAgro } from "./prompts/conectaAgro"
import { addNewThread, findThreadIdByNumber } from "./handleTrheads"
import OpenAI from "openai"
import { Thread, Threads } from "openai/resources/beta/threads/threads"

/*interface ThreadOpenAi {
  id: string;
  object: string;
  created_at: number;
  metadata: Record<string, any>;
  tool_resources: Record<string, any>;
}*/


export function isInstanceOfThread(obj: any): obj is Thread {
  return 'id' in obj;
}

create({
  session: "GPZAP",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })

async function start(client: Whatsapp) {
  client.onMessage(async (message: Message) => {
    if (!message.body || message.isGroupMsg) return

    let resposta = ''
    const customerPhone = `+${message.from.replace("@c.us", "")}`
    const customerName = message.author
    const customerKey = `customer:${customerPhone}:chat`
    const threadId = findThreadIdByNumber(customerPhone)
    let thread: Thread | string
    console.log(JSON.stringify(threadId)+'')
    if(threadId == null){
      console.log('Vamos obter uma nova thread')
        thread = await addNewThread(customerPhone)
    } else thread = await getThread(threadId)
    
    
    if (isInstanceOfThread(thread)) {
      console.log("entrou aqui")
      createMessage(message.content, thread)
      resposta = await executeRun(thread)+''
    }else console.log(thread)
    
    

  console.debug(customerPhone, "👤", message.body)

  
  if(message.body.toLowerCase() === "finalizar"){

    await client.sendText(message.from, "Obrigado por entrar em contato. Qualquer dúvida, estou disponível!")
    return
  }

  //console.debug(customerPhone, "🤖", content)

  await client.sendText(message.from, resposta)
  
  //redis.set(customerKey, JSON.stringify(customerChat))

  })
}

console.log("Amigo, estou aqui");