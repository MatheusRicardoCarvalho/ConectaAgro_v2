import { handleUpsert, MessageUpsert } from './handleUpsert';
import { proto } from '@whiskeysockets/baileys';
import { addMessageToBuffer } from './messageBuffer';

// Mock das dependências
jest.mock('../../components/api/requests/get_or_create_user/getOrCreateUser', () => ({
  getOrCreateUser: jest.fn().mockResolvedValue({
    id: 1,
    thread: ['thread-id-1'],
  }),
}));

jest.mock('../../components/fluxo_handle/fluxoHandle', () => ({
  fluxoHandle: jest.fn().mockResolvedValue('Todas as perguntas foram respondidas.'),
}));

jest.mock('./messageBuffer', () => ({
  addMessageToBuffer: jest.fn((phone, message, callback) => callback(message)),
}));

jest.mock('../../lib/openai', () => ({
  getThread: jest.fn().mockResolvedValue({}),
  createMessage: jest.fn(),
  executeRun: jest.fn().mockResolvedValue('Resposta do assistente'),
}));

describe('testa respostas do handleUpsert', () => {
  let mockSocket: any;

  beforeEach(() => {
    mockSocket = {
      sendMessage: jest.fn(),
    };

    jest.clearAllMocks();
  });

  it('deve ignorar mensagens que não são de texto', async () => {
    const message: MessageUpsert = {
      messages: [{
        key: {
          remoteJid: '1234567890@s.whatsapp.net',
          fromMe: false,
        },
        message: {
          imageMessage: {},
        },
      }],
      type: 'notify',
    };

    const result = await handleUpsert(message, mockSocket, false);

    expect(result).toEqual({ success: false, error: 'Tipo de mensagem não suportado' });
    expect(mockSocket.sendMessage).not.toHaveBeenCalled();
  });

  it('deve responder a mensagens de texto', async () => {
    const message: MessageUpsert = {
      messages: [{
        key: {
          remoteJid: '1234567890@s.whatsapp.net',
          fromMe: false,
        },
        message: {
          conversation: 'Olá',
        },
      }],
      type: 'notify',
    };

    const result = await handleUpsert(message, mockSocket, false);

    expect(result).toEqual({ success: true, response: 'Resposta do assistente' });
    // Note que não estamos mais verificando se sendMessage foi chamado,
    // pois isso foi comentado no código original
  });

  it('deve lidar com erros ao processar mensagens', async () => {
    const message: MessageUpsert = {
      messages: [{
        key: {
          remoteJid: '1234567890@s.whatsapp.net',
          fromMe: false,
        },
        message: {
          conversation: 'Erro',
        },
      }],
      type: 'notify',
    };

    jest.spyOn(console, 'error').mockImplementation(() => {});
    (addMessageToBuffer as jest.Mock).mockImplementation((phone, message, callback) => {
      callback(message);
      throw new Error('Erro de teste');
    });

    const result = await handleUpsert(message, mockSocket, false);

    expect(result).toEqual({ success: false, error: 'Erro ao processar mensagem' });
  });

  it('deve ignorar mensagens de grupos', async () => {
    const message: MessageUpsert = {
      messages: [{
        key: {
          remoteJid: '1234567890@g.us',
          fromMe: false,
        },
        message: {
          conversation: 'Mensagem de grupo',
        },
      }],
      type: 'notify',
    };

    const result = await handleUpsert(message, mockSocket, false);

    expect(result).toEqual({ success: false, error: 'Mensagem de grupo ignorada' });
  });
});
