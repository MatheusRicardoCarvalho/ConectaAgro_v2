import makeWASocket, { MessageUpsertType, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { useMultiFileAuthState, DisconnectReason  } from '@whiskeysockets/baileys';
import { Thread } from 'openai/resources/beta/threads/threads';
import { Boom } from '@hapi/boom'
import { handleUpsert } from './whatsappEvents/messagesEvent/handleUpsert';
import { startServer } from './server/server';
import cron from 'node-cron'
import { whatsappTriggerIrrigacao } from './triggers/whatsappTriggerIrrigacao';
import { checkInactivity } from './components/talk_timeout/talk_timeout';
import { Logger } from './logger/Logger';
import net from 'net';

export function isInstanceOfThread(obj: any): obj is Thread {
  return 'id' in obj;
}
const logger = new Logger();

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

  // Função para verificar se a porta está em uso
  function isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()
        .once('error', () => {
          resolve(true)
        })
        .once('listening', () => {
          server.close()
          resolve(false)
        })
        .listen(port)
    })
  }

  // Verificar se o servidor já está rodando
  const PORT = 4000; // ou qualquer porta que você esteja usando
  const serverAlreadyRunning = await isPortInUse(PORT);

  if (!serverAlreadyRunning) {
    // Servidor com API para interação com chatbot
    startServer(sock);
    console.log(`Servidor iniciado na porta ${PORT}`);
  } else {
    console.log(`Servidor já está rodando na porta ${PORT}`);
  }

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
    try{
      await handleUpsert(m, sock)
    } catch (error) {
      logger.error("Houve um erro no handleUpsert")

    }
  });
  
  cron.schedule('* * * * *', () => {
    checkInactivity(sock)
  });

  /*cron.schedule('0 5 * * *', async () => {
    console.log('Chamando função whatsappTriggerIrrigacao...');
    await whatsappTriggerIrrigacao(sock); 
  }); */ 

}

connectToWhatsApp();