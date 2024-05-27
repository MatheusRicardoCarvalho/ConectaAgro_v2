import makeWASocket, { fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { useMultiFileAuthState, DisconnectReason  } from '@whiskeysockets/baileys';
import { createMessage, executeRun, getThread } from './lib/openai';
import { conectaAgro } from './prompts/conectaAgro';
import { addNewThread, findThreadIdByNumber } from './handleTrheads';
import { Thread } from 'openai/resources/beta/threads/threads';
import { Boom } from '@hapi/boom'

export function isInstanceOfThread(obj: any): obj is Thread {
  return 'id' in obj;
}

async function connectToWhatsApp() {
  const {state, saveCreds} = await useMultiFileAuthState('gpzap')
  const {version} = await fetchLatestBaileysVersion()
  const sock = makeWASocket({
    printQRInTerminal: true,
    auth: state,
    generateHighQualityLinkPreview: true,
    keepAliveIntervalMs: 5000,
    version,
    connectTimeoutMs: 60_000,
    emitOwnEvents: false
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('conexão fechada devido a ', lastDisconnect?.error, ', reconectando ', shouldReconnect);
        // reconectar se não estiver desconectado
        if (shouldReconnect) {
            await connectToWhatsApp();
        }
    } else if (connection === 'open') {
        console.log('conexão aberta');
    }
});

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async (m) => {
    if (!m.messages || m.messages.length === 0) return;
  
    const message = m.messages[0];
    console.log('Aqui ------------' + JSON.stringify(m.messages) + '-----' + JSON.stringify(message));
  
    if (!message.message || message.key.fromMe) return;
  
    // Verificar se a mensagem é enviada por uma pessoa (não em um grupo)
    if ( message?.key?.remoteJid && message.key.remoteJid.endsWith('@g.us')) {
      return; // Ignorar mensagens enviadas em grupos
    }
  
    // Verificar se a mensagem é de texto simples ou texto estendido
    const isTextMessage = message.message.conversation;
    const isExtendedTextMessage = message.message.extendedTextMessage && message.message.extendedTextMessage.text;
  
    if (!isTextMessage && !isExtendedTextMessage) {
      return; // Ignorar mensagens que não sejam de texto simples ou texto estendido
    }
  
    // Extrair o texto da mensagem
    
    const messageText = isTextMessage ? message.message.conversation : message.message.extendedTextMessage?.text || '';
  
    let resposta = '';
    const customerPhone =  message.key.remoteJid!.replace('@s.whatsapp.net', '');
    const customerKey = `customer:${customerPhone}:chat`;
    const threadId = findThreadIdByNumber(customerPhone);
    let thread;
  
    console.log(JSON.stringify(threadId) + '');
  
    if (threadId == null) {
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
  });
  
}
console.log("Por favor senhor me ajuda")
connectToWhatsApp();