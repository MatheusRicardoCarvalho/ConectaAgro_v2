import { api } from "../../api";
import { RequestAgricultorFilterDTO } from "../../dtos/agricultor/RequestAgricultorFilterDto";
import { ResponseAgricultorFilterDTO } from "../../dtos/agricultor/ResponseAgricultorFilterDto";

export async function updateUser(data: RequestAgricultorFilterDTO, userId: number): Promise<ResponseAgricultorFilterDTO> {
    try {
        const response: ResponseAgricultorFilterDTO = await api.put(`agricultor/${userId}`, data)
        return response
    } catch (error) {
        throw error
    }
}