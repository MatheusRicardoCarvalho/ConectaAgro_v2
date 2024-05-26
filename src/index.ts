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
      if (!message.message || message.key.fromMe) return;

      let resposta = '';
      const customerPhone = message.key.remoteJid!.replace('@s.whatsapp.net', '');
      //const customerName = message.key.from;
      const customerKey = `customer:${customerPhone}:chat`;
      const threadId = findThreadIdByNumber(customerPhone);
      let thread: Thread | string;

      console.log(JSON.stringify(threadId) + '');

      if (threadId == null) {
          console.log('Vamos obter uma nova thread');
          thread = await addNewThread(customerPhone);
      } else thread = await getThread(threadId);

      if (isInstanceOfThread(thread)) {
          console.log('entrou aqui');
          if(message?.message?.conversation) createMessage(message.message.conversation, thread);
          resposta = await executeRun(thread) + '';
      } else console.log(thread);

      console.debug(customerPhone, '👤', message.message.conversation);

      if (message?.message?.conversation && message.message.conversation.toLowerCase() === 'finalizar') {
          await sock.sendMessage(message.key.remoteJid!, { text: 'Obrigado por entrar em contato. Qualquer dúvida, estou disponível!' });
          return;
      }

      await sock.sendMessage(message.key.remoteJid!, { text: resposta });
  });
}
console.log("Por favor senhor me ajuda")
connectToWhatsApp();