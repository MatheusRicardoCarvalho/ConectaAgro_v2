import { RequestAgricultorFilterDTO } from "../../dtos/agricultor/RequestAgricultorFilterDto";
import { ResponseAgricultorFilterDTO } from "../../dtos/agricultor/ResponseAgricultorFilterDto";

export function convertToRequestAgricultorFilterDTO(
  responseDto: ResponseAgricultorFilterDTO
): RequestAgricultorFilterDTO {
  return {
    id: responseDto.id,
    nome: responseDto.nome ?? undefined,
    idade: responseDto.idade ?? undefined,
    genero: responseDto.genero ?? undefined,
    localidade: responseDto.localidade ?? undefined,
    telefone: responseDto.telefone ?? undefined,
    email: responseDto.email ?? undefined,
    escolaridade: responseDto.escolaridade ?? undefined,
    tamanhoPropriedade: responseDto.tamanhoPropriedade?.toString() ?? undefined,
    culturas: responseDto.culturas.length > 0 ? responseDto.culturas : undefined,
    thread: responseDto.thread.length > 0 ? responseDto.thread : undefined,
    municipioId: responseDto.municipioId
  };
}
