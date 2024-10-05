import { openai, getAssistant, createThread, getThread, createMessage, executeRun } from './openai';
import { ExecutionQueue } from './ExecutionQueue';
import { ResponseAgricultorFilterDTO } from '../components/api/dtos/agricultor/ResponseAgricultorFilterDto';
import { Thread } from 'openai/resources/beta/threads/threads';
import { Assistant } from 'openai/resources/beta/assistants';
import { MessagesPage } from 'openai/resources/beta/threads/messages';
import { RunsPage, Run } from 'openai/resources/beta/threads/runs/runs';

// Mock do módulo OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      beta: {
        assistants: {
          retrieve: jest.fn(),
        },
        threads: {
          create: jest.fn(),
          retrieve: jest.fn(),
          messages: {
            create: jest.fn(),
            list: jest.fn(),
          },
          runs: {
            list: jest.fn(),
            retrieve: jest.fn(),
            createAndPoll: jest.fn(),
          },
        },
      },
    })),
  };
});

// Mock da ExecutionQueue
jest.mock('./ExecutionQueue');

describe('OpenAI functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAssistant', () => {
    it('deve recuperar um assistente', async () => {
      const mockAssistant = { id: 'assistant-id' };
      const mockRetrieve = jest.fn().mockResolvedValue(mockAssistant);
      openai.beta.assistants.retrieve = mockRetrieve;

      const result = await getAssistant('assistant-id');
      expect(result).toEqual(mockAssistant);
      expect(mockRetrieve).toHaveBeenCalledWith('assistant-id');
    });
  });

  describe('createThread', () => {
    it('deve criar uma nova thread', async () => {
      const mockThread = { id: 'thread-id' };
      const mockCreate = jest.fn().mockResolvedValue(mockThread);
      openai.beta.threads.create = mockCreate;

      const result = await createThread();
      expect(result).toEqual(mockThread);
      expect(mockCreate).toHaveBeenCalled();
    });
  });

  describe('getThread', () => {
    it('deve recuperar uma thread', async () => {
      const mockThread = { id: 'thread-id' };
      const mockRetrieve = jest.fn().mockResolvedValue(mockThread);
      openai.beta.threads.retrieve = mockRetrieve;

      const result = await getThread('thread-id');
      expect(result).toEqual(mockThread);
      expect(mockRetrieve).toHaveBeenCalledWith('thread-id');
    });

    it('deve lidar com erros ao recuperar uma thread', async () => {
      const mockError = new Error('Thread não encontrada');
      jest.spyOn(openai.beta.threads, 'retrieve').mockRejectedValue(mockError);

      const result = await getThread('id-invalido');
      expect(result).toContain('erro ao obter a thread');
    });
  });

  describe('createMessage', () => {
    it('deve criar uma mensagem em uma thread', async () => {
      const mockMessage = { id: 'message-id', role: 'user', content: 'Hello' };
      const mockCreate = jest.fn().mockResolvedValue(mockMessage);
      openai.beta.threads.messages.create = mockCreate;

      const mockThread = { id: 'thread-id' } as Thread;
      await createMessage('Hello', mockThread);

      expect(openai.beta.threads.messages.create).toHaveBeenCalledWith('thread-id', {
        role: 'user',
        content: 'Hello',
      });
    });
  });

  describe('executeRun', () => {
    it('should execute a run and return a response', async () => {
      const mockThread = { id: 'thread-id' };
      const mockAssistant = { id: 'assistant-id' };
      const mockRun = { id: 'run-id', status: 'completed', thread_id: 'thread-id' };
      const mockMessages = {
        data: [
          { content: [{ text: { value: 'Response from assistant' } }] },
        ],
      };

      jest.spyOn(openai.beta.assistants, 'retrieve').mockResolvedValue(mockAssistant as Assistant);
      jest.spyOn(openai.beta.threads.runs, 'list').mockResolvedValue({ data: [] } as unknown as RunsPage);
      jest.spyOn(openai.beta.threads.runs, 'createAndPoll').mockResolvedValue(mockRun as Run);
      jest.spyOn(openai.beta.threads.messages, 'list').mockResolvedValue(mockMessages as MessagesPage);

      const mockUserData: ResponseAgricultorFilterDTO = {
          nome: 'John Doe',
          idade: 30,
          genero: 'Masculino',
          localidade: 'São Paulo',
          telefone: '1234567890',
          email: 'john@example.com',
          escolaridade: 'Superior',
          tamanhoPropriedade: 100,
          culturas: ['Milho', 'Soja'],
          id: 0,
          thread: [],
          municipioId: 0,
          appId: 1
      };

      const result = await executeRun(mockThread as Thread, 'assistant-id', mockUserData);

      expect(result).toBe('Response from assistant');
      expect(openai.beta.assistants.retrieve).toHaveBeenCalledWith('assistant-id');
      expect(openai.beta.threads.runs.createAndPoll).toHaveBeenCalled();
      expect(openai.beta.threads.messages.list).toHaveBeenCalledWith('thread-id');
    });

    // Adicione mais testes para cobrir diferentes cenários de executeRun
    // como runs que requerem ação, runs incompletas, etc.
  });
});
