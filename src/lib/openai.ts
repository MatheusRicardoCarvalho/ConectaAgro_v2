import OpenAI from "openai";
import * as dotenv from "dotenv";
import { ExecutionQueue } from "./ExecutionQueue";
import { Run } from "openai/resources/beta/threads/runs/runs";
import { ResponseAgricultorFilterDTO } from "../components/api/dtos/agricultor/ResponseAgricultorFilterDto";
dotenv.config();

const executionQueue = new ExecutionQueue();

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function getAssistant(assistantId: string) {
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
    return error + " - erro ao obter a thread";
  }
}

export async function createMessage(
  content: string,
  thread: OpenAI.Beta.Threads.Thread
) {
  const message = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: content,
  });
}

export async function executeRun(
  thread: OpenAI.Beta.Threads.Thread,
  assistanId: string,
  userData?: ResponseAgricultorFilterDTO
) {
  const assistant = await getAssistant(assistanId);
  let resposta = "";
  const userInfo = userData ? `
  Nome: ${userData.nome || "não informado"}
  Idade: ${userData.idade !== null ? userData.idade : "não informado"}
  Gênero: ${userData.genero || "não informado"}
  Localidade: ${userData.localidade || "não informado"}
  Telefone: ${userData.telefone || "não informado"}
  Email: ${userData.email || "não informado"}
  Escolaridade: ${userData.escolaridade || "não informado"}
  Tamanho da Propriedade: ${
    userData.tamanhoPropriedade !== null
      ? userData.tamanhoPropriedade
      : "não informado"
  }
  Culturas: ${
    userData.culturas.length > 0
      ? userData.culturas.join(", ")
      : "não informado"
  }
  ` : null;

  const instructions = userInfo ? `Aqui estão algumas informações básicas desse usuário: ${userInfo}` : null;
  console.log(instructions);

  await executionQueue.enqueue(async () => {
    try {
      const allRuns = await openai.beta.threads.runs.list(thread.id, {
        limit: 20,
        order: "desc",
      });
      console.log("Quantidade de runs: " + allRuns.data.length);
      console.log(
        "Run mais recente:",
        allRuns.data[0]?.status,
        " --- ",
        allRuns.data[0]?.id
      );

      // Verifica se alguma execução está em andamento
      let inProgressRun = allRuns.data.find(
        (run) =>
          run.status === "in_progress" ||
          run.status === "queued" ||
          run.status === "cancelling"
      );
      console.log("Run em progresso encontrada:", inProgressRun?.id);

      if (inProgressRun) {
        // Aguarda a execução em andamento ser concluída
        while (
          inProgressRun.status === "in_progress" ||
          inProgressRun.status === "queued" ||
          inProgressRun.status === "cancelling"
        ) {
          console.log(`Aguardando a run ${inProgressRun.id} ser concluída...`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const updatedRun = await openai.beta.threads.runs.retrieve(
            thread.id,
            inProgressRun.id
          );
          inProgressRun = updatedRun;
          console.log(
            `Status atualizado da run ${inProgressRun.id}: ${inProgressRun.status}`
          );
        }
      }

      let run;

      while (true) {
        try {
          run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: assistant.id,
            additional_instructions: instructions ? instructions : '',
          });
          break;
        } catch (error) {
          console.error("Erro ao criar e monitorar a run:", error);

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (run.status === "completed") {
        const messages = await openai.beta.threads.messages.list(run.thread_id);
        const lastMessage = messages.data[messages.data.length - 1];

        // Itera sobre o conteúdo da última mensagem
        for (const message of messages.data.reverse()) {
          if ("text" in message.content[0] && message.content[0].text) {
            console.log(message.content[0].text.value);
            resposta = message.content[0].text.value;
          }
        }
      } else if (run.status === "requires_action") {
        console.log(run.status);
        resposta += await handleRunStatus(run, thread);
      } else if (run.status === "incomplete") {
        console.log(run.status);
        resposta += "A resposta gerada foi INCOMPLETA";
      } else {
        console.log("Run status:", run.status);
        resposta =
          "Perdão, estou com muitas conversas e não consegui entender o que você quis dizer. Poderia repetir ?";
      }
    } catch (error) {
      console.error("Erro ao executar run:", error);
      throw error;
    }
  });

  return resposta;
}

async function handleRunStatus(
  run: Run,
  thread: OpenAI.Beta.Threads.Thread
): Promise<string | undefined> {
  try {
    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(thread.id);
      const lastMessage = messages.data[messages.data.length - 1];

      // Itera sobre o conteúdo da última mensagem
      for (const message of messages.data.reverse()) {
        if ("text" in message.content[0] && message.content[0].text) {
          //console.log("Resposta BOT: "+message.content[0].text.value);
          return message.content[0].text.value;
        }
      }
    } else if (run.status === "requires_action") {
      console.log(run.status);
      return await handleRequiresAction(run, thread);
    } else {
      console.log("Run status:", run.status);
      return "Perdão, estou com muitas conversas e não consegui entender o que você quis dizer. Poderia repetir ?";
    }
  } catch (error) {
    console.error("Erro ao executar run:", error);
    throw error;
  }
  return undefined;
}

async function handleRequiresAction(
  run: Run,
  thread: OpenAI.Beta.Threads.Thread
): Promise<string | undefined> {
  // Check if there are tools that require outputs
  if (
    run.required_action &&
    run.required_action.submit_tool_outputs &&
    run.required_action.submit_tool_outputs.tool_calls
  ) {
    // Loop through each tool in the required action section
    const toolOutputs = run.required_action.submit_tool_outputs.tool_calls
      .map((tool) => {
        if (tool.function.name === "getCurrentTemperature") {
          return {
            tool_call_id: tool.id,
            output: "57",
          };
        } else if (tool.function.name === "irrigacao") {
          const params = tool.function.arguments;
          console.log("parametros: \n\n" + params);
          return {
            tool_call_id: tool.id,
            output:
              "O agricultor precisa irrigar 0.8 mm de água na plantação de tomate",
          };
        }
        return undefined; // Explicitly return undefined for other cases
      })
      .filter(
        (toolOutput): toolOutput is { tool_call_id: string; output: string } =>
          toolOutput !== undefined
      ); // Filter out undefined values

    // Submit all tool outputs at once after collecting them in a list
    if (toolOutputs.length > 0) {
      run = await openai.beta.threads.runs.submitToolOutputsAndPoll(
        thread.id,
        run.id,
        { tool_outputs: toolOutputs }
      );
      console.log("Tool outputs submitted successfully.");
    } else {
      console.log("No tool outputs to submit.");
    }

    // Check status after submitting tool outputs
    return handleRunStatus(run, thread);
  }
  return undefined;
}
