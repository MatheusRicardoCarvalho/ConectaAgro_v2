import OpenAI from "openai";
import * as dotenv from 'dotenv';
import { ExecutionQueue } from "./ExecutionQueue";
dotenv.config();

const executionQueue = new ExecutionQueue();

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAssistant() {
  const assistantId = process.env.ASSISTANT_ID + '';
  const assistant = await openai.beta.assistants.retrieve(assistantId);
  return assistant;
}

export async function createThread() {
  const thread = await openai.beta.threads.create();
  return thread;
}

export async function getThread(threadId: string) {
  try {
    const thread = await openai.beta.threads.retrieve(threadId);
    return thread;
  } catch (error) {
    return error + ' - erro ao obter a thread';
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

  await executionQueue.enqueue(async () => {
    try {
      const allRuns = await openai.beta.threads.runs.list(thread.id, { limit: 20, order: 'desc' });
      console.log("Quantidade de runs: " + allRuns.data.length);
      console.log("Run mais recente:", allRuns.data[0]?.status, ' --- ', allRuns.data[0]?.id);

      // Verifica se alguma execução está em andamento
      let inProgressRun = allRuns.data.find((run) => run.status === 'in_progress');
      console.log("Run em progresso encontrada:", inProgressRun?.id);

      if (inProgressRun) {
        // Aguarda a execução em andamento ser concluída
        while (inProgressRun.status === 'in_progress') {
          console.log(`Aguardando a run ${inProgressRun.id} ser concluída...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, inProgressRun.id);
          inProgressRun = updatedRun;
          console.log(`Status atualizado da run ${inProgressRun.id}: ${inProgressRun.status}`);
        }
      }

      // Crie uma nova run
      let run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        { assistant_id: assistant.id }
      );

      if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        const lastMessage = messages.data[messages.data.length - 1];

        // Itera sobre o conteúdo da última mensagem
        for (const message of messages.data.reverse()) {
          if ('text' in message.content[0] && message.content[0].text) {
            console.log(message.content[0].text.value);
            resposta = message.content[0].text.value;
          }
        }
      } else {
        console.log("Run status:", run.status);
        resposta = "Perdão, estou com muitas conversas e não consegui entender o que você quis dizer. Poderia repetir ?"
      }

    } catch (error) {
      console.error("Erro ao executar run:", error);
      throw error;
    }
  });

  return resposta;
}