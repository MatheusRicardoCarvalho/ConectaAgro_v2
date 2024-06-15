import { MessageUpsertType, WASocket, proto } from "@whiskeysockets/baileys";
import { isInstanceOfThread } from "../..";
import { findThreadIdByNumber, addNewThread } from "../../handleTrheads";
import { getThread, createMessage, executeRun } from "../../lib/openai";

interface MessageUpsert {
    messages: proto.IWebMessageInfo[];
    type: MessageUpsertType;
  }

export async function handleUpsert(m: MessageUpsert, sock: WASocket) {
    if (!m.messages || m.messages.length === 0) return;
  
    const message = m.messages[0];
    console.log('Aqui ------------' + JSON.stringify(m.messages) + '-----' + JSON.stringify(message));
  
    if (!message.message || message.key.fromMe) return;
  
    if ( message?.key?.remoteJid && message.key.remoteJid.endsWith('@g.us')) {
      return; // Ignorar mensagens enviadas em grupos
    }
  
    const isTextMessage = message.message.conversation;
    const isExtendedTextMessage = message.message.extendedTextMessage && message.message.extendedTextMessage.text;
  
    if (!isTextMessage && !isExtendedTextMessage) {
      return; // Ignorar mensagens que não sejam de texto simples ou texto estendido
    }
      
    const messageText = isTextMessage ? message.message.conversation : message.message.extendedTextMessage?.text || '';
  
    let resposta = '';
    const customerPhone =  message.key.remoteJid!.replace('@s.whatsapp.net', '');
    const customerKey = `customer:${customerPhone}:chat`;
    const threadId = findThreadIdByNumber(customerPhone);
    let thread;

    //if(customerPhone != "558788473508" && customerPhone != "558198386191") return SE NÃO FOR O NÚMERO DE TESTES OU O DE MARCELO NEGA A RESPOSTA
  
    console.log(JSON.stringify(threadId) + '');
  
    if (threadId 
        == null) {
      console.log('Vamos obter uma nova thread');
      thread = await addNewThread(customerPhone);
    } else {
      thread = await getThread(threadId);
    }
  
    if (isInstanceOfThread(thread)) {
      console.log('entrou aqui');
      if (messageText) createMessage(messageText, thread);
      resposta = await executeRun(thread) + '';
    } else {
      console.log(thread);
    }
  
    console.debug(customerPhone, '👤', messageText);
  
    if (messageText && messageText.toLowerCase() === 'finalizar') {
      await sock.sendMessage(message.key.remoteJid!, { text: 'Obrigado por entrar em contato. Qualquer dúvida, estou disponível!' });
      return;
    }
  
    await sock.sendMessage(message.key.remoteJid!, { text: resposta });
}