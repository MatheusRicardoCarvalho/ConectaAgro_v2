import OpenAI from "openai"
import * as dotenv from 'dotenv';
dotenv.config();

export const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY})

export async function getAssistant() {
  const assistantId = process.env.ASSISTANT_ID+''
  const assistant = await openai.beta.assistants.retrieve(assistantId)
  return assistant
}

export async function createThread(){
  //try {
    console.log("Estamos criando a thread")
    const thread = await openai.beta.threads.create();
  return thread
  /*} catch (error) {
    console.log(error)
    return error+'Erro ao criar a thread'
  }*/
}

export async function getThread(threadId: string){
  try {
    const thread = await openai.beta.threads.retrieve(threadId);
    return thread
  } catch (error) {
    return error+' - erro ao obter a thread'
  }
}

export async function createMessage(content: string, thread: OpenAI.Beta.Threads.Thread) {
  const message = await openai.beta.threads.messages.create(
    thread.id,
    {
      role: "user",
      content: content
    }
  );
}

export async function executeRun(thread: OpenAI.Beta.Threads.Thread) {
  const assistant = await getAssistant();
  let resposta = '';

  let run = await openai.beta.threads.runs.createAndPoll(
    thread.id,
    { 
      assistant_id: assistant.id,
    }
  );

  if (run.status === 'completed') {
    const messages = await openai.beta.threads.messages.list(
      run.thread_id
    );

    const lastMessage = messages.data[messages.data.length - 1];

    // Itera sobre o conteúdo da última mensagem
    for (const message of messages.data.reverse()) {
      if ('text' in message.content[0] && message.content[0].text) {
        console.log(message.content[0].text.value);
        resposta = message.content[0].text.value;
      }
    }
  } else {
    console.log(run.status);
  }

  return resposta;
}

