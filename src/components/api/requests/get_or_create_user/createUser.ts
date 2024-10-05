import { AxiosResponse } from "axios";
import { createThread } from "../../../../lib/openai";
import { api } from "../../api";
import { RequestAgricultorFilterDTO } from "../../dtos/agricultor/RequestAgricultorFilterDto";
import { ResponseAgricultorFilterDTO } from "../../dtos/agricultor/ResponseAgricultorFilterDto";
import { createMessageConectaApi } from "../post/createMessage";
import { RequestMessageDTO } from "../../dtos/message/RequestMessageDto";

export async function createUser(telefone: string, userMessage: string, appId: number, cpf?: string): Promise<ResponseAgricultorFilterDTO | undefined> {
    const thread = [(await createThread()).id];
    const data: RequestAgricultorFilterDTO = { telefone, municipioId: 1, appId, cpf,thread };
    try {
        const response: AxiosResponse = await api.post('/agricultor', data);
        const user: ResponseAgricultorFilterDTO = response.data
        const dataMessage: RequestMessageDTO = {agricultor: {connect: {id: user.id}}, conteudo: userMessage, remetente: 'USER'}
        const responseCreateMessage = await createMessageConectaApi(dataMessage)//assincrono
        return  user;
    } catch (error: any) {
        if (error.response) {
            // O servidor retornou um status de erro
            console.error("Erro ao criar usuário:", error.response.data);
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
