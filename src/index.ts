import makeWASocket, { MessageUpsertType, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { useMultiFileAuthState, DisconnectReason  } from '@whiskeysockets/baileys';
import { Thread } from 'openai/resources/beta/threads/threads';
import { Boom } from '@hapi/boom'
import { handleUpsert } from './whatsappEvents/messagesEvent/handleUpsert';
import cron from 'node-cron'
import { whatsappTriggerIrrigacao } from './triggers/whatsappTriggerIrrigacao';

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
    await handleUpsert(m, sock)
  });
  
  cron.schedule('0 5 * * *', async () => {
    console.log('Chamando função whatsappTriggerIrrigacao...');
    await whatsappTriggerIrrigacao(sock); 
  });  

}

console.log("Por favor senhor me ajuda")
connectToWhatsApp();