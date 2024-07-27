import { api } from "../../api";
import { RequestAgricultorFilterDTO } from "../../dtos/agricultor/RequestAgricultorFilterDto";
import { ResponseAgricultorFilterDTO } from "../../dtos/agricultor/ResponseAgricultorFilterDto";
import { RequestMessageDTO } from "../../dtos/message/RequestMessageDto";
import { ResponseMessageDTO } from "../../dtos/message/ResponseMessageDto";

export async function createMessage(data: RequestMessageDTO): Promise<ResponseMessageDTO> {
    try {
        const response = await api.post(`messages`, data)
        return response.data
    } catch (error) {
        throw error
    }
}