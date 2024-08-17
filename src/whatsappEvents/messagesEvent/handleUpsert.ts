import { MessageUpsertType, WASocket, proto } from "@whiskeysockets/baileys";
import { isInstanceOfThread } from "../..";
import { findThreadIdByNumber, addNewThread } from "../../handleTrheads";
import { getThread, createMessage, executeRun } from "../../lib/openai";
import { getOrCreateUser } from "../../components/api/requests/get_or_create_user/getOrCreateUser";
import { ResponseAgricultorFilterDTO } from "../../components/api/dtos/agricultor/ResponseAgricultorFilterDto";
import { fluxoHandle } from "../../components/fluxo_handle/fluxoHandle";
import { resetUserThread, updateLastMessageTimestamp } from "../../components/talk_timeout/talk_timeout";
import { handleAudioMessage } from "./handleAudio";
import { Logger } from "../../logger/Logger";
import { addMessageToBuffer } from './messageBuffer';
import { synthesizeSpeech } from "../../utils/text-speech";

const logger = new Logger();

export interface MessageUpsert {
  messages: proto.IWebMessageInfo[];
  type: MessageUpsertType;
}

export async function handleUpsert(m: MessageUpsert, sock: WASocket) {
  logger.info("Resposta em processo: ");
  if (!m.messages || m.messages.length === 0) return;

  const message = m.messages[0];
  console.log(
    "Aqui ------------" +
      JSON.stringify(m.messages) +
      "\n-----" +
      JSON.stringify(message)
  );

  if (!message.message || message.key.fromMe) return;

  if (message?.key?.remoteJid && message.key.remoteJid.endsWith("@g.us")) {
    return; // Ignorar mensagens enviadas em grupos
  }

  const isTextMessage = message.message.conversation;
  const isExtendedTextMessage =
    message.message.extendedTextMessage &&
    message.message.extendedTextMessage.text;

  if (!isTextMessage && !isExtendedTextMessage && !message.message.audioMessage) {
    return; // Ignorar mensagens que não sejam de texto simples, texto estendido ou audio
  }

  let messageText = isTextMessage
    ? message.message.conversation
    : message.message.extendedTextMessage?.text || "";

  if (message.message.audioMessage) {
    console.log("recebi AUDIO\n\n");
    logger.debug("recebi AUDIO");
    try {
      messageText = await handleAudioMessage(m, sock);
    } catch(error) {
      await sock.sendMessage(message.key.remoteJid!, {
        text: "Não consegui entender seu audio, poderia falar novamente ?",
      });
      return
    }
  }
  let resposta = ''

  const customerPhone = message.key.remoteJid!.replace("@s.whatsapp.net", "");
  let user: ResponseAgricultorFilterDTO | undefined
  while(true){
    try {
      user = await getOrCreateUser(
      customerPhone,
      messageText!
    );
    break
    } catch(err) {
      logger.error("erro ao obter usuário, uma nova tentativa será feita: "+ err)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Aguarda 500 ms
    }
  }
    
  const threadId = user?.thread[0];
  let thread;
  
  addMessageToBuffer(customerPhone, messageText!, async (combinedMessage: string) => {
    const response = await fluxoHandle(user!, combinedMessage);

    if (response != "Todas as perguntas foram respondidas." && response != "fim questionario") {
      await sock.sendMessage(message.key.remoteJid!, { text: response });
      return;
    }

    if (threadId == null) {
      console.log("Vamos obter uma nova thread");
      const updatedUser = await resetUserThread(customerPhone);
      thread = await getThread(updatedUser.thread[0]);
    } else {
      thread = await getThread(threadId);
    }

    if (isInstanceOfThread(thread)) {
      if (combinedMessage) {
        if (response == "fim questionario") createMessage("ola", thread);
        else createMessage(combinedMessage, thread);
      }
      resposta = (await executeRun(thread, process.env.ASSISTANT_ID + "", user!)) + "";
    } else {
      console.log(thread);
    }
    console.debug(customerPhone, "👤", combinedMessage);

  if (combinedMessage && combinedMessage.toLowerCase() === "finalizar") {
    await sock.sendMessage(message.key.remoteJid!, {
      text: "Obrigado por entrar em contato. Qualquer dúvida, estou disponível!",
    });
    return;
  }

  //synthesizeSpeech(resposta)
  await sock.sendMessage(message.key.remoteJid!, { text: resposta });
  logger.info("Menssagem para "+customerPhone+" respondida")
  updateLastMessageTimestamp(m)
  });

  updateLastMessageTimestamp(m);
}
