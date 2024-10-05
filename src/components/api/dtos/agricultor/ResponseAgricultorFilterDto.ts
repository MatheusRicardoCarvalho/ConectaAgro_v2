export interface ResponseAgricultorFilterDTO {
    id: number;
    nome: string | null;
    idade: number | null;
    cpf?: string;
    caf?: string;
    genero: string | null;
    localidade: string | null;
    telefone: string | null;
    email: string | null;
    escolaridade: string | null;
    tamanhoPropriedade: number | null;
    culturas: string[];
    thread: string[];
    municipioId: number;
    appId: number
}