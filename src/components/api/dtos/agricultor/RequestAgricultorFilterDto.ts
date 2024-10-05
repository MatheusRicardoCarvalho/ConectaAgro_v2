export interface RequestAgricultorFilterDTO {
    id?: number;
    nome?: string;
    cpf?: string;
    caf?: string;
    idade?: number;
    genero?: string;
    localidade?: string;
    telefone?: string;
    email?: string | null;
    escolaridade?: string;
    tamanhoPropriedade?: number | null;
    culturas?: string[];
    thread?: string[];
    municipioId?: number;
    appId?: number
}
