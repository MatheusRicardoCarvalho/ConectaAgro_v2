import { api } from "../../api";
import { RequestAgricultorFilterDTO } from "../../dtos/agricultor/RequestAgricultorFilterDto";
import { ResponseAgricultorFilterDTO } from "../../dtos/agricultor/ResponseAgricultorFilterDto";
import { createUser } from "./createUser";

export async function getOrCreateUser(telefone: string, userMessage: string): Promise<ResponseAgricultorFilterDTO | undefined> {
    const data: RequestAgricultorFilterDTO = { telefone };
    try {
        const result = await api.post("agricultor/filter", data);
        console.log("ENTROU NO FLUXOHANDLER \n\n"+JSON.stringify(result.data));

        if (!result.data[0]) {
            const user = await createUser(telefone, userMessage);
            console.log("Retorno: \n\n"+ JSON.stringify(user));

            if (user === undefined) {
                throw new Error("Não foi possível criar usuário");
            }
            console.log("CRIOU UM USUARIO: \n\n"+ JSON.stringify(user));
            return user.thread ? user : undefined;
        }

        console.log("USUARIO EXISTENTE: \n\n"+ JSON.stringify(result.data[0]));

        return result.data[0] ? result.data[0] : undefined;
    } catch (error: any) {
        if (error.response) {
            // O servidor retornou um status de erro
            console.error("Erro na requisição:", error.response.data);
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
