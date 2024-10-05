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
import { isAuthorizedApp, isNumeric } from "../../utils/tools";
import dotenv from "dotenv"
import { AuthorizedApp } from "../../server/@server/types";
import { RequestMessageDTO } from "../../components/api/dtos/message/RequestMessageDto";
import { createMessageConectaApi } from "../../components/api/requests/post/createMessage";

dotenv.config()

const logger = new Logger();

export interface MessageUpsert {
  messages: proto.IWebMessageInfo[];
  type?: MessageUpsertType;
}

interface HandleUpsertResult {
  success: boolean;
  error?: string;
  response?: string;
}

export async function handleUpsert(m: MessageUpsert, sock: WASocket, appId?: number, cpf?: string): Promise<HandleUpsertResult> {
  let dataMessageHistory: RequestMessageDTO

  logger.info("Resposta em processo: ");
  if (!m.messages || m.messages.length === 0) return { success: false, error: "Nenhuma mensagem recebida" };

  const message = m.messages[0];
  console.log(
    "Aqui ------------" +
      JSON.stringify(m.messages) +
      "\n-----" +
      JSON.stringify(message)
  );

  if (!message.message || message.key.fromMe) return { success: false, error: "Mensagem inválida ou enviada pelo próprio bot" };

  if (message?.key?.remoteJid && message.key.remoteJid.endsWith("@g.us")) {
    return { success: false, error: "Mensagem de grupo ignorada" };
  }

  const isTextMessage = message.message.conversation;
  const isExtendedTextMessage =
    message.message.extendedTextMessage &&
    message.message.extendedTextMessage.text;

  if (!isTextMessage && !isExtendedTextMessage && !message.message.audioMessage) {
    return { success: false, error: "Tipo de mensagem não suportado" };
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
      /*await sock.sendMessage(message.key.remoteJid!, {
        text: "Não consegui entender seu audio, poderia falar novamente ?",
      });*/
      updateLastMessageTimestamp(m);
      return { success: false, error: "Erro ao processar audio" };
    }
  }
  let resposta = '';

  const customerPhone = message.key.remoteJid?.replace("@s.whatsapp.net", "") || "";
  let user: ResponseAgricultorFilterDTO | undefined
  while(true){
    const myAppId = appId ? appId : 1
    try {
      user = await getOrCreateUser(
      customerPhone,
      messageText!,
      myAppId,
      cpf
    );
    
    break
    } catch(err) {
      logger.error("erro ao obter usuário, uma nova tentativa será feita: "+ err)
      await new Promise((resolve) => setTimeout(resolve, 500)); // Aguarda 500 ms
    }
  }
  


  const threadId = user?.thread[0];
  let thread;

  if(user && messageText){
    dataMessageHistory = {agricultor: {connect: {id: user.id}}, conteudo: messageText, remetente: 'USER'}
  
    await createMessageConectaApi(dataMessageHistory)
  }

  return new Promise((resolve) => {
    addMessageToBuffer(customerPhone, messageText!, async (combinedMessage: string) => {
      try {
        let response: string
        if (customerPhone != "" && isNumeric(customerPhone)) response = await fluxoHandle(user!, combinedMessage);
        else response = "Todas as perguntas foram respondidas.";

        console.log("response MOCK TESTE JEST: "+response)
        if (response != "Todas as perguntas foram respondidas." && response != "fim questionario") {
          await sock.sendMessage(message.key.remoteJid!, { text: response });
          return { success: true, response: response };
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
          try{
            resposta = (await executeRun(thread, process.env.ASSISTANT_ID + "", user!)) + "";
          } catch(error) {
            resposta = "Perdão, estou com muitas conversas e não consegui entender o que você quis dizer. Poderia repetir ?";
            if(customerPhone != "" && !isAuthorizedApp(customerPhone) && desativarRespostas()) await sock.sendMessage(message.key.remoteJid!, { text: resposta });
            logger.error("Menssagem para "+customerPhone+" respondida com erro: "+error)
            updateLastMessageTimestamp(m)
            
            let dataMessage: RequestMessageDTO
        if(user){
          dataMessage = {agricultor: {connect: {id: user.id}}, conteudo: resposta, remetente: 'BOT'}
        
          await createMessageConectaApi(dataMessage)
        } 
            return { success: false, response: resposta };

          }

        } else {
          console.log(thread);
        }

        console.debug(customerPhone, "👤", combinedMessage);
        const appAuthorizedApi: AuthorizedApp[] = JSON.parse(process.env.APP_AUTHORIZED_API as string);
const appAuthorized = appAuthorizedApi[0]
        console.log("QUAL O ERRO ? : "+isAuthorizedApp(customerPhone)+"\n\n Aqui o nome: "+appAuthorized.app)
        //synthesizeSpeech(resposta)
        if(customerPhone != "" && !isAuthorizedApp(customerPhone) && desativarRespostas()) await sock.sendMessage(message.key.remoteJid!, { text: resposta });
        logger.info("Menssagem para "+customerPhone+" respondida")
        updateLastMessageTimestamp(m)
        if(user){
          dataMessageHistory = {agricultor: {connect: {id: user.id}}, conteudo: resposta, remetente: 'BOT'}
        
          await createMessageConectaApi(dataMessageHistory)
        } 
        resolve({ success: true, response: resposta });
      } catch (error) {
        logger.error("Erro ao processar mensagem: " + error);
        resolve({ success: false, error: "Erro ao processar mensagem" });
      }
    });
  });
}

function desativarRespostas(){
  return false
}