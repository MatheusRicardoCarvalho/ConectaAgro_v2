import { fluxoHandle } from './fluxoHandle';
import { ResponseAgricultorFilterDTO } from "../api/dtos/agricultor/ResponseAgricultorFilterDto";
import { getLastBotMessage } from "../api/requests/get/getLastBotMessage";
import { createMessage } from "../api/requests/post/createMessage";
import { updateUser } from "../api/requests/update/updateUser";

// Mock das dependências
jest.mock("../api/requests/get/getLastBotMessage");
jest.mock("../api/requests/post/createMessage");
jest.mock("../api/requests/update/updateUser");

describe('fluxoHandle', () => {
  let mockUser: ResponseAgricultorFilterDTO;

  beforeEach(() => {
    mockUser = {
      id: 40,
      nome: null,
      idade: null,
      genero: null,
      localidade: null,
      email: null,
      escolaridade: null,
      tamanhoPropriedade: null,
      culturas: [],
      telefone: '5555555555',
      thread: [''],
      municipioId: 1
    };

    (getLastBotMessage as jest.Mock).mockResolvedValue(null);
    (createMessage as jest.Mock).mockResolvedValue({});
    (updateUser as jest.Mock).mockResolvedValue({});
  });

  it('deve retornar a primeira pergunta quando nenhum campo foi preenchido', async () => {
    const result = await fluxoHandle(mockUser, null);
    expect(result).toContain('Qual é o seu nome?');
  });

  it('deve passar para a próxima pergunta após uma resposta válida', async () => {
    mockUser.nome = 'João';
    const result = await fluxoHandle(mockUser, '30');
    expect(result).toContain('Qual é o seu gênero?');
  });

  it('deve solicitar uma resposta válida quando a entrada for inválida', async () => {
    mockUser.nome = 'João';
    const result = await fluxoHandle(mockUser, 'idade inválida');
    expect(result).toContain('Resposta inválida');
    expect(result).toContain('Qual é a sua idade?');
  });

  it('deve aceitar "não informar" como resposta válida', async () => {
    mockUser.nome = 'João';
    mockUser.idade = -1;
    const result = await fluxoHandle(mockUser, 'não informar');
    expect(result).toContain('Qual é a sua localidade?');
  });

  it('deve finalizar o questionário após responder todas as perguntas', async () => {
    mockUser = {
      id: 40,
      nome: 'João',
      idade: 30,
      genero: 'masculino',
      localidade: 'Sítio X',
      email: 'joao@email.com',
      escolaridade: 'ensino médio',
      tamanhoPropriedade: 10,
      culturas: [],
      thread: [''],
      municipioId: 1,
      telefone: '5555555555'
    };
    const result = await fluxoHandle(mockUser, 'banana, maçã');
    expect(result).toBe('fim questionario');
  });

  it('deve lidar corretamente com respostas para gênero', async () => {
    mockUser.nome = 'João';
    mockUser.idade = 30;
    const result = await fluxoHandle(mockUser, '2');
    expect(result).toContain('Qual é a sua localidade?');
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ genero: 'feminino' }),
      40 // Alterado de '1' para 40
    );
  });

  it('deve lidar corretamente com respostas para escolaridade', async () => {
    mockUser = {
      ...mockUser,
      nome: 'João',
      idade: 30,
      genero: 'masculino',
      localidade: 'Sítio X',
      email: 'joao@email.com'
    };
    const result = await fluxoHandle(mockUser, '3');
    expect(result).toContain('Qual é o tamanho da sua propriedade em hectares?');
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ escolaridade: 'ensino médio' }),
      40 // Alterado de '1' para 40
    );
  });

  it('deve lidar corretamente com respostas para tamanho da propriedade', async () => {
    mockUser = {
      ...mockUser,
      nome: 'João',
      idade: 30,
      genero: 'masculino',
      localidade: 'Sítio X',
      email: 'joao@email.com',
      escolaridade: 'ensino médio'
    };
    const result = await fluxoHandle(mockUser, '10,5');
    expect(result).toContain('Quais culturas você cultiva?');
    expect(updateUser).toHaveBeenCalledWith(
      expect.objectContaining({ tamanhoPropriedade: 10.5 }),
      40 // Alterado de '1' para 40
    );
  });
});
