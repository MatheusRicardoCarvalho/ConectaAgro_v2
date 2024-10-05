import { createThread } from "../../../../lib/openai";
import { api } from "../../api";
import { RequestAgricultorFilterDTO } from "../../dtos/agricultor/RequestAgricultorFilterDto";
import { ResponseAgricultorFilterDTO } from "../../dtos/agricultor/ResponseAgricultorFilterDto";

export async function getUser(telefone: string, cpf?: string): Promise<any | undefined> {
    const thread = [(await createThread()).id];
    const data: RequestAgricultorFilterDTO = cpf ? {cpf} : { telefone };
    try {
        const response = await api.post('/agricultor/filter', data);
        return response.data[0] as any;
    } catch (error: any) {
        if (error.response) {
            // O servidor retornou um status de erro
            console.error("Erro ao obter usuário:", error.response.data);
            throw new Error(`Erro ${error.response.status}: ${error.response.data.message}`);
        } else if (error.request) {
            // A requisição foi feita, mas não houve resposta do servidor
            console.error("Não houve resposta do servidor:", error.request);
            throw new Error("Não houve resposta do servidor");
        } else {
            // Algo aconteceu durante a configuração da requisição
            console.error("Erro ao configurar requisição:", error.message);
            throw new Error("Erro ao configurar requisição");
        }
    }
}
