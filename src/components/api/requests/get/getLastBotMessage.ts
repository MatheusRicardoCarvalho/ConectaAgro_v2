import { api } from "../../api";
import { RequestAgricultorFilterDTO } from "../../dtos/agricultor/RequestAgricultorFilterDto";
import { ResponseMessageDTO } from "../../dtos/message/ResponseMessageDto";

export async function getLastBotMessage(userId: number): Promise<ResponseMessageDTO> {
    try {
        const response = await api.get(`messages/lastBotMessage/${userId}`)
        console.log("ÚLTIMA MENSSAGEM: \n\n"+ JSON.stringify(response.data))
        return response.data
    } catch (error) {
        throw error
    }
}