import { WASocket } from "@whiskeysockets/baileys";
import { createThread } from "../../lib/openai";
import { MessageUpsert } from "../../whatsappEvents/messagesEvent/handleUpsert";
import { api } from "../api/api";
import { ResponseAgricultorFilterDTO } from "../api/dtos/agricultor/ResponseAgricultorFilterDto";
import { convertToRequestAgricultorFilterDTO } from "../api/mappers/agricultor/convertToRequestAgricultorFilterDTO";
import { getUser } from "../api/requests/get_or_create_user/getUser";
import { updateUser } from "../api/requests/update/updateUser";
import { Logger } from "../../logger/Logger";

interface LastMessageTimestamps {
  [user: string]: number;
}

let lastMessageTimestamp: LastMessageTimestamps = {};
const logger = new Logger();

// Função para atualizar o timestamp da última mensagem de um usuário
export function updateLastMessageTimestamp(m: MessageUpsert): void {
  const message = m.messages[0];
  lastMessageTimestamp[message.key.remoteJid + ""] = Date.now();
}

export function checkInactivity(sock: WASocket): void {
  const currentTime = Date.now();
  const inactiveThreshold = 10 * 60 * 1000; // 10 minutos

  for (const user in lastMessageTimestamp) {
    if (currentTime - lastMessageTimestamp[user] > inactiveThreshold) {
      console.log(`Usuário ${user} está inativo há mais de 5 minutos.`);
      const phoneUser = user.replace("@s.whatsapp.net", "");
      try {
        resetUserThread(phoneUser);
      } catch (error) {
        logger.error("" + error);
      }
      // Remover o usuário do rastreamento de inatividade
      delete lastMessageTimestamp[user];
      sock.sendMessage(user, {
        text: "Olá, percebi que você não mandou mais menssagens. Vou encerrar a conversa por aqui ok ?",
      });
    }
  }
}

export async function resetUserThread(
  phoneUser: string
): Promise<ResponseAgricultorFilterDTO> {
  // Implemente a lógica para redefinir a thread aqui
  console.log(`Redefinindo thread para o usuário ${phoneUser}.`);
  // Exemplo: fazer uma chamada à API da OpenAI
  try {
    const thread = await createThread();
    const newThread = thread.id;
    let user = (await getUser(
      phoneUser
    )) as unknown as ResponseAgricultorFilterDTO;
    console.log("USUARIO QUE VAI TER A THREAD RESETADA" + user);
    user.thread = [newThread];
    const newUser = convertToRequestAgricultorFilterDTO(user);
    const updatedUser = await updateUser(newUser, user.id);
    return updatedUser;
  } catch (error) {
    throw new Error("erro ao renovar a thread do usuário: " + error);
  }
}
