import { Thread } from "openai/resources/beta/threads/threads";
import { createMessage, executeRun } from "../../lib/openai";
import { ResponseAgricultorFilterDTO } from "../api/dtos/agricultor/ResponseAgricultorFilterDto";
import dotenv from "dotenv"
import { isInstanceOfThread } from "../..";

dotenv.config()


export async function fluxoHandle(messageUser: string | null | undefined, thread: Thread, userId: number): Promise<string>{
  createMessage(messageUser+'', thread)
  const resposta = (await executeRun(thread, process.env.ASSISTANT_ID + "", undefined, userId)) + "";
  //const resposta = 'apenas uma resposta genérica'
  return resposta
}