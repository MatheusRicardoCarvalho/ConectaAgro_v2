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
    tamanhoPropriedade?: string | null;
    culturas?: string[];
    thread?: string[];
    municipioId?: number;
    appId?: number;
    questionarioBasico?: boolean
}
