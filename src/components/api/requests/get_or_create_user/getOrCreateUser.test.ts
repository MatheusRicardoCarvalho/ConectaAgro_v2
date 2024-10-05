import { getOrCreateUser } from "./getOrCreateUser";
import { api } from "../../api";
import { createUser } from "./createUser";

// Mock da API e da função createUser
jest.mock("../../api");
jest.mock("./createUser");

describe('getOrCreateUser', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve criar um novo usuário se o usuário não existir', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: [],
        });
        (createUser as jest.Mock).mockResolvedValueOnce({ thread: true });

        const user = await getOrCreateUser('5555555555', 'test', 1);
        expect(user).toBeDefined();
        expect(createUser).toHaveBeenCalledWith('5555555555', 'test');
    });

    it('deve retornar um usuário existente', async () => {
        const existingUser = { telefone: '5555555555', thread: true };
        (api.post as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: [existingUser],
        });

        const user = await getOrCreateUser('5555555555', 'test', 1);
        expect(user).toEqual(existingUser);
        expect(createUser).not.toHaveBeenCalled();
    });

    it('deve lançar um erro se a requisição falhar com erro 500', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({
            status: 500,
            data: { message: 'Erro interno do servidor' },
        });

        await expect(getOrCreateUser('5555555555', 'test', 1)).rejects.toThrow('Erro 500: Erro interno do servidor');
    });

    it('deve lançar um erro se a requisição falhar sem resposta do servidor', async () => {
        (api.post as jest.Mock).mockRejectedValueOnce({
            request: {},
        });

        await expect(getOrCreateUser('5555555555', 'test', 1)).rejects.toThrow('Não houve resposta do servidor');
    });

    it('deve lançar um erro se a requisição falhar ao configurar', async () => {
        (api.post as jest.Mock).mockRejectedValueOnce({
            message: 'Erro ao configurar a requisição',
        });

        await expect(getOrCreateUser('5555555555', 'test', 1)).rejects.toThrow('Erro ao configurar requisição');
    });

    it('deve lançar um erro se não for possível criar o usuário', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({
            status: 200,
            data: [],
        });
        (createUser as jest.Mock).mockResolvedValueOnce(undefined);

        await expect(getOrCreateUser('5555555555', 'test', 1)).rejects.toThrow('Não foi possível criar usuário');
    });
});