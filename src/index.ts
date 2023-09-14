import { Message, Whatsapp, create } from "venom-bot"
import { ChatCompletionRequestMessage } from "openai"
import { config } from "./config"
import { openai } from "./lib/openai"
import { conectaAgro } from "./prompts/conectaAgro"
import { redis } from "./lib/redis"

interface CustomerChat {
  status?: "open" | "closed"
  //orderCode: string
  chatAt: string
  customer: {
    name: string
    phone: string
  }
  messages: ChatCompletionRequestMessage[]
  //orderSummary?: string
}

const customerChat: ChatCompletionRequestMessage[] = [{
  role: "system",
  content: conectaAgro
}]

async function completion(messages: ChatCompletionRequestMessage[]): Promise<string | undefined> 
{
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    max_tokens: 256,
    messages,
  })

  return completion.data.choices[0].message?.content
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

    const customerPhone = `+${message.from.replace("@c.us", "")}`
    const customerName = message.author
    const customerKey = `customer:${customerPhone}:chat`
    const lastChat = JSON.parse((await redis.get(customerKey)) || "[]") // carrega a conversa do cliente do Redis
    
    const customerChat: CustomerChat =
    lastChat?.status === "open"
      ? (lastChat as CustomerChat) // carrega a mensagem do cliente do Redis ou crie uma nova
      : {
          status: "open",
          chatAt: new Date().toISOString(),
          customer: {
            name: customerName,
            phone: customerPhone,
          },
          messages: [
            {
              role: "system",
              content: conectaAgro,
            },
          ]
        }

  console.debug(customerPhone, "👤", message.body)

  customerChat.messages.push({
    role: "user",
    content: message.body,
  })

  
  if(message.body.toLowerCase() === "finalizar"){
    customerChat.status = "closed"
    await client.sendText(message.from, "Obrigado por entrar em contato. Qualquer dúvida, estou disponível!")
    return
  }
  const content = (await completion(customerChat.messages)) || "Não entendi..."

  customerChat.messages.push({
    role: "assistant",
    content,
  })

  console.debug(customerPhone, "🤖", content)

  await client.sendText(message.from, content)
  
  redis.set(customerKey, JSON.stringify(customerChat))

  })
}

console.log("Amigo, estou aqui");